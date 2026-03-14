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
    [ApiController]
    [Route("api/chat")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly MediCoreDbContext _context;
        private readonly IHubContext<MediCoreHub> _hubContext;

        public ChatController(MediCoreDbContext context, IHubContext<MediCoreHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        /// <summary>
        /// Returns the list of users this user is allowed to chat with.
        /// - Patients can ONLY chat with their assigned doctors (confirmed appointments).
        /// - Doctors see all staff + their assigned patients.
        /// - Other staff see only other staff (not patients).
        /// </summary>
        [HttpGet("users")]
        public async Task<IActionResult> GetChatUsers()
        {
            var userIdStr = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out var currentUserId)) return Unauthorized();

            var currentRoles = User.Claims
                .Where(c => c.Type == ClaimTypes.Role)
                .Select(c => c.Value)
                .ToList();

            bool isPatient = currentRoles.Contains("Patient");

            if (isPatient)
            {
                // Patients see doctors they have current or past appointments with
                var statuses = new[] { "Confirmed", "Scheduled", "CheckedIn", "Completed" };
                var assignedDoctors = await _context.Appointments
                    .Include(a => a.DoctorProfile)
                        .ThenInclude(dp => dp.User)
                    .Where(a => a.PatientUserId == currentUserId
                             && statuses.Contains(a.Status)
                             && a.DoctorProfile != null
                             && a.DoctorProfile.User != null)
                    .Select(a => new
                    {
                        Id = a.DoctorProfile.UserId.ToString(),
                        FullName = a.DoctorProfile.User.FullName,
                        Role = "Doctor"
                    })
                    .Distinct()
                    .ToListAsync();

                return Ok(new { success = true, data = assignedDoctors });
            }

            bool isDoctor = currentRoles.Contains("Doctor");

            if (isDoctor)
            {
                // Doctors see all staff
                var staff = await _context.Users
                    .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                    .Where(u => u.IsActive && u.Id != currentUserId
                             && u.UserRoles.Any(ur => ur.Role.Name != "Patient"))
                    .Select(u => new
                    {
                        Id = u.Id.ToString(),
                        FullName = u.FullName,
                        Role = u.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? "Staff"
                    })
                    .ToListAsync();

                // Get doctor's own profile and assigned patients
                var doctorProfile = await _context.DoctorProfiles
                    .FirstOrDefaultAsync(d => d.UserId == currentUserId);

                if (doctorProfile != null)
                {
                    var statuses = new[] { "Confirmed", "Scheduled", "CheckedIn", "Completed" };
                    var patients = await _context.Appointments
                        .Include(a => a.PatientUser)
                        .Where(a => a.DoctorProfileId == doctorProfile.Id
                                 && statuses.Contains(a.Status)
                                 && a.PatientUser != null)
                        .Select(a => new
                        {
                            Id = a.PatientUserId.ToString(),
                            FullName = a.PatientUser.FullName,
                            Role = "Patient"
                        })
                        .Distinct()
                        .ToListAsync();

                    var combined = staff
                        .Concat(patients.Select(p => new { p.Id, p.FullName, p.Role }))
                        .DistinctBy(u => u.Id)
                        .ToList();

                    return Ok(new { success = true, data = combined });
                }

                return Ok(new { success = true, data = staff });
            }

            // All other staff: see only other staff (no patients)
            var users = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Where(u => u.IsActive && u.Id != currentUserId
                         && u.UserRoles.Any(ur => ur.Role.Name != "Patient"))
                .Select(u => new
                {
                    Id = u.Id.ToString(),
                    FullName = u.FullName,
                    Role = u.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? "Staff"
                })
                .ToListAsync();

            return Ok(new { success = true, data = users });
        }

        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentMessages([FromQuery] string? withUserId, [FromQuery] string? groupName)
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            // Patient access: must have appointment with this doctor (current or completed)
            if (User.IsInRole("Patient") && !string.IsNullOrEmpty(withUserId))
            {
                if (!int.TryParse(userId, out var patientId)) return Unauthorized();
                var statuses = new[] { "Confirmed", "Scheduled", "CheckedIn", "Completed" };
                var allowed = await _context.Appointments
                    .Include(a => a.DoctorProfile)
                    .AnyAsync(a => a.PatientUserId == patientId
                                && statuses.Contains(a.Status)
                                && a.DoctorProfile != null
                                && a.DoctorProfile.UserId.ToString() == withUserId);
                if (!allowed) return Forbid();
            }

            // Doctor access: must have appointment with this patient
            if (User.IsInRole("Doctor") && !string.IsNullOrEmpty(withUserId) && int.TryParse(withUserId, out var patientIdForDoctor))
            {
                var doctorProfile = await _context.DoctorProfiles.FirstOrDefaultAsync(d => d.UserId.ToString() == userId);
                if (doctorProfile != null)
                {
                    var statuses = new[] { "Confirmed", "Scheduled", "CheckedIn", "Completed" };
                    var hasAppointment = await _context.Appointments
                        .AnyAsync(a => a.DoctorProfileId == doctorProfile.Id && a.PatientUserId == patientIdForDoctor && statuses.Contains(a.Status));
                    if (!hasAppointment) return Forbid();
                }
            }

            var query = _context.ChatMessages.AsQueryable();

            if (!string.IsNullOrEmpty(groupName))
                query = query.Where(m => m.GroupName == groupName);
            else if (!string.IsNullOrEmpty(withUserId))
                query = query.Where(m =>
                    (m.FromUserId == userId && m.ToUserId == withUserId) ||
                    (m.FromUserId == withUserId && m.ToUserId == userId));
            else
                query = query.Where(m => m.FromUserId == userId || m.ToUserId == userId);

            var messages = await query.OrderByDescending(m => m.SentAt).Take(50).ToListAsync();
            return Ok(new { success = true, data = messages.OrderBy(m => m.SentAt) });
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            // Patient sending to doctor: must have appointment
            if (User.IsInRole("Patient") && !string.IsNullOrEmpty(dto.ToUserId))
            {
                if (!int.TryParse(userId, out var patientId)) return Unauthorized();
                var statuses = new[] { "Confirmed", "Scheduled", "CheckedIn", "Completed" };
                var allowed = await _context.Appointments
                    .Include(a => a.DoctorProfile)
                    .AnyAsync(a => a.PatientUserId == patientId
                                && statuses.Contains(a.Status)
                                && a.DoctorProfile != null
                                && a.DoctorProfile.UserId.ToString() == dto.ToUserId);
                if (!allowed) return Forbid();
            }

            // Doctor sending to patient: must have appointment with that patient
            if (User.IsInRole("Doctor") && !string.IsNullOrEmpty(dto.ToUserId) && int.TryParse(dto.ToUserId, out var targetPatientId))
            {
                var doctorProfile = await _context.DoctorProfiles.FirstOrDefaultAsync(d => d.UserId.ToString() == userId);
                if (doctorProfile != null)
                {
                    var statuses = new[] { "Confirmed", "Scheduled", "CheckedIn", "Completed" };
                    var hasAppointment = await _context.Appointments
                        .AnyAsync(a => a.DoctorProfileId == doctorProfile.Id && a.PatientUserId == targetPatientId && statuses.Contains(a.Status));
                    if (!hasAppointment) return Forbid();
                }
            }

            // Message is stored as-is (client sends AES-GCM ciphertext)
            var message = new ChatMessage
            {
                FromUserId = userId,
                ToUserId = dto.ToUserId ?? string.Empty,
                GroupName = dto.GroupName,
                Message = dto.Message ?? string.Empty,
                ImageUrl = dto.ImageUrl,
                SentAt = DateTime.UtcNow
            };

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            if (!string.IsNullOrEmpty(dto.GroupName))
            {
                await _hubContext.Clients.Group(dto.GroupName)
                    .SendAsync("ReceiveGroupMessage", dto.GroupName, userId, dto.Message);
            }
            else if (!string.IsNullOrEmpty(dto.ToUserId))
            {
                await _hubContext.Clients.Group($"user-{dto.ToUserId}")
                    .SendAsync("ReceiveChatMessage", userId, dto.ToUserId, dto.Message, dto.ImageUrl);
                await _hubContext.Clients.Group($"user-{userId}")
                    .SendAsync("ReceiveChatMessage", userId, dto.ToUserId, dto.Message, dto.ImageUrl);
            }

            return Ok(new { success = true, data = message });
        }
    }

    public class SendMessageDto
    {
        public string? ToUserId { get; set; }
        public string? GroupName { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
    }
}
