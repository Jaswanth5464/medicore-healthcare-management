using System;

namespace MediCore.API.Modules.Communication.Models
{
    public class ChatMessage
    {
        public int Id { get; set; }
        public string FromUserId { get; set; } = string.Empty;
        public string ToUserId { get; set; } = string.Empty; // Can be a User ID or a Group Name
        public string Message { get; set; } = string.Empty;
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;
        public string? GroupName { get; set; } // If null, it's a private message
        public string? ImageUrl { get; set; }
    }
}
