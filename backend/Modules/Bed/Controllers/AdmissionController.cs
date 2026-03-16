using MediCore.API.Contracts.Requests;
using MediCore.API.Contracts.Responses;
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
    public class AdmissionController : ControllerBase
    {
        private readonly MediCoreDbContext _context;

        public AdmissionController(MediCoreDbContext context)
        {
            _context = context;
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveAdmissions()
        {
            var admissions = await _context.PatientAdmissions
                .Include(a => a.PatientUser)
                .Include(a => a.AdmittingDoctor)
                .ThenInclude(d => d.User)
                .Include(a => a.Department)
                .Include(a => a.Bed)
                .Include(a => a.Room)
                .Where(a => a.Status == "Admitted")
                .OrderByDescending(a => a.AdmissionDate)
                .Select(a => new AdmissionResponse
                {
                    Id = a.Id,
                    AdmissionNumber = a.AdmissionNumber,
                    PatientId = a.PatientUserId,
                    PatientName = a.PatientUser.FullName,
                    AdmissionDate = a.AdmissionDate,
                    Status = a.Status,
                    BedNumber = a.Bed != null ? a.Bed.BedNumber : "N/A",
                    RoomNumber = a.Room.RoomNumber,
                    DoctorName = a.AdmittingDoctor.User.FullName,
                    DepartmentName = a.Department.Name
                })
                .ToListAsync();

            return Ok(new { success = true, data = admissions });
        }

        [HttpPost("admit")]
        public async Task<IActionResult> AdmitPatient([FromBody] AdmissionRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Validate Bed/Room
                var room = await _context.Rooms.Include(r => r.RoomType).FirstOrDefaultAsync(r => r.Id == request.RoomId);
                if (room == null || !room.IsActive)
                    return BadRequest(new { success = false, message = "Invalid or inactive room selected." });

                BedAllocation? bed = null;
                if (request.BedId.HasValue)
                {
                    bed = await _context.BedAllocations.FirstOrDefaultAsync(b => b.Id == request.BedId);
                    if (bed == null || bed.Status != "Available")
                        return BadRequest(new { success = false, message = "Selected bed is not available." });
                }

                // 2. Create Admission Record
                var admissionNumber = $"ADM-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}";
                
                var admission = new PatientAdmission
                {
                    AdmissionNumber = admissionNumber,
                    PatientUserId = request.PatientUserId,
                    RoomId = request.RoomId,
                    RoomTypeId = request.RoomTypeId,
                    BedId = request.BedId,
                    AdmittingDoctorProfileId = request.AdmittingDoctorProfileId,
                    DepartmentId = request.DepartmentId,
                    AdmissionDate = DateTime.UtcNow,
                    AdmissionType = request.AdmissionType,
                    ChiefComplaints = request.ChiefComplaints,
                    InitialDiagnosis = request.InitialDiagnosis,
                    AttendantName = request.AttendantName,
                    AttendantPhone = request.AttendantPhone,
                    AttendantRelation = request.AttendantRelation,
                    DailyRoomCharge = room.RoomType?.PricePerDay ?? 0,
                    Status = "Admitted"
                };

                _context.PatientAdmissions.Add(admission);
                await _context.SaveChangesAsync();

                // 3. Update Bed Status
                if (bed != null)
                {
                    bed.Status = "Occupied";
                    bed.CurrentAdmissionId = admission.Id;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { success = true, message = "Patient admitted successfully.", admissionId = admission.Id, admissionNumber = admissionNumber });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = "Error during admission: " + ex.Message });
            }
        }

        [HttpPost("discharge")]
        public async Task<IActionResult> DischargePatient([FromBody] DischargeRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var admission = await _context.PatientAdmissions
                    .Include(a => a.Bed)
                    .FirstOrDefaultAsync(a => a.Id == request.AdmissionId);

                if (admission == null)
                    return NotFound(new { success = false, message = "Admission record not found." });

                if (admission.Status == "Discharged")
                    return BadRequest(new { success = false, message = "Patient already discharged." });

                // 1. Update Admission Record
                admission.Status = "Discharged";
                admission.ActualDischargeDate = DateTime.UtcNow;
                admission.FinalDiagnosis = request.FinalDiagnosis;
                
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var currentUserId = userIdClaim != null ? int.Parse(userIdClaim) : 0;
                admission.DischargedByUserId = currentUserId;

                // 2. Create Discharge Note
                var note = new DischargeNote
                {
                    AdmissionId = admission.Id,
                    FinalDiagnosis = request.FinalDiagnosis,
                    TreatmentSummary = request.TreatmentSummary,
                    MedicinesAtDischarge = request.MedicinesAtDischarge,
                    DietInstructions = request.DietInstructions,
                    FollowUpDate = request.FollowUpDate,
                    FollowUpWithDoctorId = request.FollowUpWithDoctorId,
                    DischargeType = request.DischargeType,
                    CreatedAt = DateTime.UtcNow
                };
                _context.DischargeNotes.Add(note);

                // 3. Automated Billing Calculation
                var stayDays = (int)Math.Max(1, (admission.ActualDischargeDate.Value - admission.AdmissionDate).TotalDays);
                var roomRent = stayDays * admission.DailyRoomCharge;
                
                var serviceCharges = await _context.DailyIPDCharges
                    .Where(c => c.AdmissionId == admission.Id)
                    .SumAsync(c => c.DoctorVisitCharge + c.NursingCharge + c.MedicineCharge + c.LabCharge + c.ProcedureCharge + c.OtherCharges);
                
                var subTotal = roomRent + serviceCharges;
                decimal gstPercent = 18;
                decimal gstAmount = Math.Round(subTotal * (gstPercent / 100), 2);
                decimal grandTotal = subTotal + gstAmount;

                // 4. Create Final Bill
                var bill = new MediCore.API.Modules.Finance.Models.Bill
                {
                    BillNumber = $"IPD-{DateTime.UtcNow:yyyyMMdd}-{admission.Id}",
                    PatientUserId = admission.PatientUserId,
                    DoctorProfileId = admission.AdmittingDoctorProfileId,
                    BillSource = "IPD",
                    SourceReferenceId = admission.Id,
                    SubTotal = subTotal,
                    GSTPercent = gstPercent,
                    GSTAmount = gstAmount,
                    TotalAmount = grandTotal,
                    Status = "Unpaid",
                    CreatedAt = DateTime.UtcNow,
                    Items = System.Text.Json.JsonSerializer.Serialize(new[] 
                    {
                        new { name = $"Room Rent ({stayDays} days x {admission.DailyRoomCharge})", amount = roomRent },
                        new { name = "Service & Procedure Charges", amount = serviceCharges }
                    })
                };
                _context.Bills.Add(bill);

                // 5. Free the Bed (Set to Cleaning)
                if (admission.Bed != null)
                {
                    admission.Bed.Status = "Cleaning";
                    admission.Bed.CurrentAdmissionId = null;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { 
                    success = true, 
                    message = "Patient discharged and bill generated successfully.",
                    billNumber = bill.BillNumber,
                    totalAmount = grandTotal
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { success = false, message = "Error during discharge: " + ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAdmissionDetails(int id)
        {
            var admission = await _context.PatientAdmissions
                .Include(a => a.PatientUser)
                .Include(a => a.AdmittingDoctor)
                .ThenInclude(d => d.User)
                .Include(a => a.Department)
                .Include(a => a.Bed)
                .Include(a => a.Room)
                .Include(a => a.RoomType)
                .Include(a => a.DailyCharges)
                .Include(a => a.DischargeNote)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (admission == null)
                return NotFound();

            return Ok(new { success = true, data = admission });
        }
        
        [HttpGet("{id}/summary")]
        public async Task<IActionResult> GetDischargeSummary(int id)
        {
            var admission = await _context.PatientAdmissions
                .Include(a => a.PatientUser)
                .Include(a => a.AdmittingDoctor)
                .ThenInclude(d => d.User)
                .Include(a => a.Department)
                .Include(a => a.Room)
                .Include(a => a.RoomType)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (admission == null) return NotFound(new { success = false, message = "Admission record not found" });

            var note = await _context.DischargeNotes
                .FirstOrDefaultAsync(n => n.AdmissionId == id);

            var bill = await _context.Bills
                .Where(b => b.BillSource == "IPD" && b.SourceReferenceId == id)
                .FirstOrDefaultAsync();

            var charges = await _context.DailyIPDCharges
                .Where(c => c.AdmissionId == id)
                .OrderBy(c => c.ChargeDate)
                .ToListAsync();

            return Ok(new {
                success = true,
                data = new {
                    admissionInfo = new {
                        admission.AdmissionNumber,
                        admission.AdmissionDate,
                        admission.ActualDischargeDate,
                        PatientName = admission.PatientUser?.FullName,
                        DoctorName = admission.AdmittingDoctor?.User?.FullName,
                        DepartmentName = admission.Department?.Name,
                        RoomNumber = admission.Room?.RoomNumber,
                        RoomType = admission.RoomType?.Name
                    },
                    record = note,
                    billingSummary = bill != null ? new {
                        bill.BillNumber,
                        bill.SubTotal,
                        bill.GSTAmount,
                        bill.TotalAmount,
                        bill.Status,
                        Items = bill.Items != null ? System.Text.Json.JsonSerializer.Deserialize<object>(bill.Items) : null
                    } : null,
                    dailyCharges = charges
                }
            });
        }
    }
}
