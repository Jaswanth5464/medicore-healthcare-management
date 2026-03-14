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

        [HttpGet("payment-logs")]
        [Authorize(Roles = "SuperAdmin,HospitalAdmin")]
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
