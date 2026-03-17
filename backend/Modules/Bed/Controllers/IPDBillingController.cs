// This file (IPDBillingController) handles the calculation and addition of daily charges for patients admitted in the hospital.
// It manages costs for things like doctor visits, medicines, and nursing.
// I fixed a bug here to make sure the room rent is only added once per day, even if multiple service charges are added later.
using MediCore.API.Contracts.Requests;
using MediCore.API.Infrastructure.Database.Context;
using MediCore.API.Modules.Bed.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MediCore.API.Modules.Bed.Controllers
{
    [ApiController]
    [Route("api/ipd/[controller]")]
    [Authorize]
    public class IPDBillingController : ControllerBase
    {
        private readonly MediCoreDbContext _context;

        public IPDBillingController(MediCoreDbContext context)
        {
            _context = context;
        }

        [HttpGet("charges/{admissionId}")]
        public async Task<IActionResult> GetChargesForAdmission(int admissionId)
        {
            var charges = await _context.DailyIPDCharges
                .Include(c => c.AddedByUser)
                .Where(c => c.AdmissionId == admissionId)
                .OrderByDescending(c => c.ChargeDate)
                .ToListAsync();

            var summary = new
            {
                TotalRoomCharges = charges.Sum(c => c.RoomCharge),
                TotalDoctorCharges = charges.Sum(c => c.DoctorVisitCharge),
                TotalNursingCharges = charges.Sum(c => c.NursingCharge),
                TotalMedicineCharges = charges.Sum(c => c.MedicineCharge),
                TotalLabCharges = charges.Sum(c => c.LabCharge),
                TotalOtherCharges = charges.Sum(c => c.OtherCharges + c.ProcedureCharge),
                GrandTotal = charges.Sum(c => c.TotalDayCharge)
            };

            return Ok(new { success = true, data = charges, summary });
        }

        [HttpPost("add-charge")]
        public async Task<IActionResult> AddDailyCharge([FromBody] AddDailyChargeRequest request)
        {
            var admission = await _context.PatientAdmissions.FindAsync(request.AdmissionId);
            if (admission == null)
                return NotFound(new { success = false, message = "Admission not found." });

            if (admission.Status == "Discharged")
                return BadRequest(new { success = false, message = "Cannot add charges to a discharged patient." });

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userId = userIdClaim != null ? int.Parse(userIdClaim) : 0;

            // Check if room charge already exists for today
            var today = DateTime.UtcNow.Date;
            var roomChargeAlreadyAdded = await _context.DailyIPDCharges
                .AnyAsync(c => c.AdmissionId == request.AdmissionId && c.CreatedAt.Date == today && c.RoomCharge > 0);

            var charge = new DailyIPDCharge
            {
                AdmissionId = request.AdmissionId,
                ChargeDate = DateTime.UtcNow,
                RoomCharge = roomChargeAlreadyAdded ? 0 : admission.DailyRoomCharge, // Automatically add room charge only once per day
                DoctorVisitCharge = request.DoctorVisitCharge,
                NursingCharge = request.NursingCharge,
                MedicineCharge = request.MedicineCharge,
                LabCharge = request.LabCharge,
                ProcedureCharge = request.ProcedureCharge,
                OtherCharges = request.OtherCharges,
                Notes = request.Notes,
                AddedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.DailyIPDCharges.Add(charge);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Charge added successfully.", chargeId = charge.Id });
        }
    }
}
