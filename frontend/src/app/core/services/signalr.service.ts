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

  // FIX: Short-lived echo fingerprint set to prevent duplicate messages
  // when the server echoes back an encrypted message we just sent.
  private pendingEchoes = new Set<string>();

  constructor(
    private authService: AuthService,
    private configService: ConfigService
  ) {
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

    const url = `${this.configService.baseApiUrl}/hubs/medicore`;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(url, {
        accessTokenFactory: () => this.authService.getAccessToken() || ''
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext: signalR.RetryContext) => {
          if (retryContext.elapsedMilliseconds < 60000) return 2000;
          return 10000;
        }
      })
      .build();

    this.hubConnection.onreconnecting((err: any) => console.log('SignalR Reconnecting...', err));
    this.hubConnection.onreconnected((id?: string) => {
      console.log('SignalR Reconnected', id);
      // Re-join groups and re-register events after reconnect
      this.joinUserGroups();
      this.registerEvents();
    });
    this.hubConnection.onclose((err: any) => console.log('SignalR Connection Closed', err));

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

    this.hubConnection.invoke('JoinGroup', `user-${user.id}`);

    if (user.roles?.includes('Receptionist') || user.roles?.includes('SuperAdmin') || user.roles?.includes('HospitalAdmin')) {
      this.hubConnection.invoke('JoinGroup', 'receptionist-group');
    }
  }

  private registerEvents() {
    if (!this.hubConnection) return;

    // FIX: Remove all existing handlers before re-registering to prevent
    // duplicate handlers stacking up on every reconnect.
    this.hubConnection.off('NewAppointmentRequest');
    this.hubConnection.off('AppointmentStatusChanged');
    this.hubConnection.off('PatientCheckedIn');
    this.hubConnection.off('LabReportReady');
    this.hubConnection.off('PaymentReceived');
    this.hubConnection.off('ReceiveChatMessage');
    this.hubConnection.off('UserTyping');
    this.hubConnection.off('InitialOnlineUsers');
    this.hubConnection.off('UserOnline');
    this.hubConnection.off('UserOffline');
    this.hubConnection.off('ReceiveGroupMessage');
    this.hubConnection.off('ReceiveEmergencyAlert');

    this.hubConnection.on('NewAppointmentRequest', (data: { fullName: string }) => {
      this.addNotification({
        id: Math.random().toString(36),
        type: 'NEW_REQUEST',
        message: `New request from ${data.fullName}`,
        timestamp: new Date(),
        data,
        isRead: false
      });
    });

    this.hubConnection.on('AppointmentStatusChanged', (data: { tokenNumber: string, status: string }) => {
      this.addNotification({
        id: Math.random().toString(36),
        type: 'STATUS_CHANGED',
        message: `Appointment ${data.tokenNumber} status updated to ${data.status}`,
        timestamp: new Date(),
        data,
        isRead: false
      });
    });

    this.hubConnection.on('PatientCheckedIn', (data: { patientName: string, tokenNumber: string }) => {
      this.addNotification({
        id: Math.random().toString(36),
        type: 'CHECKED_IN',
        message: `Patient ${data.patientName} (${data.tokenNumber}) has arrived!`,
        timestamp: new Date(),
        data,
        isRead: false
      });
    });

    this.hubConnection.on('LabReportReady', (data: { testType: string }) => {
      this.addNotification({
        id: Math.random().toString(36),
        type: 'LAB_READY',
        message: `Lab result for ${data.testType} is now ready.`,
        timestamp: new Date(),
        data,
        isRead: false
      });
    });

    this.hubConnection.on('PaymentReceived', (data: { amount: number, patientName: string }) => {
      this.addNotification({
        id: Math.random().toString(36),
        type: 'PAYMENT_RECEIVED',
        message: `Received ₹${data.amount} from ${data.patientName}`,
        timestamp: new Date(),
        data,
        isRead: false
      });
    });

    // FIX: Echo deduplication now uses pendingEchoes fingerprint set,
    // which correctly matches encrypted ciphertext echoed by the server.
    this.hubConnection.on('ReceiveChatMessage', (fromUserId: string, toUserId: string, message: string, imageUrl?: string) => {
      console.log('SignalR: Received Chat Message', { fromUserId, message });

      if (this.isDndActive()) return;

      const meId = String(this.authService.currentUser()?.id);
      const isEcho = String(fromUserId) === meId;

      if (isEcho) {
        const echoKey = `${toUserId}:${message}`;
        if (this.pendingEchoes.has(echoKey)) {
          this.pendingEchoes.delete(echoKey);
          return;
        }
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

    this.hubConnection.on('UserTyping', (fromUserId: string) => {
      this.typingUserId.set(String(fromUserId));
      setTimeout(() => {
        if (this.typingUserId() === String(fromUserId)) {
          this.typingUserId.set(null);
        }
      }, 3000);
    });

    this.hubConnection.on('InitialOnlineUsers', (userIds: string[]) => {
      console.log('Online users at connection:', userIds);
      this.onlineUserIds.set(new Set(userIds.map(id => String(id))));
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
      this.addChatMessage({ groupName, fromUserId, message, sentAt: new Date() });
    });

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

    // FIX: WebRTC events are now registered via registerWebRtcEvents()
    // which properly deduplicates using hubConnection.off() first.
    this.registerWebRtcEvents();
  }

  private addNotification(notif: Notification) {
    this.notifications.set([notif, ...this.notifications()].slice(0, 50));
    this.updateUnreadCount();
    if (Notification.permission === 'granted') {
      new Notification('MediCore Alert', { body: notif.message });
    }
  }

  markAsRead(id: string) {
    this.notifications.set(this.notifications().map(n => n.id === id ? { ...n, isRead: true } : n));
    this.updateUnreadCount();
  }

  clearAll() {
    this.notifications.set([]);
    this.updateUnreadCount();
  }

  private updateUnreadCount() {
    this.unreadCount.set(this.notifications().filter(n => !n.isRead).length);
  }

  // ── Chat Methods ──────────────────────────────────────────────────

  /**
   * FIX: Mark an outgoing encrypted message so the server echo can be
   * identified and suppressed in the ReceiveChatMessage handler.
   * Call this BEFORE invoking sendChatMessage() with the encrypted payload.
   */
  markEcho(toUserId: string, encryptedMessage: string) {
    const key = `${toUserId}:${encryptedMessage}`;
    this.pendingEchoes.add(key);
    // Auto-expire after 10s in case the echo never arrives
    setTimeout(() => this.pendingEchoes.delete(key), 10000);
  }

  async sendChatMessage(toUserId: string, message: string, imageUrl?: string): Promise<boolean> {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('SendChatMessage', toUserId, message, imageUrl ?? null);
        return true;
      } catch (e) {
        console.warn('SignalR send failed, falling back to HTTP', e);
      }
    }
    try {
      const token = this.authService.getAccessToken();
      const res = await fetch(`${this.configService.baseApiUrl}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ toUserId: String(toUserId), message: message ?? '', imageUrl: imageUrl ?? null })
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error('HTTP chat/send failed', res.status, errText);
        throw new Error(`Send failed: ${res.status}`);
      }
      return true;
    } catch (e) {
      console.error('HTTP send also failed', e);
      throw e;
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

  // FIX: Stores handlers as named references so hubConnection.off() can remove
  // them by reference, preventing duplicate registrations across reconnects.
  private webRtcHandlers = new Map<string, ((...args: any[]) => void)[]>();

  onWebRtcEvent(event: string, handler: (...args: any[]) => void) {
    if (!this.webRtcHandlers.has(event)) this.webRtcHandlers.set(event, []);
    const handlers = this.webRtcHandlers.get(event)!;
    // Prevent adding the same handler function twice
    if (!handlers.includes(handler)) {
      handlers.push(handler);
    }
    // Register on hub if already connected
    if (this.hubConnection) {
      this.hubConnection.off(event, handler as any);
      this.hubConnection.on(event, handler as any);
    }
  }

  /** Remove a specific WebRTC event handler (call from ngOnDestroy of overlay). */
  offWebRtcEvent(event: string, handler: (...args: any[]) => void) {
    const handlers = this.webRtcHandlers.get(event);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx !== -1) handlers.splice(idx, 1);
    }
    this.hubConnection?.off(event, handler as any);
  }

  private registerWebRtcEvents() {
    if (!this.hubConnection) return;

    // FIX: Remove then re-add every stored handler to prevent stacking on reconnect.
    this.webRtcHandlers.forEach((handlers, event) => {
      handlers.forEach(h => {
        this.hubConnection!.off(event, h as any);
        this.hubConnection!.on(event, h as any);
      });
    });

    // FIX: IncomingCall is registered here with off() guard so it's also
    // deduplicated across reconnects. It is NOT stored in webRtcHandlers
    // because it is a service-level concern, not a component-level one.
    this.hubConnection.off('IncomingCall');
    this.hubConnection.on('IncomingCall', (fromUserId: string, callType: string) => {
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
    this.chatMessages.set([...this.chatMessages(), msg]);
  }
}