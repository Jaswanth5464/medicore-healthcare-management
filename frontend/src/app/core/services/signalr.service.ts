import { Injectable, signal, effect } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { ConfigService } from './config.service';

export interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  data: any;
  isRead: boolean;
}

export interface ChatMessage {
  id?: number;
  fromUserId: string;
  toUserId?: string;
  groupName?: string;
  message: string;
  imageUrl?: string;
  sentAt: Date;
  status?: 'sent' | 'delivered' | 'read';
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  
  // Real-time signals for UI components
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  chatMessages = signal<ChatMessage[]>([]);
  activeChatPartner = signal<string | null>(null);
  // DND & presence
  isDndActive = signal<boolean>(false);
  onlineUserIds = signal<Set<string>>(new Set());
  typingUserId = signal<string | null>(null);
  
  constructor(
    private authService: AuthService,
    private configService: ConfigService
  ) {
    // Automatically manage connection based on auth state using effect
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.startConnection();
      } else {
        this.stopConnection();
      }
    });
  }

  private startConnection() {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) return;

    const token = this.authService.getAccessToken();
    const url = `${this.configService.baseApiUrl}/hubs/medicore`;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(url, {
        // Use a function that gets the LATEST token every time it connects or reconnects
        accessTokenFactory: () => this.authService.getAccessToken() || ''
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext: signalR.RetryContext) => {
          if (retryContext.elapsedMilliseconds < 60000) return 2000;
          return 10000;
        }
      })
      .build();

    this.hubConnection.onreconnecting((err: any) => console.log('SignalR: Reconnecting...', err));
    this.hubConnection.onreconnected((id?: string) => {
      console.log('SignalR: Reconnected', id);
      this.joinUserGroups(); // Crucial to re-join role-based groups
    });
    this.hubConnection.onclose((err: any) => console.log('SignalR: Connection Closed', err));

    this.hubConnection.start()
      .then(() => {
        console.log('SignalR connected');
        this.registerEvents();
        this.joinUserGroups();
      })
      .catch((err: any) => console.error('Error starting SignalR:', err));
  }

  private stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
    }
  }

  private joinUserGroups() {
    const user = this.authService.currentUser();
    if (!user || !this.hubConnection) return;

    // join generic human group for individual notifications
    this.hubConnection.invoke('JoinGroup', `user-${user.id}`);
    
    // join group for specific roles
    if (user.roles?.includes('Receptionist') || user.roles?.includes('SuperAdmin') || user.roles?.includes('HospitalAdmin')) {
      this.hubConnection.invoke('JoinGroup', 'receptionist-group');
    }
  }

  private registerEvents() {
    if (!this.hubConnection) return;

    // Listen for new appointment requests (Receptionists)
    this.hubConnection.on('NewAppointmentRequest', (data: { fullName: string }) => {
      this.addNotification({
        id: Math.random().toString(36),
        type: 'NEW_REQUEST',
        message: `New request from ${data.fullName}`,
        timestamp: new Date(),
        data: data,
        isRead: false
      });
    });

    // Listen for status changes (Patients/Receptionists)
    this.hubConnection.on('AppointmentStatusChanged', (data: { tokenNumber: string, status: string }) => {
      this.addNotification({
        id: Math.random().toString(36),
        type: 'STATUS_CHANGED',
        message: `Appointment ${data.tokenNumber} status updated to ${data.status}`,
        timestamp: new Date(),
        data: data,
        isRead: false
      });
    });

    // Listen for patient check-ins (Doctors)
    this.hubConnection.on('PatientCheckedIn', (data: { patientName: string, tokenNumber: string }) => {
      this.addNotification({
        id: Math.random().toString(36),
        type: 'CHECKED_IN',
        message: `Patient ${data.patientName} (${data.tokenNumber}) has arrived!`,
        timestamp: new Date(),
        data: data,
        isRead: false
      });
    });

    // Listen for lab reports ready (Patients/Doctors)
    this.hubConnection.on('LabReportReady', (data: { testType: string }) => {
      this.addNotification({
        id: Math.random().toString(36),
        type: 'LAB_READY',
        message: `Lab result for ${data.testType} is now ready.`,
        timestamp: new Date(),
        data: data,
        isRead: false
      });
    });

    // Listen for payments received (Receptionists/Admins)
    this.hubConnection.on('PaymentReceived', (data: { amount: number, patientName: string }) => {
      this.addNotification({
        id: Math.random().toString(36),
        type: 'PAYMENT_RECEIVED',
        message: `Received ₹${data.amount} from ${data.patientName}`,
        timestamp: new Date(),
        data: data,
        isRead: false
      });
    });

    // Listen for Chat Messages — Hub now sends (fromUserId, toUserId, message, imageUrl)
    this.hubConnection.on('ReceiveChatMessage', (fromUserId: string, toUserId: string, message: string, imageUrl?: string) => {
      console.log('SignalR: Received Chat Message', { fromUserId, message });
      // Ignore messages if DND is active
      if (this.isDndActive()) return;

      const meId = String(this.authService.currentUser()?.id);
      
      // If I'm the sender (Echo from server), and I already have this message locally, skip
      // Note: simplistic check using contents since we don't have stable IDs for all messages yet
      const current = this.chatMessages();
      const isEcho = String(fromUserId) === meId;
      
      if (isEcho) {
        const alreadyExists = current.some(m => 
          String(m.fromUserId) === meId && 
          m.message === message && 
          (new Date().getTime() - new Date(m.sentAt).getTime() < 5000)
        );
        if (alreadyExists) return;
      }

      this.addChatMessage({
        fromUserId: String(fromUserId),
        toUserId: String(toUserId),
        message,
        imageUrl,
        sentAt: new Date(),
        status: isEcho ? 'sent' : 'delivered'
      });
    });

    // Typing indicator
    this.hubConnection.on('UserTyping', (fromUserId: string) => {
      this.typingUserId.set(String(fromUserId));
      setTimeout(() => {
        if (this.typingUserId() === String(fromUserId)) {
          this.typingUserId.set(null);
        }
      }, 3000);
    });

    // Online/offline presence
    this.hubConnection.on('InitialOnlineUsers', (userIds: string[]) => {
      console.log('Online users at connection:', userIds);
      const stringIds = userIds.map(id => String(id));
      this.onlineUserIds.set(new Set(stringIds));
    });
    this.hubConnection.on('UserOnline', (userId: string) => {
      console.log('User came online:', userId);
      this.onlineUserIds.update(s => { const n = new Set(s); n.add(String(userId)); return n; });
    });
    this.hubConnection.on('UserOffline', (userId: string) => {
      console.log('User went offline:', userId);
      this.onlineUserIds.update(s => { const n = new Set(s); n.delete(String(userId)); return n; });
    });

    this.hubConnection.on('ReceiveGroupMessage', (groupName: string, fromUserId: string, message: string) => {
      this.addChatMessage({
        groupName,
        fromUserId,
        message,
        sentAt: new Date()
      });
    });
    
    // Listen for Emergency Alerts
    this.hubConnection.on('ReceiveEmergencyAlert', (location: string, details: string) => {
      this.addNotification({
        id: Math.random().toString(36),
        type: 'EMERGENCY',
        message: `EMERGENCY at ${location}: ${details}`,
        timestamp: new Date(),
        data: { location, details },
        isRead: false
      });
    });

    // Register WebRTC signaling events
    this.registerWebRtcEvents();
  }

  private addNotification(notif: Notification) {
    const current = this.notifications();
    this.notifications.set([notif, ...current].slice(0, 50)); // Keep last 50
    this.updateUnreadCount();
    
    // Also trigger browser notification if possible
    if (Notification.permission === "granted") {
      new Notification("MediCore Alert", { body: notif.message });
    }
  }

  markAsRead(id: string) {
    const current = this.notifications();
    const updated = current.map(n => n.id === id ? { ...n, isRead: true } : n);
    this.notifications.set(updated);
    this.updateUnreadCount();
  }

  clearAll() {
    this.notifications.set([]);
    this.updateUnreadCount();
  }

  private updateUnreadCount() {
    const count = this.notifications().filter(n => !n.isRead).length;
    this.unreadCount.set(count);
  }

  // Chat Methods
  async sendChatMessage(toUserId: string, message: string, imageUrl?: string): Promise<boolean> {
    // Try SignalR first (real-time)
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('SendChatMessage', toUserId, message, imageUrl ?? null);
        return true;
      } catch (e) {
        console.warn('SignalR send failed, falling back to HTTP', e);
      }
    }
    // Fallback: HTTP POST
    try {
      const token = this.authService.getAccessToken();
      await fetch(`${this.configService.baseApiUrl}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ toUserId, message, imageUrl })
      });
      return true;
    } catch (e) {
      console.error('HTTP send also failed', e);
      return false;
    }
  }

  async sendTypingIndicator(toUserId: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      try { await this.hubConnection.invoke('SendTypingIndicator', toUserId); } catch {}
    }
  }

  async sendGroupMessage(groupName: string, message: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.invoke('SendGroupMessage', groupName, message);
    }
  }

  toggleDnd() {
    this.isDndActive.update(v => !v);
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUserIds().has(String(userId));
  }

  // ── WebRTC Signaling ──────────────────────────────────────────────
  incomingCall = signal<{ from: string; callType: string } | null>(null);

  private webRtcHandlers = new Map<string, Function[]>();

  onWebRtcEvent(event: string, handler: (...args: any[]) => void) {
    if (!this.webRtcHandlers.has(event)) this.webRtcHandlers.set(event, []);
    this.webRtcHandlers.get(event)!.push(handler);
    // If hub already connected, register now
    if (this.hubConnection) this.hubConnection.on(event, handler as any);
  }

  private registerWebRtcEvents() {
    // Re-register persisted handlers after reconnect
    this.webRtcHandlers.forEach((handlers, event) => {
      handlers.forEach(h => this.hubConnection?.on(event, h as any));
    });
    // Incoming call signal
    this.hubConnection?.on('IncomingCall', (fromUserId: string, callType: string) => {
      if (!this.isDndActive()) this.incomingCall.set({ from: fromUserId, callType });
    });
  }

  async sendCallRequest(toUserId: string, callType: 'video' | 'audio') {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected)
      await this.hubConnection.invoke('SendCallRequest', toUserId, callType);
  }

  async sendCallResponse(toUserId: string, accepted: boolean) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected)
      await this.hubConnection.invoke('SendCallResponse', toUserId, accepted);
  }

  async sendOffer(toUserId: string, offer: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected)
      await this.hubConnection.invoke('SendOffer', toUserId, offer);
  }

  async sendAnswer(toUserId: string, answer: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected)
      await this.hubConnection.invoke('SendAnswer', toUserId, answer);
  }

  async sendIceCandidate(toUserId: string, candidate: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected)
      await this.hubConnection.invoke('SendIceCandidate', toUserId, candidate);
  }

  async endCall(toUserId: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected)
      await this.hubConnection.invoke('EndCall', toUserId);
  }

  private addChatMessage(msg: ChatMessage) {
    const current = this.chatMessages();
    this.chatMessages.set([...current, msg]);
  }
}
