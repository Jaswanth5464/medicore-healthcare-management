using MediCore.API.Modules.Laboratory.Models;
using MediCore.API.Modules.Finance.Models;
using MediCore.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using MediCore.API.Hubs;
using MediCore.API.Infrastructure.Database.Context;

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

        // This function gets all lab orders that are waiting to be processed or completed.
        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders([FromQuery] string? status = null, [FromQuery] int? doctorProfileId = null)
        {
            var query = _context.LabOrders.AsQueryable();

            if (!string.IsNullOrEmpty(status) && status != "All")
                query = query.Where(l => l.Status == status);

            if (doctorProfileId.HasValue)
                query = query.Where(l => l.DoctorProfileId == doctorProfileId.Value);

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
                l.Priority,
                Price = l.Price > 0 ? l.Price : (_context.LabTestMasters.Where(t => t.TestName == l.TestType).Select(t => t.Price).FirstOrDefault()),
                l.ReferenceRange,
                l.SampleCollectedAt,
                PatientName = _context.Users.Where(u => u.Id == l.PatientUserId).Select(u => u.FullName).FirstOrDefault(),
                DoctorName = _context.DoctorProfiles.Where(d => d.Id == l.DoctorProfileId)
                    .Select(d => _context.Users.Where(u => u.Id == d.UserId).Select(u => u.FullName).FirstOrDefault())
                    .FirstOrDefault(),
                IsPaid = _context.Bills.Any(b => b.BillSource == "Laboratory" && b.SourceReferenceId == l.Id && b.Status == "Paid")
            }).ToListAsync();

            return Ok(new { success = true, data = result });
        }

        [HttpGet("tests")]
        public async Task<IActionResult> GetTestMaster()
        {
            var tests = await _context.LabTestMasters.OrderBy(t => t.TestName).ToListAsync();
            return Ok(new { success = true, data = tests });
        }

        [HttpPost("tests")]
        public async Task<IActionResult> CreateTestMaster([FromBody] LabTestMaster test)
        {
            _context.LabTestMasters.Add(test);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, data = test });
        }

        [HttpPatch("orders/{id}/collect")]
        public async Task<IActionResult> MarkSampleCollected(int id)
        {
            var order = await _context.LabOrders.FindAsync(id);
            if (order == null) return NotFound();

            order.Status = "Processing";
            order.SampleCollectedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Sample marked as collected" });
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetLabStats()
        {
            var totalOrders = await _context.LabOrders.CountAsync();
            var pendingOrders = await _context.LabOrders.CountAsync(o => o.Status == "Pending" || o.Status == "Requested");
            var processing = await _context.LabOrders.CountAsync(o => o.Status == "Processing");
            var completed = await _context.LabOrders.CountAsync(o => o.Status == "Completed");

            var revenue = await _context.Bills
                .Where(b => b.BillSource == "Laboratory" && b.Status == "Paid")
                .SumAsync(b => b.TotalAmount);

            return Ok(new {
                success = true,
                data = new {
                    totalOrders,
                    pendingOrders,
                    processing,
                    completed,
                    revenue
                }
            });
        }

        // PATCH api/laboratory/orders/{id}/complete
        // This function completes a lab test order. It:
        // 1. Records the results of the test.
        // 2. Changes the order status to 'Completed'.
        // 3. Automatically generates a "Paid" bill for the finance system.
        [HttpPost("orders/{id}/complete")]
        [Authorize(Roles = "SuperAdmin,HospitalAdmin,LabTechnician")]
        public async Task<IActionResult> CompleteOrder(int id, [FromBody] CompleteOrderDto dto)
        {
            var order = await _context.LabOrders.FindAsync(id);
            if (order == null) return NotFound(new { success = false, message = "Order not found" });

            // Ensure test price is up to date if not already set
            if (order.Price == 0)
            {
                var testMaster = await _context.LabTestMasters.FirstOrDefaultAsync(t => t.TestName == order.TestType);
                order.Price = testMaster?.Price ?? 0;
            }

            order.Status = "Completed";
            order.ResultNotes = dto.ResultNotes;
            order.CompletedAt = DateTime.UtcNow;
            order.ReportUrl = dto.ReportPdfUrl;
            order.ResultsJson = dto.ResultsJson;

            // Sync with Finance: Find the unpaid bill and mark it as paid
            var bill = await _context.Bills.FirstOrDefaultAsync(b => b.BillSource == "Laboratory" && b.SourceReferenceId == order.Id);
            if (bill != null)
            {
                bill.Status = "Paid";
                bill.PaidAt = DateTime.UtcNow;
                bill.PaymentMode = "Cash"; // Default for auto-completion
                bill.Description = $"Lab Test: {order.TestType} (Completed)";
            }

            await _context.SaveChangesAsync();
            // ... (SignalR code remains same)

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
                        billAmount = order.Price
                    });
            }

            // To Patient
            await _hubContext.Clients.Group($"user-{order.PatientUserId}")
                .SendAsync("LabReportReady", new { 
                    orderId = order.Id, 
                    testType = order.TestType,
                    billAmount = order.Price
                });

            return Ok(new { success = true, message = "Lab results updated and bill synchronized successfully", billAmount = order.Price });
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
            public string? ReportPdfUrl { get; set; }
            public string? ResultsJson { get; set; }
        }
    }
}
