using MediCore.API.Infrastructure.Database.Context;
using MediCore.API.Modules.Laboratory.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;

namespace MediCore.API.Modules.Laboratory.Controllers
{
    [ApiController]
    [Route("api/lab")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,LabTechnician,Doctor")]
    public class LabController : ControllerBase
    {
        private readonly MediCoreDbContext _context;
        private readonly IHubContext<MediCore.API.Hubs.MediCoreHub> _hubContext;

        public LabController(
            MediCoreDbContext context,
            IHubContext<MediCore.API.Hubs.MediCoreHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpGet("tests")]
        public async Task<IActionResult> GetTestMasters()
        {
            var tests = await _context.LabTestMasters
                .Where(t => t.IsActive)
                .OrderBy(t => t.TestName)
                .ToListAsync();
            return Ok(new { success = true, data = tests });
        }

        [HttpGet("queue")]
        public async Task<IActionResult> GetQueue()
        {
            var orders = await _context.LabOrders
                .Include(o => o.Appointment)
                .ThenInclude(a => a.PatientUser)
                .Include(o => o.Appointment)
                .ThenInclude(a => a.DoctorProfile)
                .ThenInclude(d => d.User)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new {
                    id = o.Id,
                    appointmentId = o.AppointmentId,
                    patientName = o.Appointment.PatientUser.FullName,
                    doctorName = o.Appointment.DoctorProfile.User.FullName,
                    testType = o.TestType,
                    status = o.Status,
                    createdAt = o.CreatedAt,
                    reportUrl = o.ReportUrl,
                    criticalAlert = o.CriticalAlert
                })
                .ToListAsync();

            return Ok(new { success = true, data = orders });
        }

        [HttpPost("upload-report/{orderId}")]
        public async Task<IActionResult> UploadReport(int orderId, [FromBody] UploadReportRequest request)
        {
            var order = await _context.LabOrders.FindAsync(orderId);
            if (order == null) return NotFound(new { success = false, message = "Order not found" });

            // In reality, save base64 to blob storage. For MVP, store short text string or a fake URL.
            order.ReportUrl = request.ReportPdfUrl; 
            order.ResultNotes = request.ResultNotes;
            order.Status = "Completed";
            order.CompletedAt = DateTime.UtcNow;
            if (request.IsCritical) order.CriticalAlert = true;

            await _context.SaveChangesAsync();

            // Real-time notifications
            var appointment = await _context.Appointments
                .Include(a => a.DoctorProfile)
                .FirstOrDefaultAsync(a => a.Id == order.AppointmentId);

            if (appointment != null)
            {
                // Notify Doctor
                await _hubContext.Clients.Group($"user-{appointment.DoctorProfile.UserId}")
                    .SendAsync("LabReportReady", new { 
                        orderId = order.Id, 
                        patientId = appointment.PatientUserId,
                        tokenNumber = appointment.TokenNumber,
                        testType = order.TestType,
                        isCritical = order.CriticalAlert
                    });

                // Notify Patient
                await _hubContext.Clients.Group($"user-{appointment.PatientUserId}")
                    .SendAsync("LabReportReady", new { 
                        orderId = order.Id, 
                        doctorName = appointment.DoctorProfile.UserId.ToString(), // Should get name ideally
                        testType = order.TestType,
                        isCritical = order.CriticalAlert
                    });
            }

            return Ok(new { success = true, message = "Report uploaded successfully" });
        }
    }

    public class UploadReportRequest
    {
        public string ReportPdfUrl { get; set; } = string.Empty;
        public string? ResultNotes { get; set; }
        public bool IsCritical { get; set; }
    }
}
