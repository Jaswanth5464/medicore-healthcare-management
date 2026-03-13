using Microsoft.AspNetCore.SignalR;

namespace MediCore.API.Hubs
{
    public class MediCoreHub : Hub
    {
        // Group Names
        public const string ReceptionistGroup = "receptionist-group";
        public const string AdminGroup = "admin-group";
        public const string PharmacistGroup = "pharmacist-group";
        public const string LabGroup = "lab-group";
        public const string TokenDisplayGroup = "token-display";

        public override async Task OnConnectedAsync()
        {
            // Logic to auto-join groups based on user claims could go here
            // For now, we rely on the client calling JoinGroup
            await base.OnConnectedAsync();
        }

        public async Task JoinGroup(string groupName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        }

        public async Task LeaveGroup(string groupName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        }

        public async Task JoinUserGroup(string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
        }

        // Chat Methods
        public async Task SendChatMessage(string toUserId, string message, string? imageUrl = null)
        {
            var fromUserId = Context.UserIdentifier ?? "Unknown";
            await Clients.Group($"user-{toUserId}").SendAsync("ReceiveChatMessage", fromUserId, message, imageUrl);
            await Clients.Caller.SendAsync("ReceiveChatMessage", fromUserId, message, imageUrl); // Echo to sender
        }

        public async Task SendGroupMessage(string groupName, string message)
        {
            var fromUserId = Context.UserIdentifier ?? "Unknown";
            await Clients.Group(groupName).SendAsync("ReceiveGroupMessage", groupName, fromUserId, message);
        }

        // Emergency Broadcast
        public async Task SendEmergencyAlert(string location, string details)
        {
            await Clients.All.SendAsync("ReceiveEmergencyAlert", location, details);
        }

        // Broad message for testing
        public async Task SendMessage(string user, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }
    }
}
