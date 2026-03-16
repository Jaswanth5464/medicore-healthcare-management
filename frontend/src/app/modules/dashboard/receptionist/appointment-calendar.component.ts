import { Component, signal, computed, OnInit, OnDestroy, Output, EventEmitter, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentStateService, CalendarDoctor, CalendarSlot } from '../../../core/services/appointment-state.service';
import { NotificationService } from '../../../core/services/notification.service';

import { ConfigService } from '../../../core/services/config.service';

// const BASE_URL = 'https://localhost:7113';

interface Department { id: number; name: string; }
interface Doctor { id: number; fullName: string; departmentId?: number; }

interface SlotPopup {
  slot: CalendarSlot;
  doctorProfileId: number;
  doctorName: string;
  x: number;
  y: number;
}

@Component({
  selector: 'app-appointment-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cal-wrapper">
      <!-- Header Bar -->
      <div class="cal-header">
        <div class="cal-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>Appointment Calendar</span>
        </div>
        <div class="cal-date-nav">
          <button class="nav-btn" (click)="changeDate(-1)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="cal-date-label">{{ formattedDate() }}</span>
          <button class="nav-btn" (click)="changeDate(1)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button class="today-btn" (click)="goToday()">Today</button>
        </div>
        <div class="cal-filters">
          <select [(ngModel)]="filterDeptId" (ngModelChange)="applyFilter()" class="cal-select">
            <option [value]="0">All Departments</option>
            <option *ngFor="let d of departments()" [value]="d.id">{{ d.name }}</option>
          </select>
          <select [(ngModel)]="filterDoctorId" (ngModelChange)="applyFilter()" class="cal-select">
            <option [value]="0">All Doctors</option>
            <option *ngFor="let d of doctors()" [value]="d.id">{{ d.fullName }}</option>
          </select>
          <button class="refresh-btn" (click)="refresh()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
        </div>
      </div>

      <!-- Legend -->
      <div class="legend">
        <span class="leg" *ngFor="let l of legend"><span class="leg-dot" [style.background]="l.color"></span>{{ l.label }}</span>
      </div>

      <!-- Loading State -->
      <div *ngIf="state.isCalendarLoading()" class="cal-loading">
        <div class="spinner"></div>
        <span>Loading calendar...</span>
      </div>

      <!-- Grid -->
      <div *ngIf="!state.isCalendarLoading()" class="cal-grid-wrapper">
        <div *ngIf="state.calendarData().length === 0" class="cal-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <p>No doctors available for the selected date. Try changing the date or filters.</p>
        </div>

        <div *ngFor="let row of state.calendarData()" class="doctor-row">
          <div class="doctor-info">
            <div class="doc-avatar">{{ row.doctorName[0] }}</div>
            <div class="doc-details">
              <div class="doc-name">{{ row.doctorName }}</div>
              <div class="doc-dept">{{ row.specialization }} · {{ row.department }}</div>
            </div>
            <span class="avail-badge" [class.unavail]="!row.isAvailableToday">
              {{ row.isAvailableToday ? 'Available' : 'Off Today' }}
            </span>
          </div>

          <div *ngIf="!row.isAvailableToday" class="slots-row">
            <span class="off-day-msg">Doctor not available today</span>
          </div>

          <div *ngIf="row.isAvailableToday" class="slots-row">
            <!-- Morning label -->
            <span class="session-label">AM</span>
            <ng-container *ngFor="let slot of row.slots">
              <span class="session-label eve-label" *ngIf="slot.session === 'Evening' && isFirstEvening(slot, row.slots)">PM</span>
              <button
                class="slot-box"
                [class]="'status-' + slot.status.toLowerCase()"
                (click)="onSlotClick(slot, row, $event)"
                [title]="getSlotTitle(slot)"
                [attr.data-token]="slot.tokenNumber ? slot.tokenNumber.slice(-3) : ''">
                <span class="slot-time">{{ slot.displayTime }}</span>
                <span class="slot-status-dot" *ngIf="slot.status !== 'Available'">
                  {{ slot.status === 'Booked' ? '🔴' :
                     slot.status === 'WalkIn' ? '🩷' :
                     slot.status === 'CheckedIn' ? '🔵' :
                     slot.status === 'WithDoctor' ? '🟣' :
                     slot.status === 'Completed' ? '🟡' :
                     slot.status === 'NoShow' ? '⬛' : '' }}
                </span>
                <span class="slot-token" *ngIf="slot.tokenNumber">{{ slot.tokenNumber.slice(-3) }}</span>
              </button>
            </ng-container>
          </div>
        </div>
      </div>
    </div>

    <!-- Slot Popup -->
    <div *ngIf="popup()" class="slot-popup" [style.top.px]="popupY" [style.left.px]="popupX" (click)="$event.stopPropagation()">
      <div class="popup-header">
        <span class="popup-status-badge" [class]="'pop-' + popup()!.slot.status.toLowerCase()">{{ popup()!.slot.status }}</span>
        <button class="popup-close" (click)="closePopup()">✕</button>
      </div>
      <div class="popup-body">
        <div class="popup-row" *ngIf="popup()!.slot.tokenNumber"><strong>Token:</strong> {{ popup()!.slot.tokenNumber }}</div>
        <div class="popup-row" *ngIf="popup()!.slot.patientName"><strong>Patient:</strong> {{ popup()!.slot.patientName }}</div>
        <div class="popup-row"><strong>Time:</strong> {{ popup()!.slot.displayTime }}</div>
        <div class="popup-row"><strong>Doctor:</strong> {{ popup()!.doctorName }}</div>
        <div class="popup-row" *ngIf="popup()!.slot.visitType"><strong>Visit:</strong> {{ popup()!.slot.visitType }}</div>
      </div>
      <div class="popup-actions" *ngIf="popup()!.slot.appointmentId">
        <button class="pop-btn checkin" *ngIf="popup()!.slot.status === 'Booked' || popup()!.slot.status === 'WalkIn'"
          (click)="changeStatus(popup()!.slot.appointmentId!, 'CheckedIn')">Check In</button>
        <button class="pop-btn with-doc" *ngIf="popup()!.slot.status === 'CheckedIn'"
          (click)="changeStatus(popup()!.slot.appointmentId!, 'WithDoctor')">With Doctor</button>
        <button class="pop-btn complete" *ngIf="popup()!.slot.status === 'WithDoctor'"
          (click)="changeStatus(popup()!.slot.appointmentId!, 'Completed')">Complete</button>
        <button class="pop-btn cancel" *ngIf="popup()!.slot.status !== 'Completed' && popup()!.slot.status !== 'Cancelled'"
          (click)="changeStatus(popup()!.slot.appointmentId!, 'Cancelled')">Cancel</button>
      </div>
      <div class="popup-actions" *ngIf="!popup()!.slot.appointmentId && popup()!.slot.status === 'Available'">
        <button class="pop-btn checkin" (click)="openBookModal(popup()!.slot, popup()!.doctorProfileId)">Book Slot</button>
      </div>
    </div>

    <!-- Global click to close popup -->
    <div *ngIf="popup()" class="popup-backdrop" (click)="closePopup()"></div>

    <!-- Quick Book Modal -->
    <div *ngIf="showBookModal()" class="modal-backdrop">
      <div class="modal">
        <div class="modal-header">
          <h2>Quick Book — {{ bookDoctor.name }}</h2>
          <p>{{ bookSlot.displayTime }} · {{ formattedDate() }}</p>
          <button class="close-btn" (click)="closeBookModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="book-tabs">
            <button [class.active]="bookMode === 'existing'" (click)="bookMode = 'existing'">Existing Patient</button>
            <button [class.active]="bookMode === 'walkin'" (click)="bookMode = 'walkin'">Walk-in / New</button>
          </div>
          <div *ngIf="bookMode === 'existing'" class="book-section">
            <div class="input-group">
              <label>Search Patient (Name or Phone)</label>
              <input [ngModel]="patientSearch" (ngModelChange)="patientSearch=$event; searchPatients()" placeholder="Type to search..." class="form-input">
            </div>
            <div class="patient-results" *ngIf="patientResults().length > 0">
              <div class="patient-result" *ngFor="let p of patientResults()" (click)="selectPatient(p)">
                <strong>{{ p.fullName }}</strong> · {{ p.phoneNumber || p.phone || 'No Phone' }}
              </div>
            </div>
            <div class="selected-patient" *ngIf="selectedPatient()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="green" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <strong>{{ selectedPatient()!.fullName }}</strong> selected
            </div>
          </div>
          <div *ngIf="bookMode === 'walkin'" class="book-section">
            <div class="form-grid">
              <div class="input-group"><label>Full Name *</label><input [(ngModel)]="walkInData.fullName" class="form-input" placeholder="Patient full name"></div>
              <div class="input-group"><label>Phone *</label><input [(ngModel)]="walkInData.phone" class="form-input" placeholder="10-digit phone"></div>
              <div class="input-group"><label>Age</label><input [(ngModel)]="walkInData.age" type="number" class="form-input" placeholder="Age"></div>
              <div class="input-group"><label>Gender</label>
                <select [(ngModel)]="walkInData.gender" class="form-input">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
          <div class="input-group" style="margin-top:12px;">
            <label>Symptoms / Notes</label>
            <textarea [(ngModel)]="bookSymptoms" class="form-input" rows="2" placeholder="Brief symptoms..."></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button class="secondary-btn" (click)="closeBookModal()">Cancel</button>
          <button class="primary-btn" (click)="submitBooking()" [disabled]="isSubmitting()">
            {{ isSubmitting() ? 'Booking...' : 'Confirm Booking' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    :host { display:block; font-family:'Inter',sans-serif; }
    * { box-sizing:border-box; margin:0; padding:0; }

    /* Wrapper */
    .cal-wrapper { background:#f8fafc; border-radius:16px; padding:20px; border:1px solid #e2e8f0; }

    /* Header */
    .cal-header { display:flex; align-items:center; gap:16px; flex-wrap:wrap; margin-bottom:14px; background:#fff; border-radius:12px; padding:14px 20px; box-shadow:0 1px 8px rgba(0,0,0,0.05); }
    .cal-title { display:flex; align-items:center; gap:8px; font-size:16px; font-weight:700; color:#0a2744; flex:1; }
    .cal-title svg { color:#0f4c81; }
    .cal-date-nav { display:flex; align-items:center; gap:8px; }
    .nav-btn { width:32px; height:32px; border:1.5px solid #e2e8f0; border-radius:8px; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#475569; transition:all 0.2s; }
    .nav-btn:hover { background:#0f4c81; color:#fff; border-color:#0f4c81; }
    .cal-date-label { font-size:14px; font-weight:600; color:#1e293b; min-width:160px; text-align:center; }
    .today-btn { padding:6px 14px; border:1.5px solid #0f4c81; border-radius:8px; background:#fff; color:#0f4c81; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; }
    .today-btn:hover { background:#0f4c81; color:#fff; }
    .cal-filters { display:flex; align-items:center; gap:8px; }
    .cal-select { padding:7px 12px; border:1.5px solid #e2e8f0; border-radius:8px; font-size:13px; color:#334155; background:#fff; cursor:pointer; outline:none; }
    .cal-select:focus { border-color:#0f4c81; }
    .refresh-btn { width:32px; height:32px; border:1.5px solid #e2e8f0; border-radius:8px; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#475569; transition:all 0.2s; }
    .refresh-btn:hover { background:#0f4c81; color:#fff; border-color:#0f4c81; }

    /* Legend */
    .legend { display:flex; gap:14px; flex-wrap:wrap; margin-bottom:14px; padding:0 4px; }
    .leg { display:flex; align-items:center; gap:5px; font-size:12px; color:#64748b; font-weight:500; }
    .leg-dot { width:10px; height:10px; border-radius:3px; display:inline-block; }

    /* Loading */
    .cal-loading { display:flex; align-items:center; justify-content:center; gap:12px; padding:60px; color:#64748b; }
    .spinner { width:24px; height:24px; border:3px solid #e2e8f0; border-top-color:#0f4c81; border-radius:50%; animation:spin 0.8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* Empty */
    .cal-empty { display:flex; flex-direction:column; align-items:center; gap:12px; padding:60px; color:#94a3b8; text-align:center; }
    .cal-empty p { font-size:14px; max-width:300px; }

    /* Grid */
    .cal-grid-wrapper { display:flex; flex-direction:column; gap:1px; background:#e2e8f0; border-radius:14px; overflow:hidden; }
    .doctor-row { display:flex; background:#fff; min-height:56px; }
    .doctor-row:hover { background:#fafbff; }
    .doctor-info { display:flex; align-items:center; gap:10px; padding:10px 16px; min-width:240px; max-width:240px; border-right:2px solid #f1f5f9; }
    .doc-avatar { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#0f4c81,#0d9488); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; flex-shrink:0; }
    .doc-name { font-size:13px; font-weight:600; color:#0a2744; line-height:1.3; }
    .doc-dept { font-size:11px; color:#94a3b8; margin-top:1px; }
    .avail-badge { margin-left:auto; font-size:10px; font-weight:600; padding:3px 8px; border-radius:20px; background:#ecfdf5; color:#059669; border:1px solid #a7f3d0; white-space:nowrap; }
    .avail-badge.unavail { background:#fef2f2; color:#dc2626; border-color:#fecaca; }

    /* Slots */
    .slots-row { display:flex; align-items:center; gap:4px; padding:8px 14px; flex-wrap:wrap; flex:1; overflow-x:auto; }
    .off-day-msg { font-size:12px; color:#94a3b8; font-style:italic; padding:4px; }
    .session-label { font-size:10px; font-weight:700; color:#94a3b8; padding:2px 5px; background:#f1f5f9; border-radius:4px; text-transform:uppercase; letter-spacing:0.5px; flex-shrink:0; }
    .eve-label { color:#7c3aed; background:#f5f3ff; }

    /* Slot box */
    .slot-box { position:relative; min-width:70px; height:44px; border-radius:8px; border:none; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:10px; font-weight:600; transition:all 0.2s ease; flex-shrink:0; gap:1px; }
    .slot-box:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,0.12); }
    .slot-time { font-size:10px; font-weight:500; }
    .slot-status-dot { font-size:8px; }
    .slot-token { font-size:9px; opacity:0.8; }
    
    /* Status colors */
    .status-available { background:#dcfce7; color:#166534; border:1px solid #bbf7d0; }
    .status-available:hover { background:#16a34a; color:#fff; }
    .status-booked { background:#fee2e2; color:#991b1b; border:1px solid #fecaca; }
    .status-walkin { background:#fce7f3; color:#9d174d; border:1px solid #fbcfe8; }
    .status-checkedin { background:#dbeafe; color:#1e40af; border:1px solid #bfdbfe; }
    .status-withdoctor { background:#ede9fe; color:#5b21b6; border:1px solid #ddd6fe; }
    .status-completed { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }
    .status-noshow { background:#1e293b; color:#f1f5f9; border:1px solid #334155; }
    .status-unavailable { background:#f1f5f9; color:#94a3b8; border:1px dashed #e2e8f0; cursor:not-allowed; }

    /* Slot Popup */
    .popup-backdrop { position:fixed; inset:0; z-index:999; }
    .slot-popup { position:fixed; z-index:1000; background:#fff; border-radius:14px; box-shadow:0 8px 40px rgba(0,0,0,0.15); padding:16px; min-width:200px; max-width:260px; border:1px solid #e2e8f0; animation:fadeInUp 0.15s ease; }
    @keyframes fadeInUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
    .popup-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
    .popup-status-badge { font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; text-transform:capitalize; }
    .pop-booked { background:#fee2e2; color:#991b1b; }
    .pop-checkedin { background:#dbeafe; color:#1e40af; }
    .pop-withdoctor { background:#ede9fe; color:#5b21b6; }
    .pop-completed { background:#f0fdf4; color:#15803d; }
    .pop-available { background:#dcfce7; color:#166534; }
    .pop-walkin { background:#fce7f3; color:#9d174d; }
    .pop-noshow { background:#e2e8f0; color:#475569; }
    .popup-close { background:none; border:none; cursor:pointer; font-size:14px; color:#64748b; padding:2px 6px; border-radius:6px; }
    .popup-close:hover { background:#f1f5f9; }
    .popup-body { display:flex; flex-direction:column; gap:6px; margin-bottom:12px; }
    .popup-row { font-size:12px; color:#475569; }
    .popup-row strong { color:#1e293b; }
    .popup-actions { display:flex; flex-wrap:wrap; gap:6px; }
    .pop-btn { padding:6px 12px; border:none; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; }
    .checkin { background:#dbeafe; color:#1e40af; }
    .checkin:hover { background:#1e40af; color:#fff; }
    .with-doc { background:#ede9fe; color:#5b21b6; }
    .with-doc:hover { background:#5b21b6; color:#fff; }
    .complete { background:#f0fdf4; color:#15803d; }
    .complete:hover { background:#16a34a; color:#fff; }
    .cancel { background:#fef2f2; color:#dc2626; }
    .cancel:hover { background:#dc2626; color:#fff; }

    /* Quick Book Modal */
    .modal-backdrop { position:fixed; inset:0; background:rgba(10,20,40,0.5); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:2000; }
    .modal { background:#fff; border-radius:18px; width:90%; max-width:520px; box-shadow:0 20px 60px rgba(0,0,0,0.2); animation:slideUp 0.25s ease; overflow:hidden; }
    @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
    .modal-header { padding:20px 24px 16px; background:linear-gradient(135deg,#0f4c81,#1a6fb5); color:#fff; position:relative; }
    .modal-header h2 { font-size:17px; font-weight:700; margin-bottom:4px; }
    .modal-header p { font-size:13px; opacity:0.8; }
    .close-btn { position:absolute; top:16px; right:16px; background:rgba(255,255,255,0.2); border:none; color:#fff; width:28px; height:28px; border-radius:50%; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; }
    .modal-body { padding:20px 24px; max-height:55vh; overflow-y:auto; }
    .book-tabs { display:flex; gap:0; margin-bottom:16px; background:#f1f5f9; border-radius:10px; padding:4px; }
    .book-tabs button { flex:1; padding:8px; border:none; border-radius:8px; background:transparent; font-size:13px; font-weight:500; color:#64748b; cursor:pointer; transition:all 0.2s; }
    .book-tabs button.active { background:#fff; color:#0f4c81; font-weight:700; box-shadow:0 1px 4px rgba(0,0,0,0.1); }
    .book-section { display:flex; flex-direction:column; gap:12px; }
    .input-group { display:flex; flex-direction:column; gap:5px; }
    .input-group label { font-size:12px; font-weight:600; color:#475569; }
    .form-input { padding:10px 12px; border:1.5px solid #e2e8f0; border-radius:8px; font-size:13px; color:#1e293b; background:#fff; outline:none; width:100%; font-family:'Inter',sans-serif; }
    .form-input:focus { border-color:#0f4c81; box-shadow:0 0 0 3px rgba(15,76,129,0.1); }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .patient-results { border:1px solid #e2e8f0; border-radius:8px; max-height:120px; overflow-y:auto; }
    .patient-result { padding:8px 12px; font-size:13px; cursor:pointer; border-bottom:1px solid #f5f7fa; transition:background 0.15s; }
    .patient-result:hover { background:#f0f7ff; color:#0f4c81; }
    .selected-patient { display:flex; align-items:center; gap:6px; font-size:13px; color:#047857; background:#ecfdf5; padding:8px 12px; border-radius:8px; }
    .modal-actions { padding:16px 24px; border-top:1px solid #f1f5f9; display:flex; justify-content:flex-end; gap:10px; background:#f8fafc; }
    .primary-btn { background:linear-gradient(135deg,#0f4c81,#1a6fb5); color:#fff; padding:10px 24px; border:none; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s; }
    .primary-btn:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(15,76,129,0.3); }
    .primary-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
    .secondary-btn { background:#f1f5f9; color:#475569; padding:10px 20px; border:1.5px solid #e2e8f0; border-radius:10px; font-size:14px; cursor:pointer; font-weight:600; }
    .secondary-btn:hover { background:#e2e8f0; }
  `]
})
export class AppointmentCalendarComponent implements OnInit, OnDestroy {
  private readonly config = inject(ConfigService);
  private readonly BASE_URL = this.config.baseApiUrl;
  
  @Input() mode: 'receptionist' | 'doctor' = 'receptionist';
  @Input() restrictDoctorId?: number;
  @Output() bookingCreated = new EventEmitter<void>();
  @Output() patientSelected = new EventEmitter<any>();

  currentDate = signal(new Date());
  departments = signal<Department[]>([]);
  doctors = signal<Doctor[]>([]);

  filterDeptId: number = 0;
  filterDoctorId: number = 0;

  popup = signal<SlotPopup | null>(null);
  popupX = 0;
  popupY = 0;

  showBookModal = signal(false);
  bookMode: 'existing' | 'walkin' = 'existing';
  bookSlot: any = {};
  bookDoctor: any = {};
  bookSymptoms = '';
  patientSearch = '';
  patientResults = signal<any[]>([]);
  selectedPatient = signal<any>(null);
  walkInData = { fullName: '', phone: '', age: 30, gender: 'Male' };
  isSubmitting = signal(false);

  private refreshTimer: any;

  legend = [
    { label: 'Available', color: '#16a34a' },
    { label: 'Booked', color: '#dc2626' },
    { label: 'Walk-in', color: '#db2777' },
    { label: 'Checked In', color: '#1e40af' },
    { label: 'With Doctor', color: '#7c3aed' },
    { label: 'Completed', color: '#15803d' },
    { label: 'No Show', color: '#1e293b' }
  ];

  formattedDate = computed(() => {
    return this.currentDate().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  });

  constructor(
    public state: AppointmentStateService,
    private http: HttpClient,
    private auth: AuthService,
    private notify: NotificationService
  ) { }

  ngOnInit() {
    this.loadFilters();
    this.refresh();
    // Auto-refresh calendar every 30 seconds
    this.refreshTimer = setInterval(() => this.refresh(), 30000);
  }

  ngOnDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  private getHeaders() {
    return { Authorization: `Bearer ${this.auth.getAccessToken()}` };
  }

  private getDateStr(): string {
    return this.currentDate().toISOString().split('T')[0];
  }

  loadFilters() {
    this.http.get<any>(`${this.BASE_URL}/api/departments`, { headers: this.getHeaders() }).subscribe(res => {
      if (res.success) this.departments.set(res.data);
    });
    this.http.get<any>(`${this.BASE_URL}/api/doctors`, { headers: this.getHeaders() }).subscribe(res => {
      if (res.success) this.doctors.set(res.data);
    });
  }

  refresh() {
    const date = this.getDateStr();
    const deptId = this.filterDeptId || undefined;
    const docId = this.restrictDoctorId || (this.filterDoctorId || undefined);
    this.state.loadCalendar(this.getHeaders(), date, deptId, docId);
  }

  applyFilter() { this.refresh(); }

  changeDate(delta: number) {
    const d = new Date(this.currentDate());
    d.setDate(d.getDate() + delta);
    this.currentDate.set(d);
    this.refresh();
  }

  goToday() {
    this.currentDate.set(new Date());
    this.refresh();
  }

  isFirstEvening(slot: CalendarSlot, slots: CalendarSlot[]): boolean {
    const first = slots.find(s => s.session === 'Evening');
    return first === slot;
  }

  getSlotTitle(slot: CalendarSlot): string {
    if (slot.status === 'Available') return 'Click to book';
    if (slot.patientName) return `${slot.status}: ${slot.patientName} (${slot.displayTime})`;
    return slot.status;
  }

  onSlotClick(slot: CalendarSlot, row: CalendarDoctor, event: MouseEvent) {
    event.stopPropagation();
    if (slot.status === 'Unavailable') return;

    if (slot.status === 'Available' && this.mode === 'receptionist') {
      this.openBookModal(slot, row.doctorProfileId);
      this.bookDoctor = { name: row.doctorName, id: row.doctorProfileId };
      this.closePopup();
      return;
    }

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.popupX = Math.min(rect.right + 8, window.innerWidth - 280);
    this.popupY = rect.top;
    this.popup.set({ slot, doctorProfileId: row.doctorProfileId, doctorName: row.doctorName, x: this.popupX, y: this.popupY });

    if (this.mode === 'doctor' && slot.appointmentId) {
      this.patientSelected.emit({ 
        appointmentId: slot.appointmentId, 
        patientName: slot.patientName,
        patientUserId: slot.patientUserId,
        isVideoConsultation: slot.isVideoConsultation
      });
    }
  }

  closePopup() { this.popup.set(null); }

  changeStatus(appointmentId: number, status: string) {
    this.state.updateStatus(appointmentId, status as any, this.getHeaders());
    this.closePopup();
  }

  openBookModal(slot: CalendarSlot, doctorId: number) {
    this.bookSlot = slot;
    this.bookDoctor = this.doctors().find(d => d.id === doctorId) || { id: doctorId, name: 'Doctor' };
    this.showBookModal.set(true);
    this.bookMode = 'existing';
    this.bookSymptoms = '';
    this.patientSearch = '';
    this.patientResults.set([]);
    this.selectedPatient.set(null);
    this.walkInData = { fullName: '', phone: '', age: 30, gender: 'Male' };
  }

  closeBookModal() { this.showBookModal.set(false); }

  searchPatients() {
    if (this.patientSearch.length < 2) { this.patientResults.set([]); return; }
    this.http.get<any>(`${this.BASE_URL}/api/users/search?q=${encodeURIComponent(this.patientSearch)}`, { headers: this.getHeaders() }).subscribe(res => {
      if (res.success) this.patientResults.set(res.data);
    });
  }

  selectPatient(p: any) {
    this.selectedPatient.set(p);
    this.patientResults.set([]);
    this.patientSearch = p.fullName;
  }

  submitBooking() {
    const headers = this.getHeaders();
    const date = this.getDateStr();

    if (this.bookMode === 'existing') {
      if (!this.selectedPatient()) { this.notify.error('Please select a patient first.'); return; }
      this.isSubmitting.set(true);
      const payload = {
        patientUserId: this.selectedPatient()!.id,
        doctorProfileId: this.bookDoctor.id,
        departmentId: this.bookDoctor.departmentId,
        appointmentDate: this.getDateStr(),
        timeSlot: this.bookSlot.time,
        symptoms: this.bookSymptoms,
        visitType: 'Consultation'
      };
      this.http.post<any>(`${this.BASE_URL}/api/appointments`, payload, { headers: this.getHeaders() }).subscribe(res => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.notify.success(`Appointment booked! Token: ${res.data.tokenNumber}`);
          this.closeBookModal();
          this.refresh();
          this.bookingCreated.emit();
        }
      });
    } else { // bookMode === 'walkin'
      if (!this.walkInData.fullName || !this.walkInData.phone) {
        this.notify.error('Please fill full name and phone number.');
        return;
      }
      this.isSubmitting.set(true);
      // Walk-in: use direct appointment creation endpoint
      const walkInPayload = {
        patientName: this.walkInData.fullName,
        patientPhone: this.walkInData.phone,
        patientAge: this.walkInData.age,
        patientGender: this.walkInData.gender,
        doctorProfileId: this.bookDoctor.id,
        departmentId: this.bookDoctor.departmentId,
        appointmentDate: date,
        timeSlot: this.bookSlot.time,
        symptoms: this.bookSymptoms,
        visitType: 'Walk-in',
        isWalkIn: true
      };
      this.http.post<any>(`${this.BASE_URL}/api/appointments`, walkInPayload, { headers }).subscribe(res => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.notify.success(`Walk-in booked! Token: ${res.data.tokenNumber}`);
          this.closeBookModal();
          this.refresh();
          this.bookingCreated.emit();
        } else {
          this.notify.error(res.message || 'Walk-in booking failed. Please try again.');
        }
      }, err => {
        this.isSubmitting.set(false);
        this.notify.error('Walk-in booking failed. Please check the backend is running and try again.');
      });
    }
  }
}
