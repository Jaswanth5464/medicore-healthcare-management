// This file (FinanceController) is the central reporting hub for the entire hospital.
// It gathers financial data from all other modules (Pharmacy, Lab, IPD, and OPD).
// Key Features:
// 1. Calculates total revenue and expenses for the dashboard.
// 2. Provides the list of all bills (invoices) where staff can collect payments.
// 3. Generates department-wise reports to see which area is earning the most revenue.
using MediCore.API.Infrastructure.Database.Context;
using MediCore.API.Modules.Finance.Models;
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

        // This function gets the bills for the currently logged-in patient.
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

        // This function gets all bills in the system for admins/staff to review and manage.
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

        // This function updates a bill's status (like changing it from 'Unpaid' to 'Paid').
        // It's the most important function for revenue tracking.
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

        // This function gets a list of hospital expenses (like rent, salary, electricity).
        [HttpGet("expenses")]
        [Authorize(Roles = "SuperAdmin,HospitalAdmin,FinanceStaff")]
        public async Task<IActionResult> GetExpenses()
        {
            var expenses = await _context.Expenses
                .OrderByDescending(e => e.ExpenseDate)
                .Take(500)
                .ToListAsync();
            return Ok(new { success = true, data = expenses });
        }

        [HttpPost("expenses")]
        [Authorize(Roles = "SuperAdmin,HospitalAdmin,FinanceStaff")]
        public async Task<IActionResult> AddExpense([FromBody] Expense expense)
        {
            var userIdStr = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdStr, out var userId))
            {
                expense.CreatedByUserId = userId;
            }
            
            expense.CreatedAt = DateTime.UtcNow;
            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, data = expense });
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
                    PatientName = b.PatientUserId != null ? _context.Users.Where(u => u.Id == b.PatientUserId).Select(u => u.FullName).FirstOrDefault() : "Walk-in Customer",
                    DoctorName = b.DoctorProfileId != null ? _context.Users.Where(u => u.Id == _context.DoctorProfiles.Where(d => d.Id == b.DoctorProfileId).Select(d => d.UserId).FirstOrDefault()).Select(u => u.FullName).FirstOrDefault() : "N/A"
                })
                .ToListAsync();

            return Ok(new { success = true, data = logs });
        }

        [HttpPost("seed-data")]
        [Authorize(Roles = "SuperAdmin,HospitalAdmin")]
        public async Task<IActionResult> SeedData()
        {
            try
            {
                await Infrastructure.Database.DbSeeder.SeedAsync(_context);
                return Ok(new { success = true, message = "Database seeded successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Seed failed: " + ex.Message });
            }
        }

        // This is the "Brain" of the Finance Dashboard. It:
        // 1. Calculates today's, yesterday's, and this month's revenue.
        // 2. Breaks down revenue by source (Pharmacy, Lab, IPD, OPD).
        // 3. Counts how many beds are occupied.
        // 4. Calculates the final profit by subtracting expenses from revenue.
        [HttpGet("stats")]
        [Authorize(Roles = "SuperAdmin,HospitalAdmin,FinanceStaff")]
        public async Task<IActionResult> GetFinanceStats()
        {
            var today = DateTime.UtcNow.Date;
            var monthStart = new DateTime(today.Year, today.Month, 1);

            var todayRevenue = await _context.Bills
                .Where(b => (b.PaidAt != null && b.PaidAt.Value.Date == today) || (b.PaidAt == null && b.CreatedAt.Date == today && b.Status == "Paid"))
                .SumAsync(b => b.TotalAmount);

            var yesterday = today.AddDays(-1);
            var yesterdayRevenue = await _context.Bills
                .Where(b => (b.PaidAt != null && b.PaidAt.Value.Date == yesterday) || (b.PaidAt == null && b.CreatedAt.Date == yesterday && b.Status == "Paid"))
                .SumAsync(b => b.TotalAmount);

            var monthRevenue = await _context.Bills
                .Where(b => (b.PaidAt != null && b.PaidAt.Value >= monthStart) || (b.PaidAt == null && b.CreatedAt >= monthStart && b.Status == "Paid"))
                .SumAsync(b => b.TotalAmount);

            var pendingAmount = await _context.Bills
                .Where(b => b.Status == "Unpaid")
                .SumAsync(b => b.TotalAmount);

            var pendingCount = await _context.Bills
                .CountAsync(b => b.Status == "Unpaid");

            var totalBilledPatients = await _context.Bills
                .Select(b => b.PatientUserId)
                .Distinct()
                .CountAsync();

            var opdBilled = await _context.Bills.CountAsync(b => b.BillSource == "OPD" || b.BillSource == "OPD_CONSULTATION");
            var ipdBilled = await _context.Bills.CountAsync(b => b.BillSource == "IPD" || b.BillSource == "Bed_Allocation");

            // Dept wise stats
            var depts = await _context.Departments.ToListAsync();
            var deptStats = new List<object>();

            foreach(var dept in depts)
            {
                var bills = await _context.Bills
                    .Include(b => b.Appointment)
                    .Where(b => b.DoctorProfileId != null && _context.DoctorProfiles.Any(d => d.Id == b.DoctorProfileId && d.DepartmentId == dept.Id))
                    .ToListAsync();

                deptStats.Add(new {
                    Name = dept.Name,
                    OPDPatients = bills.Count(b => b.BillSource != "IPD"),
                    IPDPatients = bills.Count(b => b.BillSource == "IPD"),
                    OPDRevenue = bills.Where(b => b.BillSource != "IPD").Sum(b => b.TotalAmount),
                    IPDRevenue = bills.Where(b => b.BillSource == "IPD").Sum(b => b.TotalAmount),
                    Total = bills.Sum(b => b.TotalAmount)
                });
            }

            // IPD Metrics
            var totalBeds = await _context.BedAllocations.CountAsync();
            var occupiedBeds = await _context.BedAllocations.CountAsync(b => b.IsOccupied);
            
            // Consistent IPD revenue calculation (only paid bills counted as revenue)
            var ipdRevenueToday = await _context.Bills
                .Where(b => b.BillSource == "IPD" && b.Status == "Paid" && 
                       ((b.PaidAt != null && b.PaidAt.Value.Date == today) || 
                        (b.PaidAt == null && b.CreatedAt.Date == today)))
                .SumAsync(b => b.TotalAmount);

            // Expenses
            var totalExpenses = await _context.Expenses.SumAsync(e => e.Amount);
            var monthExpenses = await _context.Expenses.Where(e => e.ExpenseDate >= monthStart).SumAsync(e => e.Amount);
            
            // Revenue Source Breakdown
            var pharmacyRevenue = await _context.Bills.Where(b => b.BillSource == "Pharmacy" && b.Status == "Paid").SumAsync(b => b.TotalAmount);
            var labRevenue = await _context.Bills.Where(b => b.BillSource == "Laboratory" && b.Status == "Paid").SumAsync(b => b.TotalAmount);
            var opdRevenue = await _context.Bills.Where(b => (b.BillSource == "OPD" || b.BillSource == "OPD_CONSULTATION") && b.Status == "Paid").SumAsync(b => b.TotalAmount);
            var ipdRevenueTotal = await _context.Bills.Where(b => b.BillSource == "IPD" && b.Status == "Paid").SumAsync(b => b.TotalAmount);

            return Ok(new {
                success = true,
                data = new {
                    todayRevenue,
                    yesterdayRevenue,
                    monthRevenue,
                    pendingAmount,
                    pendingCount,
                    totalBilledPatients,
                    opdBilled,
                    ipdBilled,
                    deptStats,
                    totalExpenses,
                    monthExpenses,
                    netProfit = monthRevenue - monthExpenses,
                    revenueBreakdown = new {
                        Pharmacy = pharmacyRevenue,
                        Laboratory = labRevenue,
                        OPD = opdRevenue,
                        IPD = ipdRevenueTotal
                    },
                    ipdMetrics = new {
                        totalBeds,
                        occupiedBeds,
                        ipdRevenueToday
                    }
                }
            });
        }
    }
}
