// This file (ConsultationController) handles the medical data entered during a doctor's visit.
// It manages Vitals (like Blood Pressure), Prescriptions, and Lab Test orders.
using MediCore.API.Infrastructure.Database.Context;
using MediCore.API.Modules.Laboratory.Models;
using MediCore.API.Modules.OPD.Models;
using MediCore.API.Modules.Finance.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediCore.API.Modules.OPD.Controllers
{
    [ApiController]
    [Route("api/consultation")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,Doctor,Nurse,Receptionist")]
    public class ConsultationController : ControllerBase
    {
        private readonly MediCoreDbContext _context;

        public ConsultationController(MediCoreDbContext context)
        {
            _context = context;
        }

        // GET api/consultation/{appointmentId}
        [HttpGet("{appointmentId}")]
        public async Task<IActionResult> GetConsultationData(int appointmentId)
        {
            var vitals = await _context.Vitals.Where(v => v.AppointmentId == appointmentId).ToListAsync();
            var prescriptions = await _context.Prescriptions.Where(p => p.AppointmentId == appointmentId).ToListAsync();
            var labOrders = await _context.LabOrders.Where(l => l.AppointmentId == appointmentId).ToListAsync();

            var appointment = await _context.Appointments.FindAsync(appointmentId);
            var patientUserId = appointment?.PatientUserId;

            return Ok(new
            {
                success = true,
                data = new { vitals, prescriptions, labOrders, patientUserId }
            });
        }

        // POST api/consultation/vitals
        // This function saves a patient's vital signs (like height, weight, BP, and temperature).
        [HttpPost("vitals")]
        public async Task<IActionResult> SaveVitals([FromBody] Vitals vitals)
        {
            var userIdStr = User.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
            if (userIdStr != null && int.TryParse(userIdStr, out int userId))
            {
                vitals.RecordedById = userId;
            }

            vitals.RecordedAt = DateTime.UtcNow;
            _context.Vitals.Add(vitals);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = vitals, message = "Vitals saved successfully" });
        }

        // POST api/consultation/prescription
        // This function saves the medicine prescription written by the doctor.
        [HttpPost("prescription")]
        public async Task<IActionResult> SavePrescription([FromBody] Prescription prescription)
        {
            prescription.CreatedAt = DateTime.UtcNow;
            _context.Prescriptions.Add(prescription);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = prescription, message = "Prescription saved successfully" });
        }

        // POST api/consultation/lab-orders
        // This function sends an order for Lab Tests to the laboratory module.
        [HttpPost("lab-orders")]
        public async Task<IActionResult> SaveLabOrder([FromBody] LabOrder order)
        {
            var testMaster = await _context.LabTestMasters.FirstOrDefaultAsync(t => t.TestName == order.TestType);
            order.Price = testMaster?.Price ?? 0;
            order.CreatedAt = DateTime.UtcNow;
            order.Status = "Requested";
            
            _context.LabOrders.Add(order);
            await _context.SaveChangesAsync();

            // Create Unpaid Bill for Finance synchronization
            var bill = new Bill
            {
                BillNumber = $"LAB-{DateTime.UtcNow:yyyyMMdd}-{order.Id}",
                AppointmentId = order.AppointmentId,
                PatientUserId = order.PatientUserId,
                DoctorProfileId = order.DoctorProfileId,
                BillSource = "Laboratory",
                SourceReferenceId = order.Id,
                Items = $"[{{\"name\": \"{order.TestType}\", \"price\": {order.Price}}}]",
                SubTotal = order.Price,
                TotalAmount = order.Price,
                Status = "Unpaid",
                CreatedAt = DateTime.UtcNow
            };
            _context.Bills.Add(bill);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = order, message = "Lab order sent and bill generated successfully" });
        }
    }
}
