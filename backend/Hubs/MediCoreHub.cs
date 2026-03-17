using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
//A Hub in SignalR is a central server component that enables real-time communication between connected users. It acts like a smart middleman where all clients (such as doctors, patients, receptionists, and lab staff) connect, and through it they can instantly send and
// receive messages without refreshing the page. When a user connects, the Hub registers them and can track whether they are online; 
//when they disconnect, it updates their status. It allows communication in different ways, such as sending messages to a specific user (private chat), to a group (like a department), or to everyone (broadcast alerts). In your project, the Hub is also used for
// advanced features like typing indicators and video/audio calling, where it helps exchange connection data between users so they can establish a direct peer-to-peer connection. Overall, the Hub does not store or process heavy data—it mainly
// routes messages quickly and efficiently, making your application feel live and interactive, like WhatsApp or a video calling app
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
                
                // Notify others
                await Clients.Others.SendAsync("UserOnline", userId);
                
                // Send current online users back to the caller
                var onlineIds = OnlineUsers.Keys.ToList();
                await Clients.Caller.SendAsync("InitialOnlineUsers", onlineIds);
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
        public async Task SendChatMessage(string? toUserId, string? encryptedMessage, string? imageUrl = null)
        {
            if (string.IsNullOrWhiteSpace(toUserId))
                throw new HubException("ToUserId is required.");
            if (encryptedMessage == null)
                throw new HubException("Message is required.");

            var fromUserId = Context.UserIdentifier ?? "Unknown";
            var message = encryptedMessage;
            var imgUrl = imageUrl;

            try
            {
                // Relay to recipient — they see: from=sender, to=recipient
                await Clients.Group($"user-{toUserId}")
                    .SendAsync("ReceiveChatMessage", fromUserId, toUserId, message, imgUrl);

                // Echo to sender — they see: from=sender, to=recipient (same)
                await Clients.Group($"user-{fromUserId}")
                    .SendAsync("ReceiveChatMessage", fromUserId, toUserId, message, imgUrl);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MediCoreHub] SendChatMessage failed: {ex.Message}");
                throw new HubException("Failed to send message. Please try again.");
            }
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
            var fromName = Context.User?.Identity?.Name ?? "MediCore User";
            await Clients.Group($"user-{toUserId}")
                .SendAsync("IncomingCall", fromUserId, fromName, callType);
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

        public List<string> GetOnlineUsers()
        {
            return OnlineUsers.Keys.ToList();
        }
    }
}
