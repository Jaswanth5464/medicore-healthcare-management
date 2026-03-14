using MediCore.API.Infrastructure.Database.Context;
using MediCore.API.Modules.Communication.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using MediCore.API.Hubs;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace MediCore.API.Modules.Communication.Controllers
{
    /// <summary>
    /// Dedicated patient-doctor chat: no appointment required.
    /// Patient can chat with any doctor. Doctor can chat with any patient.
    /// Uses role-only validation (Patient↔Doctor).
    /// </summary>
    [ApiController]
    [Route("api/chat/patient-doctor")]
    [Authorize(Roles = "Patient,Doctor")]
    public class PatientDoctorChatController : ControllerBase
    {
        private readonly MediCoreDbContext _context;
        private readonly IHubContext<MediCoreHub> _hubContext;

        public PatientDoctorChatController(MediCoreDbContext context, IHubContext<MediCoreHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        /// <summary>
        /// Get chat partners: patients get all doctors, doctors get all patients. No appointment check.
        /// </summary>
        [HttpGet("partners")]
        public async Task<IActionResult> GetPartners()
        {
            var userIdStr = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var currentUserId))
                return Unauthorized();

            bool isPatient = User.IsInRole("Patient");

            if (isPatient)
            {
                var doctors = await _context.DoctorProfiles
                    .Include(d => d.User)
                    .Where(d => d.User != null && d.User.IsActive)
                    .Select(d => new { Id = d.UserId.ToString(), FullName = d.User!.FullName, Role = "Doctor" })
                    .Distinct()
                    .ToListAsync();
                return Ok(new { success = true, data = doctors });
            }

            // Doctor: return all patients
            var patients = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Where(u => u.IsActive && u.Id != currentUserId && u.UserRoles.Any(ur => ur.Role.Name == "Patient"))
                .Select(u => new { Id = u.Id.ToString(), FullName = u.FullName, Role = "Patient" })
                .ToListAsync();
            return Ok(new { success = true, data = patients });
        }

        /// <summary>
        /// Get messages between current user and partner. Role-only check.
        /// </summary>
        [HttpGet("messages")]
        public async Task<IActionResult> GetMessages([FromQuery] string partnerId)
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (userId == null || string.IsNullOrEmpty(partnerId)) return BadRequest();

            if (!await ValidatePatientDoctorPair(userId, partnerId))
                return Forbid();

            var messages = await _context.ChatMessages
                .Where(m => m.GroupName == null &&
                    ((m.FromUserId == userId && m.ToUserId == partnerId) || (m.FromUserId == partnerId && m.ToUserId == userId)))
                .OrderBy(m => m.SentAt)
                .Take(100)
                .ToListAsync();

            return Ok(new { success = true, data = messages });
        }

        /// <summary>
        /// Send message to partner. Role-only check.
        /// </summary>
        [HttpPost("send")]
        public async Task<IActionResult> Send([FromBody] PatientDoctorSendDto dto)
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (userId == null || string.IsNullOrEmpty(dto.ToUserId))
                return BadRequest(new { success = false, message = "ToUserId is required" });

            if (!await ValidatePatientDoctorPair(userId, dto.ToUserId))
                return Forbid();

            var message = new ChatMessage
            {
                FromUserId = userId,
                ToUserId = dto.ToUserId,
                Message = dto.Message ?? string.Empty,
                ImageUrl = dto.ImageUrl,
                SentAt = DateTime.UtcNow
            };
            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            // Push via SignalR
            await _hubContext.Clients.Group($"user-{dto.ToUserId}")
                .SendAsync("ReceiveChatMessage", userId, dto.ToUserId, message.Message, message.ImageUrl);
            await _hubContext.Clients.Group($"user-{userId}")
                .SendAsync("ReceiveChatMessage", userId, dto.ToUserId, message.Message, message.ImageUrl);

            return Ok(new { success = true, data = message });
        }

        private async Task<bool> ValidatePatientDoctorPair(string myId, string partnerId)
        {
            if (string.IsNullOrEmpty(partnerId)) return false;
            bool iAmPatient = User.IsInRole("Patient");
            bool partnerIsPatient = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Where(u => u.Id.ToString() == partnerId)
                .SelectMany(u => u.UserRoles)
                .AnyAsync(ur => ur.Role.Name == "Patient");
            bool partnerIsDoctor = await _context.DoctorProfiles.AnyAsync(d => d.UserId.ToString() == partnerId);

            return (iAmPatient && partnerIsDoctor) || (!iAmPatient && partnerIsPatient);
        }
    }

    public class PatientDoctorSendDto
    {
        public string ToUserId { get; set; } = string.Empty;
        public string? Message { get; set; }
        public string? ImageUrl { get; set; }
    }
}
