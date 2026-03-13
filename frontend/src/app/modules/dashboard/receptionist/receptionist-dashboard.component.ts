import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule, NgSwitch, NgSwitchCase } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentCalendarComponent } from './appointment-calendar.component';
import { AppointmentStateService } from '../../../core/services/appointment-state.service';
import { NotificationService } from '../../../core/services/notification.service';

interface AppointmentRequest {
  id: number;
  patientName: string;
  phone: string;
  email: string;
  age: number;
  gender: string;
  symptoms: string;
  department: string;
  createdAt: string;
  status: 'Pending' | 'Contacted' | 'Rejected' | 'Converted';
}

interface IDoctor {
  id: number;
  Id?: number; // Handle PascalCase from backend
  fullName: string;
  specialization: string;
  departmentId: number;
  DepartmentId?: number; // Handle PascalCase from backend
  consultationFee: number;
}
interface Department { 
  id?: number; 
  Id?: number; 
  name?: string; 
  Name?: string; 
}
import { ConfigService } from '../../../core/services/config.service';

// const this.BASE_URL = 'https://localhost:7113';

@Component({
  selector: 'app-receptionist-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSwitch, NgSwitchCase, AppointmentCalendarComponent],
  template: `
    <div class="recep-dash">
      <!-- Header -->
      <div class="header">
        <div class="header-left">
          <div class="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"/><path d="M12 9v4"/><path d="M10 11h4"/>
            </svg>
          </div>
          <div>
            <h1>Receptionist Dashboard</h1>
            <p>Manage appointments, queue, and walk-in registrations in real-time.</p>
          </div>
        </div>
        <div class="header-stats">
          <div class="test-creds">
            <div class="creds-label">Test Creds (pass: 123456)</div>
            <div class="creds-grid">
              <span>Recep: recep@test.com</span>
              <span>Doc: doc@test.com</span>
              <span>Lab: lab@test.com</span>
              <span>Phar: phar@test.com</span>
            </div>
          </div>
          <div class="stat-chip">
            <div class="stat-val">{{ pendingRequestsCount() }}</div>
            <div class="stat-lbl">Pending Requests</div>
          </div>
          <div class="stat-chip">
            <div class="stat-val">{{ state.totalToday() }}</div>
            <div class="stat-lbl">Today's OPD</div>
          </div>
          <div class="stat-chip blue">
            <div class="stat-val">{{ state.checkedInCount() }}</div>
            <div class="stat-lbl">Checked In</div>
          </div>
          <div class="stat-chip purple">
            <div class="stat-val">{{ state.withDoctorCount() }}</div>
            <div class="stat-lbl">With Doctor</div>
          </div>
          <div class="stat-chip green">
            <div class="stat-val">{{ state.completedCount() }}</div>
            <div class="stat-lbl">Completed</div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tab-nav">
        <button *ngFor="let t of tabs" (click)="activeTab.set(t)" [class.active]="activeTab()===t" class="tab-btn">
          {{ t }}
          <span class="tab-badge" *ngIf="t === 'Requests' && pendingRequestsCount() > 0">{{ pendingRequestsCount() }}</span>
          <span class="tab-badge" *ngIf="t === 'Cash Payments' && pendingPayments().length > 0">{{ pendingPayments().length }}</span>
        </button>
      </div>

      <ng-container [ngSwitch]="activeTab()">
        <!-- CALENDAR TAB – Single Source of Truth -->
        <section *ngSwitchCase="'Calendar'">
          <app-appointment-calendar mode="receptionist" (bookingCreated)="onBookingCreated()"></app-appointment-calendar>
        </section>

        <!-- OPD QUEUE TAB -->
        <section *ngSwitchCase="'OPD Queue'" class="tab-section">
          <div class="summary-bar">
            <div class="summary-chip total"><span>{{ state.totalToday() }}</span>Total</div>
            <div class="summary-chip checkedin"><span>{{ state.checkedInCount() }}</span>Checked In</div>
            <div class="summary-chip withdoc"><span>{{ state.withDoctorCount() }}</span>With Doctor</div>
            <div class="summary-chip done"><span>{{ state.completedCount() }}</span>Completed</div>
            <div class="summary-chip wait"><span>{{ getEstimatedWait() }}m</span>Est. Wait</div>
            <div style="flex:1"></div>
            <button class="call-next-btn" (click)="callNextPatient()" [disabled]="state.checkedInCount() === 0">
              📣 Call Next Patient
            </button>
            <button class="export-btn" (click)="exportToCSV()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export CSV
            </button>
          </div>
          <div *ngIf="state.isLoading()" class="skeleton-list">
            <div class="sk-row" *ngFor="let i of [1,2,3]"></div>
          </div>
          <div *ngIf="!state.isLoading() && state.todayAppointments().length === 0" class="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M9 12h6m-6 4h6"/></svg>
            <p>No appointments scheduled for today.</p>
          </div>
          <table *ngIf="!state.isLoading() && state.todayAppointments().length > 0" class="opd-table">
            <thead>
              <tr><th>#</th><th>Token</th><th>Patient</th><th>Phone</th><th>Doctor</th><th>Dept</th><th>Time</th><th>Type</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let ap of state.todayAppointments(); let i = index" 
                  [class]="'row-' + ap.status.toLowerCase()"
                  [class.is-called]="calledPatientId() === ap.id">
                <td class="muted">{{ i+1 }}</td>
                <td><span class="token-badge">{{ ap.tokenNumber }}</span></td>
                <td><strong>{{ ap.patient.fullName }}</strong></td>
                <td class="muted">{{ ap.patient.phoneNumber }}</td>
                <td>{{ ap.doctor.fullName }}</td>
                <td class="muted">{{ ap.department.name }}</td>
                <td>{{ formatTime(ap.timeSlot) }}</td>
                <td><span class="visit-badge" [class]="ap.visitType === 'Walk-in' ? 'walkin' : 'consult'">{{ ap.visitType }}</span></td>
                <td><span class="status-badge" [class]="ap.status.toLowerCase()">{{ ap.status }}</span></td>
                <td class="actions-cell">
                  <button class="act-btn checkin" (click)="changeStatus(ap.id, 'CheckedIn')" *ngIf="ap.status === 'Scheduled'">Check In</button>
                  <button class="act-btn withdoc" (click)="changeStatus(ap.id, 'WithDoctor')" *ngIf="ap.status === 'CheckedIn'">With Doctor</button>
                  <button class="act-btn complete" (click)="changeStatus(ap.id, 'Completed')" *ngIf="ap.status === 'WithDoctor'">Complete</button>
                  <button class="act-btn noshow" (click)="changeStatus(ap.id, 'NoShow')" *ngIf="ap.status === 'Scheduled' || ap.status === 'CheckedIn'">No Show</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- CASH PAYMENTS TAB -->
        <section *ngSwitchCase="'Cash Payments'" class="tab-section">
          <div class="filter-bar">
             <div class="section-title">Pending Cash Collections</div>
             <button class="refresh-icon-btn" (click)="loadPendingPayments()" title="Refresh">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>
          </div>
          <div *ngIf="isLoadingPayments()" class="skeleton-list">
            <div class="sk-row" *ngFor="let i of [1,2,3]"></div>
          </div>
          <div *ngIf="!isLoadingPayments() && pendingPayments().length === 0" class="empty-state">
            <p>No pending cash payments at the moment.</p>
          </div>
          <div class="cards-grid" *ngIf="!isLoadingPayments()">
            <div class="request-card" *ngFor="let p of pendingPayments()">
              <div class="card-head">
                <div>
                  <strong class="card-name">{{ p.patientName }}</strong>
                  <span class="card-meta">{{ p.tokenNumber }}</span>
                </div>
                <span class="status-badge pending">CASH PENDING</span>
              </div>
              <div class="card-info">
                <div class="info-row"><label>Amount to Collect</label><span style="font-size:18px; font-weight:800; color:#10b981;">₹{{ p.consultationFee }}</span></div>
                <div class="info-row"><label>Doctor</label><span>Dr. {{ p.doctorName }}</span></div>
                <div class="info-row"><label>Department</label><span>{{ p.departmentName }}</span></div>
                <div class="info-row"><label>Appt Date</label><span>{{ p.appointmentDate | date:'dd MMM' }} | {{ formatTime(p.timeSlot) }}</span></div>
              </div>
              <div class="card-actions">
                <button class="primary-btn" style="width:100%;" (click)="confirmCashPayment(p)">
                  ✅ Confirm Cash Received
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- REQUESTS TAB -->
        <section *ngSwitchCase="'Requests'" class="tab-section">
          <div class="filter-bar">
            <button *ngFor="let f of requestFilters" (click)="requestFilter.set(f)" [class.active]="requestFilter()===f" class="filter-btn">{{ f }}</button>
            <button class="refresh-icon-btn" (click)="loadRequests()" title="Refresh">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </button>
          </div>
          <div *ngIf="isLoadingRequests()" class="skeleton-list">
            <div class="sk-row" *ngFor="let i of [1,2,3]"></div>
          </div>
          <div *ngIf="!isLoadingRequests() && filteredRequests().length === 0" class="empty-state">
            <p>No requests found.</p>
          </div>
          <div class="cards-grid" *ngIf="!isLoadingRequests()">
            <div class="request-card" *ngFor="let req of filteredRequests()">
              <div class="card-head">
                <div>
                  <strong class="card-name">{{ req.patientName }}</strong>
                  <span class="card-meta">{{ req.age }} / {{ req.gender }}</span>
                </div>
                <span class="status-badge" [class]="req.status.toLowerCase()">{{ req.status }}</span>
              </div>
              <div class="card-info">
                <div class="info-row"><label>Phone</label><span>{{ req.phone || '—' }}</span></div>
                <div class="info-row"><label>Email</label><span>{{ req.email || '—' }}</span></div>
                <div class="info-row"><label>Dept</label><span>{{ req.department || '—' }}</span></div>
                <div class="info-row"><label>Symptoms</label><span>{{ req.symptoms }}</span></div>
                <div class="info-row"><label>Submitted</label><span>{{ timeSince(req.createdAt) }}</span></div>
              </div>
              <div class="card-actions">
                <a class="act-icon" [href]="'tel:' + req.phone" title="Call">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </a>
                <button class="act-icon" (click)="markContacted(req)" title="Mark Contacted">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
                <button class="act-icon convert" (click)="openConvertModal(req)" title="Convert to Appointment">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </button>
                <button class="act-icon reject" (click)="rejectRequest(req)" title="Reject">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <button class="act-icon delete" (click)="deleteRequest(req)" title="Delete">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- WALK-IN TAB -->
        <section *ngSwitchCase="'Walk-in'" class="tab-section">
          <div class="walkin-card">
            <div class="walkin-header">
              <h2>Register Walk-in Patient</h2>
              <p>Fill in patient details to instantly book a slot and generate a token.</p>
            </div>
            <form class="walkin-form" (ngSubmit)="submitWalkIn()" #wf="ngForm">
              <div class="form-grid">
                <div class="input-group"><label>Full Name *</label><input name="fullName" ngModel required placeholder="Patient full name"></div>
                <div class="input-group"><label>Phone *</label><input name="phone" ngModel required placeholder="+91 9999999999"></div>
                <div class="input-group"><label>Email</label><input name="email" type="email" ngModel placeholder="optional"></div>
                <div class="input-group"><label>Age *</label><input name="age" type="number" ngModel required placeholder="Age"></div>
                <div class="input-group"><label>Gender *</label>
                  <select name="gender" ngModel required>
                    <option value="" disabled selected>Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div class="input-group"><label>Department *</label>
                  <select name="department" [ngModel]="walkInDeptId()" (ngModelChange)="onWalkInDeptChange($event)" required>
                    <option [value]="0" disabled>Select Department</option>
                    <option *ngFor="let d of departments()" [value]="d.id || d.Id">{{ d.name || d.Name }}</option>
                  </select>
                </div>
                <div class="input-group"><label>Doctor *</label>
                  <select name="doctor" [ngModel]="walkInDocId()" (ngModelChange)="walkInDocId.set($event); loadWalkInSlots()" required>
                    <option [value]="0" disabled>{{ walkInDeptId() ? 'Select Doctor' : 'Select Department first' }}</option>
                    <option *ngFor="let d of walkInFilteredDoctors()" [value]="d.id || d.Id">{{ d.fullName }}</option>
                  </select>
                </div>
                <div class="input-group"><label>Date *</label>
                  <input name="date" type="date" [ngModel]="walkInDate()" (ngModelChange)="walkInDate.set($event); loadWalkInSlots()" required>
                </div>
                <div class="input-group"><label>Time Slot *</label>
                  <select name="slot" ngModel required>
                    <option value="">{{ walkInSlots().length ? 'Select Time Slot' : 'Pick date + doctor first' }}</option>
                    <option *ngFor="let s of walkInSlots()" [value]="s.time" [disabled]="s.isBooked">
                      {{ s.displayTime }}{{ s.isBooked ? ' (Booked)' : '' }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="input-group full" style="margin-top:8px;"><label>Symptoms / Notes</label><textarea name="symptoms" ngModel rows="2" placeholder="Brief symptoms..."></textarea></div>
              
              <div class="payment-opt" style="margin-top:16px; padding:12px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; display:flex; align-items:center; gap:10px;">
                <input type="checkbox" name="payNow" ngModel id="payNow" style="width:18px; height:18px; cursor:pointer;">
                <label for="payNow" style="font-size:14px; font-weight:700; color:#166534; cursor:pointer;">Collect Consultation Fee Now (Offline Cash)</label>
              </div>

              <div class="form-actions" style="margin-top:20px;">
                <button type="submit" class="primary-btn" [disabled]="walkInSubmitting()">
                  {{ walkInSubmitting() ? 'Registering...' : 'Register Walk-in' }}
                </button>
              </div>
            </form>
            <div *ngIf="walkInResult()" class="result-card">
              <h3>Walk-in Registered!</h3>
              <p>Token: <strong>{{ walkInResult().tokenNumber }}</strong></p>
              <p *ngIf="walkInResult().tempPassword">Temp Password: <strong>{{ walkInResult().tempPassword }}</strong></p>
            </div>
          </div>
        </section>
      </ng-container>

      <!-- Convert Modal -->
      <div *ngIf="showConvertModal()" class="modal-backdrop">
        <div class="modal">
          <div class="modal-head">
            <h2>Convert Request to Appointment</h2>
            <p>{{ convertRequest()?.patientName }} — {{ convertRequest()?.symptoms }}</p>
            <button class="close-btn" (click)="closeConvertModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid-2">
              <div class="input-group"><label>Department *</label>
                <select [ngModel]="cvDeptId()" (ngModelChange)="cvDeptId.set($event); cvDoctorId.set(null)" required>
                  <option [ngValue]="null" disabled>Select Department</option>
                  <option *ngFor="let d of departments()" [value]="d.id || d.Id">{{ d.name || d.Name }}</option>
                </select>
              </div>
              <div class="input-group"><label>Doctor *</label>
                <select [ngModel]="cvDoctorId()" (ngModelChange)="cvDoctorId.set($event); loadConvertSlots()" required>
                  <option [ngValue]="null" disabled>{{ cvDeptId() ? 'Select Doctor' : 'Select Department first' }}</option>
                  <option *ngFor="let d of convertFilteredDoctors()" [value]="d.id || d.Id">{{ d.fullName }}</option>
                </select>
              </div>
              <div class="input-group"><label>Date *</label>
                <input type="date" [ngModel]="cvDate()" (ngModelChange)="cvDate.set($event); loadConvertSlots()" required>
              </div>
              <div class="input-group"><label>Time Slot *</label>
                <select [ngModel]="cvSlot()" (ngModelChange)="cvSlot.set($event)" required>
                  <option value="">{{ convertSlots().length ? 'Select Time Slot' : 'Pick date + doctor first' }}</option>
                  <option *ngFor="let s of convertSlots()" [value]="s.time" [disabled]="s.isBooked">
                    {{ s.displayTime }}{{ s.isBooked ? ' (Booked)' : '' }}
                  </option>
                </select>
              </div>
            </div>
            <div class="input-group" style="margin-top:10px;"><label>Notes</label><textarea [(ngModel)]="cvNotes" rows="2" placeholder="Optional notes..."></textarea></div>
          </div>
          <div class="modal-foot">
            <button class="secondary-btn" (click)="closeConvertModal()">Cancel</button>
            <button class="primary-btn" (click)="confirmConvert()" [disabled]="!cvDoctorId || !cvDeptId || !cvDate || !cvSlot">Confirm & Book</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    :host { display:block; }
    * { box-sizing:border-box; margin:0; padding:0; font-family:'Inter',sans-serif; }

    .recep-dash { padding:24px 28px; background:linear-gradient(135deg,#f0f4f8,#e8edf5); min-height:100vh; }

    /* Header */
    .header { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:22px;
      background:linear-gradient(135deg,#0a2744 0%,#0f4c81 50%,#0d9488 100%); border-radius:18px; padding:24px 28px;
      box-shadow:0 8px 30px rgba(10,39,68,0.3); }
    .header-left { display:flex; align-items:center; gap:16px; }
    .header-icon { width:48px; height:48px; background:rgba(255,255,255,0.15); border-radius:12px; display:flex; align-items:center; justify-content:center; color:#fff; }
    .header-icon svg { width:24px; height:24px; }
    .header h1 { font-size:22px; color:#fff; font-weight:800; }
    .header p { font-size:13px; color:rgba(255,255,255,0.7); margin-top:3px; }
    .header-stats { display:flex; gap:10px; flex-wrap:wrap; }
    .stat-chip { background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2); border-radius:12px; padding:10px 16px; text-align:center; min-width:90px; transition:all 0.2s; }
    .stat-chip:hover { background:rgba(255,255,255,0.2); }
    .stat-chip.blue { background:rgba(37,99,235,0.3); border-color:rgba(147,197,253,0.4); }
    .stat-chip.purple { background:rgba(124,58,237,0.3); border-color:rgba(196,181,253,0.4); }
    .stat-chip.green { background:rgba(22,163,74,0.3); border-color:rgba(134,239,172,0.4); }
    
    .test-creds { background:rgba(0,0,0,0.2); padding:8px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.1); }
    .creds-label { font-size:9px; color:rgba(255,255,255,0.6); text-transform:uppercase; font-weight:700; margin-bottom:4px; }
    .creds-grid { display:grid; grid-template-columns:1fr 1fr; gap:2px 10px; font-size:10px; color:#fff; font-family:monospace; }
    .stat-val { font-size:24px; font-weight:800; color:#fff; }
    .stat-lbl { font-size:10px; color:rgba(255,255,255,0.7); text-transform:uppercase; letter-spacing:0.5px; margin-top:2px; }

    /* Tabs */
    .tab-nav { display:flex; gap:5px; margin-bottom:18px; background:#fff; padding:5px; border-radius:12px; width:fit-content; box-shadow:0 2px 10px rgba(0,0,0,0.06); }
    .tab-btn { padding:8px 20px; border:none; border-radius:8px; background:transparent; cursor:pointer; font-size:13px; font-weight:600; color:#64748b; transition:all 0.2s; }
    .tab-btn:hover { background:#f0f7ff; color:#0f4c81; }
    .tab-btn.active { background:linear-gradient(135deg,#0f4c81,#1a6fb5); color:#fff; box-shadow:0 3px 12px rgba(15,76,129,0.25); }

    /* Tab section */
    .tab-section { animation:fadeIn 0.25s ease; }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

    /* Summary bar */
    .summary-bar { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
    .summary-chip { background:#fff; border-radius:12px; padding:12px 16px; display:flex; flex-direction:column; align-items:center; min-width:100px;
      border:2px solid #e2e8f0; box-shadow:0 2px 8px rgba(0,0,0,0.04); }
    .summary-chip span { font-size:22px; font-weight:800; color:#0a2744; }
    .summary-chip { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:0.4px; }
    .summary-chip.checkedin { border-color:#bfdbfe; } .summary-chip.checkedin span { color:#1d4ed8; }
    .summary-chip.withdoc { border-color:#ddd6fe; } .summary-chip.withdoc span { color:#5b21b6; }
    .summary-chip.done { border-color:#bbf7d0; } .summary-chip.done span { color:#15803d; }
    .summary-chip.wait { border-color:#fed7aa; } .summary-chip.wait span { color:#c2410c; }


    /* Skeleton */
    .skeleton-list { display:flex; flex-direction:column; gap:8px; }
    .sk-row { height:56px; border-radius:10px; background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
    @keyframes shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }

    /* Empty */
    .empty-state { display:flex; flex-direction:column; align-items:center; gap:10px; padding:50px; color:#94a3b8; text-align:center; }

    /* OPD Table */
    .opd-table { width:100%; border-collapse:separate; border-spacing:0; background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.05); font-size:13px; }
    .opd-table th { padding:12px 14px; background:linear-gradient(135deg,#f8fafc,#f1f5f9); font-weight:700; color:#475569; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; border-bottom:2px solid #e2e8f0; text-align:left; white-space:nowrap; }
    .opd-table td { padding:11px 14px; border-bottom:1px solid #f5f7fa; color:#334155; }
    .opd-table tr:last-child td { border-bottom:none; }
    .opd-table tbody tr { transition:background 0.15s; }
    .opd-table tbody tr:hover td { background:#f8fbff; }
    .opd-table .muted { color:#94a3b8; }
    .row-checkedin td { background:rgba(219,234,254,0.25); }
    .row-withdoctor td { background:rgba(237,233,254,0.25); }
    .row-completed td { background:rgba(240,253,244,0.25); }
    .token-badge { font-family:monospace; font-size:12px; font-weight:700; background:#f0f7ff; color:#0f4c81; padding:3px 8px; border-radius:6px; }
    .visit-badge { font-size:10px; font-weight:600; padding:2px 8px; border-radius:10px; }
    .visit-badge.walkin { background:#fce7f3; color:#9d174d; }
    .visit-badge.consult { background:#f0f7ff; color:#0f4c81; }
    .actions-cell { display:flex; gap:5px; flex-wrap:wrap; }
    .act-btn { padding:5px 10px; border:none; border-radius:6px; cursor:pointer; font-size:11px; font-weight:600; transition:all 0.2s; white-space:nowrap; }
    .act-btn.checkin { background:#dbeafe; color:#1e40af; } .act-btn.checkin:hover { background:#1e40af; color:#fff; }
    .act-btn.withdoc { background:#ede9fe; color:#5b21b6; } .act-btn.withdoc:hover { background:#5b21b6; color:#fff; }
    .act-btn.complete { background:#fef9c3; color:#854d0e; } .act-btn.complete:hover { background:#d97706; color:#fff; }
    .act-btn.noshow { background:#e2e8f0; color:#475569; } .act-btn.noshow:hover { background:#475569; color:#fff; }

    .call-next-btn { padding:10px 20px; background:#0f4c81; color:#fff; border:none; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(15,76,129,0.2); }
    .call-next-btn:hover:not(:disabled) { background:#1a6fb5; transform:translateY(-1px); }
    .call-next-btn:disabled { opacity:0.5; cursor:not-allowed; }

    .is-called { animation:pulse-row 2s infinite; }
    @keyframes pulse-row {
      0% { background:rgba(15,76,129,0); }
      50% { background:rgba(15,76,129,0.1); }
      100% { background:rgba(15,76,129,0); }
    }

    /* Status badges */
    .status-badge { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.4px; white-space:nowrap; }
    .status-badge.pending { background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; }
    .status-badge.contacted { background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; }
    .status-badge.rejected { background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; }
    .status-badge.converted { background:#eef2ff; color:#3730a3; border:1px solid #c7d2fe; }
    .status-badge.scheduled { background:#f0f9ff; color:#0369a1; border:1px solid #bae6fd; }
    .status-badge.checkedin { background:#dbeafe; color:#1e40af; border:1px solid #bfdbfe; }
    .status-badge.withdoctor { background:#f5f3ff; color:#6d28d9; border:1px solid #ddd6fe; }
    .status-badge.completed { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }
    .status-badge.cancelled { background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; }
    .status-badge.noshow { background:#fefce8; color:#a16207; border:1px solid #fde68a; }

    /* Requests */
    .filter-bar { display:flex; gap:7px; margin-bottom:16px; flex-wrap:wrap; align-items:center; }
    .filter-btn { padding:6px 14px; border:1.5px solid #e2e8f0; border-radius:20px; background:#fff; cursor:pointer; font-size:12px; font-weight:500; color:#64748b; transition:all 0.2s; }
    .filter-btn:hover { border-color:#0f4c81; color:#0f4c81; }
    .filter-btn.active { background:linear-gradient(135deg,#0f4c81,#1a6fb5); color:#fff; border-color:transparent; box-shadow:0 2px 8px rgba(15,76,129,0.2); }
    .refresh-icon-btn { width:30px; height:30px; border:1.5px solid #e2e8f0; border-radius:8px; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#64748b; transition:all 0.2s; }
    .refresh-icon-btn:hover { background:#0f4c81; color:#fff; border-color:#0f4c81; }
    .cards-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; }
    .request-card { background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.05); border:1px solid #eef2f7; transition:all 0.25s; }
    .request-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.09); }
    .card-head { display:flex; justify-content:space-between; align-items:flex-start; padding:14px 16px 10px; border-bottom:1px solid #f5f7fa; }
    .card-name { font-size:14px; font-weight:700; color:#0a2744; display:block; }
    .card-meta { font-size:12px; color:#94a3b8; }
    .card-info { padding:10px 16px; display:grid; grid-template-columns:1fr 1fr; gap:4px 12px; }
    .info-row { display:flex; flex-direction:column; }
    .info-row label { font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.4px; }
    .info-row span { font-size:12px; color:#334155; }
    .card-actions { display:flex; gap:7px; padding:10px 16px 14px; border-top:1px solid #f5f7fa; }
    .act-icon { width:32px; height:32px; border:none; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s; background:#f0f7ff; color:#0f4c81; text-decoration:none; flex-shrink:0; }
    .act-icon:hover { background:#0f4c81; color:#fff; transform:translateY(-1px); }
    .act-icon.convert { background:#f0fdf4; color:#16a34a; }
    .act-icon.convert:hover { background:#16a34a; color:#fff; }
    .act-icon.reject { background:#fff7ed; color:#ea580c; }
    .act-icon.reject:hover { background:#ea580c; color:#fff; }
    .act-icon.delete { background:#fef2f2; color:#dc2626; margin-left:auto; }
    .act-icon.delete:hover { background:#dc2626; color:#fff; }

    /* Walk-in */
    .walkin-card { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 2px 14px rgba(0,0,0,0.05); }
    .walkin-header { padding:20px 28px; border-bottom:1px solid #f1f5f9; background:linear-gradient(180deg,#fff,#f8fafc); }
    .walkin-header h2 { font-size:17px; font-weight:700; color:#0f4c81; margin-bottom:4px; }
    .walkin-header p { font-size:13px; color:#64748b; }
    .walkin-form { padding:24px 28px; }
    .form-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; }
    .input-group { display:flex; flex-direction:column; gap:5px; }
    .input-group.full { grid-column:1/-1; }
    .input-group label { font-size:12px; font-weight:600; color:#334155; }
    .input-group input, .input-group select, .input-group textarea { padding:10px 13px; border:1.5px solid #e2e8f0; border-radius:9px; font-size:13px; color:#1e293b; background:#fafbfc; outline:none; width:100%; font-family:'Inter',sans-serif; transition:all 0.2s; }
    .input-group input:focus, .input-group select:focus, .input-group textarea:focus { border-color:#0f4c81; background:#fff; box-shadow:0 0 0 3px rgba(15,76,129,0.1); }
    .form-actions { margin-top:20px; display:flex; justify-content:flex-end; padding-top:16px; border-top:1px dashed #e2e8f0; }
    .result-card { margin:0 28px 24px; padding:18px; background:linear-gradient(135deg,#ecfdf5,#d1fae5); border:1.5px solid #a7f3d0; border-radius:12px; }
    .result-card h3 { color:#047857; font-size:15px; margin-bottom:8px; }
    .result-card p { color:#065f46; font-size:13px; margin-top:4px; }
    .primary-btn { background:linear-gradient(135deg,#0f4c81,#1a6fb5); color:#fff; padding:11px 24px; border:none; border-radius:10px; cursor:pointer; font-size:14px; font-weight:600; transition:all 0.2s; letter-spacing:-0.2px; }
    .primary-btn:hover { transform:translateY(-1px); box-shadow:0 5px 16px rgba(15,76,129,0.3); }
    .primary-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
    .secondary-btn { background:#f1f5f9; color:#475569; padding:11px 20px; border:1.5px solid #e2e8f0; border-radius:10px; cursor:pointer; font-size:14px; font-weight:600; transition:all 0.2s; }
    .secondary-btn:hover { background:#e2e8f0; }

    /* Convert Modal */
    .modal-backdrop { position:fixed; inset:0; background:rgba(10,20,40,0.5); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .modal { background:#fff; border-radius:18px; width:90%; max-width:560px; box-shadow:0 20px 60px rgba(0,0,0,0.2); overflow:hidden; }
    .modal-head { padding:20px 24px; border-bottom:1px solid #f1f5f9; background:linear-gradient(135deg,#0f4c81,#1a6fb5); color:#fff; position:relative; }
    .modal-head h2 { font-size:17px; font-weight:700; }
    .modal-head p { font-size:12px; opacity:0.8; margin-top:3px; }
    .close-btn { position:absolute; top:14px; right:14px; background:rgba(255,255,255,0.2); border:none; color:#fff; width:28px; height:28px; border-radius:50%; cursor:pointer; font-size:14px; }
    .modal-body { padding:22px 24px; display:flex; flex-direction:column; gap:14px; }
    .form-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .modal-foot { padding:16px 24px; border-top:1px solid #f1f5f9; display:flex; justify-content:flex-end; gap:10px; background:#f8fafc; }

    @media (max-width:768px) {
      .recep-dash { padding:14px 16px; }
      .header { flex-direction:column; align-items:flex-start; }
      .header-stats { width:100%; }
      .cards-grid { grid-template-columns:1fr; }
      .form-grid { grid-template-columns:1fr; }
      .form-grid-2 { grid-template-columns:1fr; }
    }

    .export-btn { margin-left:auto; display:flex; align-items:center; gap:8px; padding:10px 18px; background:#fff; border:2px solid #e2e8f0; border-radius:12px; font-size:13px; font-weight:700; color:#475569; cursor:pointer; transition:all 0.2s; }
    .export-btn:hover { border-color:#0f4c81; color:#0f4c81; background:#f0f7ff; }

    .tab-badge { margin-left:6px; background:#ef4444; color:#fff; font-size:10px; font-weight:800; padding:2px 6px; border-radius:10px; min-width:18px; text-align:center; }
    .section-title { font-size:16px; font-weight:700; color:#0a2744; }
  `]
})
export class ReceptionistDashboardComponent implements OnInit {
  private readonly config = inject(ConfigService);
  private readonly BASE_URL = this.config.baseApiUrl;
  
  tabs = ['Calendar', 'OPD Queue', 'Requests', 'Walk-in', 'Cash Payments'];
  activeTab = signal('OPD Queue');
  refreshInterval: any;
  calledPatientId = signal<number | null>(null);

  // Cash Payments
  pendingPayments = signal<any[]>([]);
  isLoadingPayments = signal(false);


  // Filters for Walk-in and Convert
  walkInFilteredDoctors = computed(() => {
    const deptId = +this.walkInDeptId();
    if (!deptId) return [];
    return this.doctors().filter(d => (d.departmentId || d.DepartmentId || 0) === deptId);
  });

  convertFilteredDoctors = computed(() => {
    const deptId = +this.cvDeptId()!;
    if (!deptId) return [];
    return this.doctors().filter(d => (d.departmentId || d.DepartmentId || 0) === deptId);
  });

  // Requests
  requestFilter = signal('All');
  requestFilters = ['All', 'Pending', 'Contacted', 'Converted', 'Rejected'];
  isLoadingRequests = signal(true);
  appointmentRequests = signal<AppointmentRequest[]>([]);
  filteredRequests = computed(() => {
    const f = this.requestFilter();
    const all = this.appointmentRequests();
    return f === 'All' ? all : all.filter(r => r.status === f);
  });
  pendingRequestsCount = computed(() => this.appointmentRequests().filter(r => r.status === 'Pending').length);

  doctors = signal<IDoctor[]>([]);
  departments = signal<Department[]>([]);

  // Walk-in
  walkInDeptId = signal(0);
  walkInDocId = signal(0);
  walkInDate = signal('');
  walkInSlots = signal<any[]>([]);
  walkInSubmitting = signal(false);
  walkInResult = signal<any>(null);

  // Convert Modal
  showConvertModal = signal(false);
  convertRequest = signal<AppointmentRequest | null>(null);
  cvDoctorId = signal<number | null>(null);
  cvDeptId = signal<number | null>(null);
  cvDate = signal('');
  cvSlot = signal('');
  cvNotes = '';
  convertSlots = signal<any[]>([]);

  constructor(
    public state: AppointmentStateService,
    private http: HttpClient,
    private auth: AuthService,
    private notify: NotificationService
  ) { }

  ngOnInit() {
    this.loadAll();
    // Auto-refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.state.loadToday(this.getHeaders());
      this.loadPendingPayments();
    }, 30000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  private getHeaders() {
    return { Authorization: `Bearer ${this.auth.getAccessToken()}` };
  }

  loadAll() {
    this.state.loadToday(this.getHeaders());
    this.loadRequests();
    this.loadDoctors();
    this.loadDepartments();
    this.loadPendingPayments();
  }

  loadPendingPayments() {
    this.isLoadingPayments.set(true);
    this.http.get<any>(`${this.BASE_URL}/api/appointments/pending-payments`, { headers: this.getHeaders() }).subscribe(res => {
      if (res.success) this.pendingPayments.set(res.data);
      this.isLoadingPayments.set(false);
    });
  }

  confirmCashPayment(p: any) {
    if (!confirm(`Confirm cash receipt of ₹${p.consultationFee} from ${p.patientName}?`)) return;
    
    this.http.patch<any>(`${this.BASE_URL}/api/appointments/${p.id}/payment`, { paymentMode: 'Cash' }, { headers: this.getHeaders() })
      .subscribe(res => {
        if (res.success) {
          this.notify.success(`Payment confirmed for ${p.patientName}. Bill auto-generated.`);
          this.loadPendingPayments();
          this.state.loadToday(this.getHeaders());
        }
      });
  }

  loadRequests() {
    this.isLoadingRequests.set(true);
    this.http.get<any>(`${this.BASE_URL}/api/appointment-requests`, { headers: this.getHeaders() }).subscribe(res => {
      if (res.success) {
        this.appointmentRequests.set(res.data.map((r: any) => ({
          id: r.id,
          patientName: r.fullName,
          phone: r.phone,
          email: r.email,
          age: r.age,
          gender: r.gender,
          symptoms: r.symptoms,
          department: r.preferredDepartment,
          createdAt: r.createdAt,
          status: r.status
        })));
      }
      this.isLoadingRequests.set(false);
    });
  }

  loadDoctors() {
    this.http.get<any>(`${this.BASE_URL}/api/doctors`, { headers: this.getHeaders() }).subscribe(res => {
      if (res.success) this.doctors.set(res.data);
    });
  }

  loadDepartments() {
    this.http.get<any>(`${this.BASE_URL}/api/departments`, { headers: this.getHeaders() }).subscribe(res => {
      if (res.success) this.departments.set(res.data);
    });
  }

  changeStatus(id: number, status: string) {
    this.state.updateStatus(id, status as any, this.getHeaders());
  }

  formatTime(slot: string): string {
    if (!slot) return '—';
    try {
      const [h, m] = slot.split(':').map(Number);
      const d = new Date(); d.setHours(h, m);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return slot; }
  }

  timeSince(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  markContacted(req: AppointmentRequest) {
    this.http.patch<any>(`${this.BASE_URL}/api/appointment-requests/${req.id}/status`, { status: 'Contacted' }, { headers: this.getHeaders() })
      .subscribe(() => { req.status = 'Contacted'; this.appointmentRequests.update(l => [...l]); });
  }

  rejectRequest(req: AppointmentRequest) {
    const reason = prompt('Reason for rejection?');
    if (!reason) return;
    this.http.patch<any>(`${this.BASE_URL}/api/appointment-requests/${req.id}/status`, { status: 'Rejected', reason }, { headers: this.getHeaders() })
      .subscribe(() => { req.status = 'Rejected'; this.appointmentRequests.update(l => [...l]); });
  }

  deleteRequest(req: AppointmentRequest) {
    if (!confirm(`Delete request from ${req.patientName}? This cannot be undone.`)) return;
    this.http.delete<any>(`${this.BASE_URL}/api/appointment-requests/${req.id}`, { headers: this.getHeaders() })
      .subscribe(res => {
        if (res.success) this.appointmentRequests.update(l => l.filter(r => r.id !== req.id));
        else this.notify.error('Could not delete. It may have been processed already.');
      });
  }

  openConvertModal(req: AppointmentRequest) {
    this.convertRequest.set(req);
    this.cvDoctorId.set(null); 
    this.cvDeptId.set(null); 
    this.cvDate.set(''); 
    this.cvSlot.set(''); 
    this.cvNotes = '';
    this.convertSlots.set([]);
    this.showConvertModal.set(true);
  }

  closeConvertModal() { this.showConvertModal.set(false); }

  loadConvertSlots() {
    const docId = this.cvDoctorId();
    const date = this.cvDate();
    if (!docId || !date) return;
    this.http.get<any>(`${this.BASE_URL}/api/appointments/slots?doctorProfileId=${docId}&date=${date}`, { headers: this.getHeaders() })
      .subscribe(res => { if (res.success) this.convertSlots.set(res.data); });
  }

  confirmConvert() {
    const req = this.convertRequest();
    if (!req) return;
    const payload = { 
      doctorProfileId: this.cvDoctorId(), 
      departmentId: this.cvDeptId(), 
      appointmentDate: this.cvDate(), 
      timeSlot: this.cvSlot(), 
      notes: this.cvNotes 
    };
    this.http.post<any>(`${this.BASE_URL}/api/appointment-requests/${req.id}/convert`, payload, { headers: this.getHeaders() })
      .subscribe(res => {
        if (res.success) {
          req.status = 'Converted';
          this.appointmentRequests.update(l => [...l]);
          this.notify.success(`Booked! Token: ${res.data.tokenNumber}`);
          this.closeConvertModal();
          this.state.loadToday(this.getHeaders());
          this.state.loadCalendar(this.getHeaders(), new Date().toISOString().split('T')[0]);
        }
      });
  }

  onWalkInDeptChange(val: any) {
    this.walkInDeptId.set(+val);
    this.walkInDocId.set(0);
    this.walkInSlots.set([]);
  }

  loadWalkInSlots() {
    const docId = this.walkInDocId();
    const date = this.walkInDate();
    if (!docId || !date) return;
    this.http.get<any>(`${this.BASE_URL}/api/appointments/slots?doctorProfileId=${docId}&date=${date}`, { headers: this.getHeaders() })
      .subscribe(res => { if (res.success) this.walkInSlots.set(res.data); });
  }

  submitWalkIn() {
    const form = document.querySelector('.walkin-form') as any;
    if (!form) return;
    const data = {
      fullName: form.fullName.value,
      phone: form.phone.value,
      email: form.email?.value || '',
      age: +form.age.value,
      gender: form.gender.value,
      departmentId: +this.walkInDeptId(),
      doctorProfileId: +this.walkInDocId(),
      appointmentDate: this.walkInDate(),
      timeSlot: form.slot.value,
      symptoms: form.symptoms?.value || '',
      visitType: 'Walk-in'
    };
    this.walkInSubmitting.set(true);
    this.http.post<any>(`${this.BASE_URL}/api/appointment-requests`, data, { headers: this.getHeaders() })
      .subscribe(res => {
        if (res.success) {
          this.http.post<any>(`${this.BASE_URL}/api/appointment-requests/${res.data.id}/convert`, data, { headers: this.getHeaders() })
            .subscribe(conv => {
              if (conv.success) {
                const apptId = conv.data.id;
                // If Pay Now is checked, confirm payment immediately
                if (form.payNow.checked) {
                  this.http.patch<any>(`${this.BASE_URL}/api/appointments/${apptId}/payment`, { paymentMode: 'Cash' }, { headers: this.getHeaders() })
                    .subscribe(() => {
                      this.finishWalkIn(conv.data);
                    });
                } else {
                  this.finishWalkIn(conv.data);
                }
              } else {
                this.walkInSubmitting.set(false);
                this.notify.error('Could not book appointment.');
              }
            });
        } else { 
          this.walkInSubmitting.set(false); 
          this.notify.error(res.message || 'Registration failed.');
        }
      });
  }

  private finishWalkIn(data: any) {
    this.walkInSubmitting.set(false);
    this.walkInResult.set({ tokenNumber: data.tokenNumber, tempPassword: data.tempPassword });
    this.notify.success(`Walk-in Registered! Token: ${data.tokenNumber}`);
    this.state.loadToday(this.getHeaders());
    this.state.loadCalendar(this.getHeaders(), new Date().toISOString().split('T')[0]);
    // Reset form after success
    const form = document.querySelector('.walkin-form') as any;
    if (form) form.reset();
  }

  onBookingCreated() {
    this.state.loadToday(this.getHeaders());
  }

  exportToCSV() {
    const data = this.state.todayAppointments();
    if (!data.length) return;

    const headers = ['Token', 'Patient', 'Phone', 'Doctor', 'Department', 'Time', 'Status'];
    const rows = data.map(ap => [
      ap.tokenNumber,
      ap.patient.fullName,
      ap.patient.phoneNumber,
      ap.doctor.fullName,
      ap.department.name,
      ap.timeSlot,
      ap.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `OPD_Queue_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getEstimatedWait() {
    // 15 mins per checked-in patient
    return this.state.checkedInCount() * 15;
  }

  callNextPatient() {
    const next = this.state.todayAppointments().find(a => a.status === 'CheckedIn');
    if (next) {
      this.calledPatientId.set(next.id);
      this.notify.success(`Calling ${next.patient.fullName} to Cabin...`);
      // Clear highlight after 10s
      setTimeout(() => this.calledPatientId.set(null), 10000);
    }
  }
}
