using MediCore.API.Infrastructure.Database.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediCore.API.Modules.Finance.Controllers
{
    [ApiController]
    [Route("api/finance")]
    [Authorize]
    public class FinanceController : ControllerBase
    {
        private readonly MediCoreDbContext _context;

        public FinanceController(MediCoreDbContext context)
        {
            _context = context;
        }

        [HttpGet("my-bills")]
        public async Task<IActionResult> GetMyBills()
        {
            var userIdStr = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
                return Unauthorized();

            var bills = await _context.Bills
                .Where(b => b.PatientUserId == userId)
                .OrderByDescending(b => b.CreatedAt)
                .Take(100)
                .Select(b => new
                {
                    b.Id,
                    b.BillNumber,
                    b.BillSource,
                    b.SubTotal,
                    b.TotalAmount,
                    b.Status,
                    b.PaymentMode,
                    b.CreatedAt,
                    b.Items,
                    b.PaidAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = bills });
        }

        [HttpGet("bills")]
        [Authorize(Roles = "SuperAdmin,HospitalAdmin,FinanceStaff,Receptionist")]
        public async Task<IActionResult> GetBills()
        {
            var bills = await _context.Bills
                .OrderByDescending(b => b.CreatedAt)
                .Select(b => new
                {
                    b.Id,
                    b.BillNumber,
                    b.BillSource,
                    b.SubTotal,
                    b.TotalAmount,
                    b.Status,
                    b.PaymentMode,
                    b.CreatedAt,
                    b.PaidAt,
                    b.Items,
                    b.AppointmentId,
                    PatientName = b.PatientUserId != null ? _context.Users.Where(u => u.Id == b.PatientUserId).Select(u => u.FullName).FirstOrDefault() : "Walk-in Customer",
                    PatientPhone = b.PatientUserId != null ? _context.Users.Where(u => u.Id == b.PatientUserId).Select(u => u.PhoneNumber).FirstOrDefault() : "N/A",
                    DoctorName = b.DoctorProfileId != null ? _context.Users.Where(u => u.Id == _context.DoctorProfiles.Where(d => d.Id == b.DoctorProfileId).Select(d => d.UserId).FirstOrDefault()).Select(u => u.FullName).FirstOrDefault() : "Hospital House"
                })
                .ToListAsync();

            return Ok(new { success = true, data = bills });
        }

        [HttpPatch("bills/{id}/status")]
        [Authorize(Roles = "SuperAdmin,HospitalAdmin,FinanceStaff,Receptionist")]
        public async Task<IActionResult> UpdateBillStatus(int id, [FromBody] UpdateStatusDto dto)
        {
            var bill = await _context.Bills.FindAsync(id);
            if (bill == null) return NotFound();

            bill.Status = dto.Status;
            if (dto.Status == "Paid")
            {
                bill.PaidAt = DateTime.UtcNow;
                bill.PaymentMode = dto.PaymentMode ?? "Cash";
            }
            bill.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Bill status updated successfully" });
        }

        [HttpPost("bills/{id}/email")]
        [Authorize(Roles = "SuperAdmin,HospitalAdmin,FinanceStaff")]
        public async Task<IActionResult> EmailInvoice(int id, [FromServices] Services.IEmailService emailService)
        {
            var bill = await _context.Bills.FindAsync(id);
            if (bill == null) return NotFound();

            var patient = await _context.Users.FindAsync(bill.PatientUserId);
            if (patient == null || string.IsNullOrEmpty(patient.Email))
                return BadRequest(new { success = false, message = "Patient email not found" });

            await emailService.SendInvoiceAsync(
                patient.Email,
                patient.FullName,
                bill.BillNumber,
                bill.TotalAmount,
                bill.CreatedAt.ToString("dd MMM yyyy"),
                bill.Status);

            return Ok(new { success = true, message = "Invoice sent successfully" });
        }

        public class UpdateStatusDto
        {
            public string Status { get; set; } = string.Empty;
            public string? PaymentMode { get; set; }
        }

        [HttpGet("payment-logs")]

        [Authorize(Roles = "SuperAdmin,HospitalAdmin,Receptionist")]
        public async Task<IActionResult> GetPaymentLogs([FromQuery] int limit = 100)
        {
            var logs = await _context.Bills
                .Where(b => b.Status == "Paid")
                .OrderByDescending(b => b.PaidAt ?? b.CreatedAt)
                .Take(limit)
                .Select(b => new
                {
                    b.Id,
                    b.BillNumber,
                    b.TotalAmount,
                    b.BillSource,
                    b.PaymentMode,
                    PaidAt = b.PaidAt ?? b.CreatedAt,
                    PatientName = _context.Users.Where(u => u.Id == b.PatientUserId).Select(u => u.FullName).FirstOrDefault(),
                    DoctorName = b.DoctorProfileId != null ? _context.Users.Where(u => u.Id == _context.DoctorProfiles.Where(d => d.Id == b.DoctorProfileId).Select(d => d.UserId).FirstOrDefault()).Select(u => u.FullName).FirstOrDefault() : "N/A"
                })
                .ToListAsync();

            return Ok(new { success = true, data = logs });
        }
    }
}
