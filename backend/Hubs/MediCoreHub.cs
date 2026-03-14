using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace MediCore.API.Hubs
{
    [Authorize]
    public class MediCoreHub : Hub
    {
        // Group Names
        public const string ReceptionistGroup = "receptionist-group";
        public const string AdminGroup = "admin-group";
        public const string PharmacistGroup = "pharmacist-group";
        public const string LabGroup = "lab-group";
        public const string TokenDisplayGroup = "token-display";

        // Track online users (userId -> connectionId)
        private static readonly ConcurrentDictionary<string, string> OnlineUsers = new();

        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;
            if (!string.IsNullOrEmpty(userId))
            {
                OnlineUsers[userId] = Context.ConnectionId;
                // Auto-join personal group
                await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
                // Broadcast online presence
                await Clients.Others.SendAsync("UserOnline", userId);
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.UserIdentifier;
            if (!string.IsNullOrEmpty(userId))
            {
                OnlineUsers.TryRemove(userId, out _);
                await Clients.Others.SendAsync("UserOffline", userId);
            }
            await base.OnDisconnectedAsync(exception);
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

        // ── Chat ───────────────────────────────────────────────────────
        /// <summary>
        /// Sends an encrypted message to a specific user.
        /// Note: the message payload is already AES-GCM encrypted by the client.
        /// The server acts only as a relay and never sees plaintext.
        /// </summary>
        public async Task SendChatMessage(string toUserId, string encryptedMessage, string? imageUrl = null)
        {
            var fromUserId = Context.UserIdentifier ?? "Unknown";
            // Relay to recipient
            await Clients.Group($"user-{toUserId}")
                .SendAsync("ReceiveChatMessage", fromUserId, encryptedMessage, imageUrl);
            // Echo to all sender's connections (multi-device support)
            await Clients.Group($"user-{fromUserId}")
                .SendAsync("ReceiveChatMessage", fromUserId, encryptedMessage, imageUrl);
        }

        public async Task SendGroupMessage(string groupName, string message)
        {
            var fromUserId = Context.UserIdentifier ?? "Unknown";
            await Clients.Group(groupName).SendAsync("ReceiveGroupMessage", groupName, fromUserId, message);
        }

        // ── Typing indicator ──────────────────────────────────────────
        public async Task SendTypingIndicator(string toUserId)
        {
            var fromUserId = Context.UserIdentifier ?? "Unknown";
            await Clients.Group($"user-{toUserId}").SendAsync("UserTyping", fromUserId);
        }

        // ── WebRTC Signaling ──────────────────────────────────────────
        /// <summary>Initiates a call (video or audio) to a target user.</summary>
        public async Task SendCallRequest(string toUserId, string callType)
        {
            var fromUserId = Context.UserIdentifier ?? "Unknown";
            await Clients.Group($"user-{toUserId}")
                .SendAsync("IncomingCall", fromUserId, callType);
        }

        /// <summary>Accept or reject an incoming call.</summary>
        public async Task SendCallResponse(string toUserId, bool accepted)
        {
            var fromUserId = Context.UserIdentifier ?? "Unknown";
            await Clients.Group($"user-{toUserId}")
                .SendAsync("CallResponse", fromUserId, accepted);
        }

        /// <summary>Relay WebRTC SDP offer.</summary>
        public async Task SendOffer(string toUserId, string offer)
        {
            var fromUserId = Context.UserIdentifier ?? "Unknown";
            await Clients.Group($"user-{toUserId}")
                .SendAsync("ReceiveOffer", fromUserId, offer);
        }

        /// <summary>Relay WebRTC SDP answer.</summary>
        public async Task SendAnswer(string toUserId, string answer)
        {
            var fromUserId = Context.UserIdentifier ?? "Unknown";
            await Clients.Group($"user-{toUserId}")
                .SendAsync("ReceiveAnswer", fromUserId, answer);
        }

        /// <summary>Relay ICE candidate for NAT traversal.</summary>
        public async Task SendIceCandidate(string toUserId, string candidate)
        {
            var fromUserId = Context.UserIdentifier ?? "Unknown";
            await Clients.Group($"user-{toUserId}")
                .SendAsync("ReceiveIceCandidate", fromUserId, candidate);
        }

        /// <summary>End / hang up the current call.</summary>
        public async Task EndCall(string toUserId)
        {
            var fromUserId = Context.UserIdentifier ?? "Unknown";
            await Clients.Group($"user-{toUserId}")
                .SendAsync("CallEnded", fromUserId);
        }

        // ── Emergency Broadcast ───────────────────────────────────────
        public async Task SendEmergencyAlert(string location, string details)
        {
            await Clients.All.SendAsync("ReceiveEmergencyAlert", location, details);
        }

        public async Task SendMessage(string user, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }
    }
}
