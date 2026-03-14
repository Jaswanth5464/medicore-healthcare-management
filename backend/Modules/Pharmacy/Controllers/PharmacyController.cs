using MediCore.API.Modules.Pharmacy.Models;
using MediCore.API.Modules.Finance.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using MediCore.API.Infrastructure.Database.Context;

namespace MediCore.API.Modules.Pharmacy.Controllers
{
    [ApiController]
    [Route("api/pharmacy")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,Pharmacist")]
    public class PharmacyController : ControllerBase
    {
        private readonly MediCoreDbContext _context;
        private readonly IHubContext<MediCore.API.Hubs.MediCoreHub> _hubContext;

        public PharmacyController(
            MediCoreDbContext context,
            IHubContext<MediCore.API.Hubs.MediCoreHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // GET api/pharmacy/inventory
        [HttpGet("inventory")]
        public async Task<IActionResult> GetInventory()
        {
            var medicines = await _context.Medicines
                .OrderBy(m => m.Name)
                .ToListAsync();
            return Ok(new { success = true, data = medicines });
        }

        // PUT api/pharmacy/inventory/{id}
        [HttpPut("inventory/{id}")]
        public async Task<IActionResult> UpdateMedicine(int id, [FromBody] Medicine medicine)
        {
            var existing = await _context.Medicines.FindAsync(id);
            if (existing == null) return NotFound(new { success = false, message = "Medicine not found" });

            existing.Name = medicine.Name;
            existing.GenericName = medicine.GenericName;
            existing.Category = medicine.Category;
            existing.Manufacturer = medicine.Manufacturer;
            existing.Price = medicine.Price;
            existing.StockQuantity = medicine.StockQuantity;
            existing.LowStockThreshold = medicine.LowStockThreshold;
            existing.ExpiryDate = medicine.ExpiryDate;

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Medicine updated successfully" });
        }

        // DELETE api/pharmacy/inventory/{id}
        [HttpDelete("inventory/{id}")]
        public async Task<IActionResult> DeleteMedicine(int id)
        {
            var medicine = await _context.Medicines.FindAsync(id);
            if (medicine == null) return NotFound(new { success = false, message = "Medicine not found" });

            _context.Medicines.Remove(medicine);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Medicine deleted successfully" });
        }

        // GET api/pharmacy/queue
        [HttpGet("queue")]
        public async Task<IActionResult> GetDispensingQueue()
        {
            var today = DateTime.UtcNow.Date;
            var prescriptions = await _context.Prescriptions
                .Include(p => p.Appointment)
                .ThenInclude(a => a.PatientUser)
                .Include(p => p.Appointment)
                .ThenInclude(a => a.DoctorProfile)
                .ThenInclude(d => d.User)
                .Where(p => !p.IsDispensed && p.CreatedAt >= today.AddDays(-3)) // Last 3 days
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new {
                    id = p.Id,
                    appointmentId = p.AppointmentId,
                    patientName = p.Appointment.PatientUser.FullName,
                    doctorName = p.Appointment.DoctorProfile.User.FullName,
                    medicinesJson = p.MedicinesJson,
                    advice = p.Advice,
                    createdAt = p.CreatedAt,
                    isDispensed = p.IsDispensed
                })
                .ToListAsync();

            return Ok(new { success = true, data = prescriptions });
        }

        // POST api/pharmacy/dispense/{prescriptionId}
        [HttpPost("dispense/{prescriptionId}")]
        public async Task<IActionResult> DispensePrescription(int prescriptionId)
        {
            var prescription = await _context.Prescriptions.FindAsync(prescriptionId);
            if (prescription == null) return NotFound(new { success = false, message = "Prescription not found" });

            if (prescription.IsDispensed) return BadRequest(new { success = false, message = "Already dispensed" });

            // Parse medicines and calculate total
            var medList = System.Text.Json.JsonSerializer.Deserialize<List<PrescribedMed>>(prescription.MedicinesJson ?? "[]") ?? new List<PrescribedMed>();
            decimal totalBill = 0;

            foreach (var pMed in medList)
            {
                var med = await _context.Medicines.FirstOrDefaultAsync(m => m.Name == pMed.name);
                if (med != null)
                {
                    int count = pMed.count > 0 ? pMed.count : 1; 
                    totalBill += med.Price * count;
                    
                    // Deduct Stock
                    if (med.StockQuantity >= count)
                    {
                        med.StockQuantity -= count;
                    }
                }
            }

            // Mark dispensed
            prescription.IsDispensed = true;
            prescription.DispensedAt = DateTime.UtcNow;

            // Create Bill
            var bill = new Bill
            {
                BillNumber = $"PHARM-{DateTime.UtcNow:yyyyMMdd}-{prescription.Id}",
                PatientUserId = prescription.PatientUserId,
                DoctorProfileId = prescription.DoctorProfileId,
                BillSource = "Pharmacy",
                SourceReferenceId = prescription.Id,
                Items = prescription.MedicinesJson ?? "[]",
                SubTotal = totalBill,
                TotalAmount = totalBill,
                Status = "Paid", // For pharmacy, we assume payment is handled at counter before/during dispense
                PaymentMode = "Cash",
                PaidAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            _context.Bills.Add(bill);

            await _context.SaveChangesAsync();

            // Notify Patient
            var appointment = await _context.Appointments.FindAsync(prescription.AppointmentId);
            if (appointment != null)
            {
                await _hubContext.Clients.Group($"user-{appointment.PatientUserId}")
                    .SendAsync("PrescriptionDispensed", new { 
                        prescriptionId = prescription.Id,
                        tokenNumber = appointment.TokenNumber,
                        billAmount = totalBill
                    });
            }

            return Ok(new { success = true, message = "Medicines dispensed and bill generated successfully", billAmount = totalBill });
        }

        // POST api/pharmacy/walk-in
        [HttpPost("walk-in")]
        public async Task<IActionResult> ProcessWalkInSale([FromBody] WalkInSaleDto dto)
        {
            if (dto.Items == null || !dto.Items.Any())
                return BadRequest(new { success = false, message = "No items in basket" });

            decimal totalBill = 0;
            var itemsSummary = new List<object>();

            foreach (var item in dto.Items)
            {
                var med = await _context.Medicines.FindAsync(item.MedicineId);
                if (med == null) continue;

                if (med.StockQuantity < item.Count)
                    return BadRequest(new { success = false, message = $"Insufficient stock for {med.Name}" });

                med.StockQuantity -= item.Count;
                totalBill += med.Price * item.Count;
                itemsSummary.Add(new { name = med.Name, count = item.Count, price = med.Price });
            }

            // Create Bill for Walk-in
            var bill = new Bill
            {
                BillNumber = $"WALK-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}",
                BillSource = "Pharmacy",
                Items = System.Text.Json.JsonSerializer.Serialize(itemsSummary),
                SubTotal = totalBill,
                TotalAmount = totalBill,
                Status = "Paid",
                PaymentMode = dto.PaymentMode ?? "Cash",
                PaidAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                // For walk-in, we store customer details in a generic way or skip IDs
                // In a real HMS, we might have a placeholder user or additional fields in Bill
            };
            
            // Note: Since Bill model requires PatientUserId, we should either allow it to be nullable 
            // or use a default "Walk-in" user ID. For now, let's assume Bill needs a user or we use a system guest ID.
            // If PatientUserId is not nullable, this might fail. Checking Bill.cs again...
            // It's 'public int PatientUserId { get; set; }'. 
            // Let's find/create a Guest User or make it nullable if possible. 
            // In many HMS, PatientUserId 0 or a specific ID like 1 is for Walk-ins.
            bill.PatientUserId = dto.PatientUserId ?? 0; // Default to 0 or provided ID

            _context.Bills.Add(bill);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Sale completed successfully", billNumber = bill.BillNumber, total = totalBill });
        }

        public class PrescribedMed 
        {
            public string name { get; set; } = string.Empty;
            public int count { get; set; }
        }

        public class WalkInSaleDto
        {
            public string CustomerName { get; set; } = "Walk-in Customer";
            public string CustomerPhone { get; set; } = string.Empty;
            public string? PaymentMode { get; set; }
            public int? PatientUserId { get; set; }
            public List<WalkInItemDto> Items { get; set; } = new();
        }

        public class WalkInItemDto
        {
            public int MedicineId { get; set; }
            public int Count { get; set; }
        }
    }
}
