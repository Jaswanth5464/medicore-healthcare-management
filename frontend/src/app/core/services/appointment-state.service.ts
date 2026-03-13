import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Appointment {
  id: number;
  tokenNumber: string;
  appointmentDate: string;
  timeSlot: string;
  status: 'Scheduled' | 'CheckedIn' | 'WithDoctor' | 'Completed' | 'Cancelled' | 'NoShow';
  visitType: string;
  symptoms: string;
  consultationFee: number;
  paymentStatus: string;
  checkedInAt?: string;
  queuePosition?: number;
  patient: { id: number; fullName: string; phoneNumber: string; email: string };
  doctor: { id: number; fullName: string; specialization: string };
  department: { id: number; name: string; icon?: string };
}

export interface CalendarDoctor {
  doctorProfileId: number;
  doctorName: string;
  department: string;
  departmentId: number;
  specialization: string;
  isAvailableToday: boolean;
  slots: CalendarSlot[];
}

export interface CalendarSlot {
  time: string;
  displayTime: string;
  status: 'Available' | 'Booked' | 'CheckedIn' | 'WithDoctor' | 'Completed' | 'NoShow' | 'WalkIn' | 'Unavailable' | 'Cancelled';
  appointmentId?: number;
  patientName?: string;
  tokenNumber?: string;
  visitType?: string;
  session: string;
}

import { ConfigService } from './config.service';

// const BASE_URL = 'https://localhost:7113';

@Injectable({ providedIn: 'root' })
export class AppointmentStateService {
  private readonly config = inject(ConfigService);
  private readonly BASE_URL = this.config.baseApiUrl;
  // ─── Core signals ────────────────────────────────────────────────
  private _today = signal<Appointment[]>([]);
  private _calendarData = signal<CalendarDoctor[]>([]);
  private _calendarDate = signal<string>(new Date().toISOString().split('T')[0]);
  private _loading = signal(false);
  private _calendarLoading = signal(false);
  private _error = signal<string | null>(null);

  // ─── Public readonly views ────────────────────────────────────────
  todayAppointments = this._today.asReadonly();
  calendarData = this._calendarData.asReadonly();
  calendarDate = this._calendarDate.asReadonly();
  isLoading = this._loading.asReadonly();
  isCalendarLoading = this._calendarLoading.asReadonly();
  error = this._error.asReadonly();

  // ─── Computed views ───────────────────────────────────────────────
  pendingQueue = computed(() =>
    this._today().filter(a => a.status === 'CheckedIn' || a.status === 'Scheduled')
      .sort((a, b) => {
        if (a.queuePosition && b.queuePosition) return a.queuePosition - b.queuePosition;
        return a.timeSlot.localeCompare(b.timeSlot);
      })
  );
  checkedInPatients = computed(() =>
    this._today().filter(a => a.status === 'CheckedIn')
  );
  withDoctorPatients = computed(() =>
    this._today().filter(a => a.status === 'WithDoctor')
  );
  completedToday = computed(() =>
    this._today().filter(a => a.status === 'Completed')
  );
  totalToday = computed(() => this._today().length);
  completedCount = computed(() => this.completedToday().length);
  checkedInCount = computed(() => this.checkedInPatients().length);
  withDoctorCount = computed(() => this.withDoctorPatients().length);

  constructor(private http: HttpClient) {}

  // ─── Load today's appointments from the backend ───────────────────
  loadToday(headers: any, doctorProfileId?: number): void {
    this._loading.set(true);
    let url = `${this.BASE_URL}/api/appointments/today`;
    if (doctorProfileId) url += `?doctorProfileId=${doctorProfileId}`;
    this.http.get<any>(url, { headers }).subscribe({
      next: res => {
        if (res.success) {
          this._today.set(res.data);
        }
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
        this._error.set('Failed to load appointments');
      }
    });
  }

  // ─── Load the calendar view for a date ───────────────────────────
  loadCalendar(headers: any, date: string, departmentId?: number, doctorProfileId?: number): void {
    this._calendarLoading.set(true);
    this._calendarDate.set(date);
    let url = `${this.BASE_URL}/api/appointments/calendar?date=${date}`;
    if (departmentId) url += `&departmentId=${departmentId}`;
    if (doctorProfileId) url += `&doctorProfileId=${doctorProfileId}`;
    this.http.get<any>(url, { headers }).subscribe({
      next: res => {
        if (res.success) {
          this._calendarData.set(res.data);
        }
        this._calendarLoading.set(false);
      },
      error: () => {
        this._calendarLoading.set(false);
        this._error.set('Failed to load calendar');
      }
    });
  }

  // ─── Optimistic status update ─────────────────────────────────────
  updateStatus(id: number, newStatus: Appointment['status'], headers: any): void {
    // Optimistic: update today signal
    this._today.update(list =>
      list.map(a => a.id === id ? { ...a, status: newStatus } : a)
    );

    // Optimistic: update calendar signal
    const calStatus = newStatus === 'Scheduled' ? 'Booked' : newStatus as any;
    this._calendarData.update(doctors => 
      doctors.map(d => ({
        ...d,
        slots: d.slots.map(s => s.appointmentId === id ? { ...s, status: calStatus } : s)
      }))
    );

    // Refresh calendar too
    const date = this._calendarDate();
    this.http.patch<any>(`${this.BASE_URL}/api/appointments/${id}/status`, { status: newStatus }, { headers })
      .subscribe({
        next: () => {
          // After success, reload to ensure absolute accuracy (queue positions, etc.)
          this.refresh(headers);
        },
        error: () => {
          // Revert on failure
          this.loadToday(headers);
          this.loadCalendar(headers, date);
          this._error.set('Status update failed, please try again.');
        }
      });
  }

  // ─── Refresh both today and calendar ─────────────────────────────
  refresh(headers: any, doctorProfileId?: number): void {
    const date = this._calendarDate();
    this.loadToday(headers, doctorProfileId);
    this.loadCalendar(headers, date);
  }
}
