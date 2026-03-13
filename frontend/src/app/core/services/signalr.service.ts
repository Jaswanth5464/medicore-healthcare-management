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

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  
  // Real-time signals for UI components
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  
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
        accessTokenFactory: () => token || '',
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

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

    // join group for user id
    this.hubConnection.invoke('JoinGroup', `patient-${user.id}`);
    
    // join group for specific roles
    if (user.roles?.includes('Receptionist') || user.roles?.includes('SuperAdmin') || user.roles?.includes('HospitalAdmin')) {
      this.hubConnection.invoke('JoinGroup', 'receptionist');
    }
    
    // If it's a doctor, we might need the DoctorProfileId. 
    // For SignalR, the backend triggers doctor-{doctorProfileId}.
    // We could either join that here if we have it, or trigger it from the dashboard.
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
}
