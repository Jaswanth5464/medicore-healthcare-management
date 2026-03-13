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

        [HttpGet("users")]
        public async Task<IActionResult> GetChatUsers()
        {
            var userIdStr = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out var currentUserId)) return Unauthorized();

            // Fetch all active users who are staff (exclude patients or users without roles)
            var users = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Where(u => u.IsActive && u.Id != currentUserId)
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

            var query = _context.ChatMessages.AsQueryable();

            if (!string.IsNullOrEmpty(groupName))
            {
                query = query.Where(m => m.GroupName == groupName);
            }
            else if (!string.IsNullOrEmpty(withUserId))
            {
                query = query.Where(m => 
                    (m.FromUserId == userId && m.ToUserId == withUserId) || 
                    (m.FromUserId == withUserId && m.ToUserId == userId));
            }
            else
            {
                // General inbox logic?
                query = query.Where(m => m.FromUserId == userId || m.ToUserId == userId);
            }

            var messages = await query
                .OrderByDescending(m => m.SentAt)
                .Take(50)
                .ToListAsync();

            return Ok(new { success = true, data = messages.OrderBy(m => m.SentAt) });
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto)
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var message = new ChatMessage
            {
                FromUserId = userId,
                ToUserId = dto.ToUserId ?? string.Empty,
                GroupName = dto.GroupName,
                Message = dto.Message,
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
                    .SendAsync("ReceiveChatMessage", userId, dto.Message, dto.ImageUrl);
                
                // Also notify sender if they have multiple connections
                await _hubContext.Clients.Group($"user-{userId}")
                    .SendAsync("ReceiveChatMessage", userId, dto.Message, dto.ImageUrl);
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
