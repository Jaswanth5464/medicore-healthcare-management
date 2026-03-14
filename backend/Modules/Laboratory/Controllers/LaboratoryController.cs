using MediCore.API.Modules.Laboratory.Models;
using MediCore.API.Modules.Finance.Models;
using MediCore.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using MediCore.API.Hubs;

namespace MediCore.API.Modules.Laboratory.Controllers
{
    [ApiController]
    [Route("api/laboratory")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,LabTechnician")]
    public class LaboratoryController : ControllerBase
    {
        private readonly MediCoreDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IHubContext<MediCoreHub> _hubContext;

        public LaboratoryController(
            MediCoreDbContext context, 
            IEmailService emailService,
            IHubContext<MediCoreHub> hubContext)
        {
            _context = context;
            _emailService = emailService;
            _hubContext = hubContext;
        }

        // GET api/laboratory/orders
        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders([FromQuery] string? status = null)
        {
            var query = _context.LabOrders.AsQueryable();

            if (!string.IsNullOrEmpty(status) && status != "All")
                query = query.Where(l => l.Status == status);

            var result = await query.OrderByDescending(l => l.CreatedAt).Select(l => new
            {
                l.Id,
                l.AppointmentId,
                l.TestType,
                l.Notes,
                l.Status,
                l.ResultNotes,
                l.ReportUrl,
                l.CreatedAt,
                l.CompletedAt,
                PatientName = _context.Users.Where(u => u.Id == l.PatientUserId).Select(u => u.FullName).FirstOrDefault(),
                DoctorName = _context.DoctorProfiles.Where(d => d.Id == l.DoctorProfileId)
                    .Select(d => _context.Users.Where(u => u.Id == d.UserId).Select(u => u.FullName).FirstOrDefault())
                    .FirstOrDefault()
            }).ToListAsync();

            return Ok(new { success = true, data = result });
        }

        // PATCH api/laboratory/orders/{id}/complete
        [HttpPatch("orders/{id}/complete")]
        public async Task<IActionResult> CompleteOrder(int id, [FromBody] CompleteOrderDto dto)
        {
            var order = await _context.LabOrders.FindAsync(id);
            if (order == null) return NotFound(new { success = false, message = "Order not found" });

            // Calculate test price from master
            var testMaster = await _context.LabTestMasters.FirstOrDefaultAsync(t => t.TestName == order.TestType);
            decimal price = testMaster?.Price ?? 0;

            order.Status = "Completed";
            order.ResultNotes = dto.ResultNotes;
            order.ReportUrl = dto.ReportUrl;
            order.CompletedAt = DateTime.UtcNow;

            // Create Bill for Lab
            var bill = new Bill
            {
                BillNumber = $"LAB-{DateTime.UtcNow:yyyyMMdd}-{order.Id}",
                PatientUserId = order.PatientUserId,
                DoctorProfileId = order.DoctorProfileId,
                BillSource = "Laboratory",
                SourceReferenceId = order.Id,
                Items = $"[{{\"name\": \"{order.TestType}\", \"price\": {price}}}]",
                SubTotal = price,
                TotalAmount = price,
                Status = "Paid", // Lab tests usually paid at time of collection
                PaymentMode = "Cash",
                PaidAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            _context.Bills.Add(bill);

            await _context.SaveChangesAsync();

            // Real-time notification: Lab Report Ready
            var patientName = await _context.Users.Where(u => u.Id == order.PatientUserId).Select(u => u.FullName).FirstOrDefaultAsync();
            
            // To Doctor
            var doctor = await _context.DoctorProfiles.FindAsync(order.DoctorProfileId);
            if (doctor != null)
            {
                await _hubContext.Clients.Group($"user-{doctor.UserId}")
                    .SendAsync("LabReportReady", new { 
                        orderId = order.Id, 
                        patientName = patientName, 
                        testType = order.TestType,
                        billAmount = price
                    });
            }

            // To Patient
            await _hubContext.Clients.Group($"user-{order.PatientUserId}")
                .SendAsync("LabReportReady", new { 
                    orderId = order.Id, 
                    testType = order.TestType,
                    billAmount = price
                });

            return Ok(new { success = true, message = "Lab results updated and bill generated successfully", billAmount = price });
        }

        // POST api/laboratory/orders/{id}/email
        [HttpPost("orders/{id}/email")]
        public async Task<IActionResult> EmailReport(int id)
        {
            var order = await _context.LabOrders.FindAsync(id);
            if (order == null) return NotFound(new { success = false, message = "Order not found" });
            if (order.Status != "Completed") return BadRequest(new { success = false, message = "Order is not yet completed" });

            var patient = await _context.Users.FindAsync(order.PatientUserId);
            if (patient == null || string.IsNullOrEmpty(patient.Email))
                return BadRequest(new { success = false, message = "Patient email not found" });

            await _emailService.SendLabReportAsync(
                patient.Email,
                patient.FullName,
                order.TestType,
                order.ResultNotes ?? "See attached report",
                order.CompletedAt?.ToString("dd MMM yyyy") ?? DateTime.UtcNow.ToString("dd MMM yyyy"),
                order.ReportUrl ?? ""
            );

            return Ok(new { success = true, message = "Lab report sent to patient's email" });
        }

        public class CompleteOrderDto
        {
            public string? ResultNotes { get; set; }
            public string? ReportUrl { get; set; }
        }
    }
}
