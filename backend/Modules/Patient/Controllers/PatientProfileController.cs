using MediCore.API.Infrastructure.Database.Context;
using MediCore.API.Modules.Patient.Models;
// This file (PatientProfileController) manages patient-specific information like their Blood Group and Date of Birth.
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MediCore.API.Modules.Patient.Controllers
{
    [ApiController]
    [Route("api/patient/profiles")]
    public class PatientProfileController : ControllerBase
    {
        private readonly MediCoreDbContext _context;

        public PatientProfileController(MediCoreDbContext context)
        {
            _context = context;
        }

        // This function lets a logged-in patient view their own detailed profile.
        [HttpGet("my")]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userIdStr = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (userIdStr == null || !int.TryParse(userIdStr, out int userId))
                return Unauthorized(new { success = false, message = "Invalid token" });

            var profile = await _context.PatientProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
            {
                // Create a default profile if it doesn't exist
                profile = new PatientProfile
                {
                    UserId = userId,
                    BloodGroup = "Unknown",
                    UpdatedAt = DateTime.UtcNow
                };
                _context.PatientProfiles.Add(profile);
                await _context.SaveChangesAsync();
            }

            return Ok(new { success = true, data = profile });
        }

        [HttpPut]
        [Authorize(Roles = "Patient")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdatePatientProfileDto dto)
        {
            var userIdStr = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (userIdStr == null || !int.TryParse(userIdStr, out int userId))
                return Unauthorized(new { success = false, message = "Invalid token" });

            var profile = await _context.PatientProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (profile == null)
            {
                profile = new PatientProfile { UserId = userId };
                _context.PatientProfiles.Add(profile);
            }

            profile.BloodGroup = dto.BloodGroup;
            profile.Allergies = dto.Allergies;
            profile.ChronicConditions = dto.ChronicConditions;
            profile.EmergencyContactName = dto.EmergencyContactName;
            profile.EmergencyContactPhone = dto.EmergencyContactPhone;
            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Profile updated successfully", data = profile });
        }

        [HttpGet("list")]
        [Authorize(Roles = "SuperAdmin,HospitalAdmin,Receptionist,Doctor,Pharmacist")]
        public async Task<IActionResult> GetAllPatients()
        {
            var patients = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Where(u => u.UserRoles.Any(ur => ur.Role.Name == "Patient") && u.IsActive)
                .OrderBy(u => u.FullName)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.PhoneNumber
                })
                .ToListAsync();

            return Ok(new { success = true, data = patients });
        }
    }

    public class UpdatePatientProfileDto
    {
        public string BloodGroup { get; set; } = string.Empty;
        public string Allergies { get; set; } = string.Empty;
        public string ChronicConditions { get; set; } = string.Empty;
        public string EmergencyContactName { get; set; } = string.Empty;
        public string EmergencyContactPhone { get; set; } = string.Empty;
    }
}
