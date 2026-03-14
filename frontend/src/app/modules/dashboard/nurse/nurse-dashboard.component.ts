import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentStateService } from '../../../core/services/appointment-state.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfigService } from '../../../core/services/config.service';
import { HospitalChatComponent } from '../../communication/chat/hospital-chat.component';

// const BASE_URL = 'https://localhost:7113';

@Component({
  selector: 'app-nurse-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HospitalChatComponent],
  template: `
    <div class="nurse-dash">
      <div class="header">
        <div>
          <h1>Nurse Console</h1>
          <p>OPD Waiting Room & Vitals Entry</p>
        </div>
        <div class="stats">
          <div class="stat-pill"><span class="val">{{ state.checkedInCount() }}</span> <span class="lbl">Waiting for Vitals</span></div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div style="display: flex; gap: 8px; margin-bottom: 20px;">
        <button [style.background]="activeView() === 'vitals' ? '#111827' : '#fff'" 
                [style.color]="activeView() === 'vitals' ? '#fff' : '#6b7280'"
                style="padding: 10px 20px; border: 1px solid #e5e7eb; border-radius: 10px; font-weight: 700; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"
                (click)="activeView.set('vitals')">
          OPD Vitals Console
        </button>
        <button [style.background]="activeView() === 'chat' ? '#111827' : '#fff'" 
                [style.color]="activeView() === 'chat' ? '#fff' : '#6b7280'"
                style="padding: 10px 20px; border: 1px solid #e5e7eb; border-radius: 10px; font-weight: 700; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"
                (click)="activeView.set('chat')">
          Staff Chat
        </button>
      </div>

      <ng-container *ngIf="activeView() === 'vitals'">
        <div class="grid">
        <div class="list-panel">
          <div class="panel-head">
            <h3>Patients in Queue</h3>
            <button class="refresh-btn" (click)="state.loadToday(getHeaders())">↻ Refresh</button>
          </div>
          
          <div class="queue-list">
            <div *ngIf="state.checkedInPatients().length === 0" class="empty-state">
              No patients checked in yet.
            </div>
            
            <div class="queue-item" *ngFor="let p of state.checkedInPatients()" 
                 [class.active]="activePatient()?.id === p.id"
                 (click)="selectPatient(p)">
              <div class="token">#{{ p.tokenNumber }}</div>
              <div class="p-info">
                <strong>{{ p.patient.fullName }}</strong>
                <span>Dr. {{ p.doctor.fullName }} ({{ p.department.name }})</span>
              </div>
              <div class="time">{{ p.timeSlot }}</div>
            </div>
          </div>
        </div>

        <div class="vitals-panel">
          <div *ngIf="!activePatient()" class="empty-vitals">
            <div class="icon">🩺</div>
            <h3>Select a patient to enter vitals</h3>
            <p>Vitals entered here will be instantly visible to the doctor.</p>
          </div>

          <div *ngIf="activePatient()" class="vitals-form-container fade-in">
            <div class="form-head">
              <h2>Vitals Overview — {{ activePatient()?.patient?.fullName }}</h2>
              <span class="token-pill">Token #{{ activePatient()?.tokenNumber }}</span>
            </div>

            <div class="form-grid">
              <div class="input-group">
                <label>Blood Pressure (mmHg)</label>
                <input [(ngModel)]="vitals.bloodPressure" placeholder="e.g. 120/80">
              </div>
              <div class="input-group">
                <label>Heart Rate (bpm)</label>
                <input type="number" [(ngModel)]="vitals.heartRateBpm" placeholder="72">
              </div>
              <div class="input-group">
                <label>Temperature (°F)</label>
                <input type="number" step="0.1" [(ngModel)]="vitals.temperatureFahrenheit" placeholder="98.6">
              </div>
              <div class="input-group">
                <label>Weight (kg)</label>
                <input type="number" step="0.1" [(ngModel)]="vitals.weightKg" placeholder="70">
              </div>
              <div class="input-group">
                <label>SpO2 (%)</label>
                <input type="number" [(ngModel)]="vitals.spO2" placeholder="98">
              </div>
              <div class="input-group">
                <label>Respiration Rate</label>
                <input type="number" [(ngModel)]="vitals.respiratoryRate" placeholder="16">
              </div>
            </div>

            <div class="form-actions">
              <button class="clear-btn" (click)="activePatient.set(null)">Cancel</button>
              <button class="save-btn" (click)="saveVitals()" [disabled]="saving()">
                {{ saving() ? 'Saving...' : 'Save & Update Stats' }}
              </button>
            </div>
          </div>
        </div>
      </div>
      </ng-container>

      <ng-container *ngIf="activeView() === 'chat'">
        <div style="height: calc(100vh - 250px); background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
          <app-hospital-chat></app-hospital-chat>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
    :host { display:block; padding:24px; background:#f9fafb; min-height:100vh; font-family:'Plus Jakarta Sans',sans-serif; }
    
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
    .header h1 { font-size:24px; font-weight:700; color:#111827; }
    .header p { color:#6b7280; font-size:14px; margin-top:2px; }
    .stat-pill { background:#fff; padding:8px 16px; border-radius:12px; border:1px solid #e5e7eb; box-shadow:0 1px 2px rgba(0,0,0,0.05); }
    .stat-pill .val { font-weight:700; color:#059669; font-size:18px; }
    .stat-pill .lbl { color:#6b7280; font-size:12px; font-weight:600; margin-left:4px; }

    .grid { display:grid; grid-template-columns:350px 1fr; gap:24px; align-items:start; }
    
    .list-panel { background:#fff; border-radius:16px; border:1px solid #e5e7eb; height:calc(100vh - 120px); overflow:hidden; display:flex; flex-direction:column; }
    .panel-head { padding:16px 20px; border-bottom:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center; background:#f9fafb; }
    .panel-head h3 { font-size:15px; font-weight:700; color:#374151; }
    .refresh-btn { background:none; border:none; color:#2563eb; font-weight:600; cursor:pointer; font-size:13px; }

    .queue-list { flex:1; overflow-y:auto; }
    .queue-item { padding:16px 20px; border-bottom:1px solid #f3f4f6; cursor:pointer; transition:all 0.2s; display:flex; gap:16px; align-items:center; }
    .queue-item:hover { background:#f9fafb; }
    .queue-item.active { background:#eff6ff; border-left:4px solid #3b82f6; }
    
    .token { width:44px; height:44px; background:#f3f4f6; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:700; font-family:monospace; color:#4b5563; font-size:14px; }
    .active .token { background:#3b82f6; color:#fff; }
    .p-info { flex:1; }
    .p-info strong { display:block; font-size:14px; color:#111827; }
    .p-info span { font-size:12px; color:#6b7280; display:block; margin-top:2px; }
    .time { font-size:12px; font-weight:600; color:#9ca3af; }

    .vitals-panel { background:#fff; border-radius:16px; border:1px solid #e5e7eb; min-height:400px; display:flex; flex-direction:column; }
    .empty-vitals { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:60px; color:#9ca3af; }
    .empty-vitals .icon { font-size:48px; margin-bottom:16px; opacity:0.3; }
    .empty-vitals h3 { color:#4b5563; font-size:18px; margin-bottom:8px; }

    .vitals-form-container { padding:32px; flex:1; }
    .form-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; border-bottom:1px solid #f3f4f6; padding-bottom:20px; }
    .token-pill { background:#dcfce7; color:#166534; font-weight:700; padding:4px 12px; border-radius:20px; font-size:12px; }
    
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
    .input-group { display:flex; flex-direction:column; gap:8px; }
    .input-group label { font-size:13px; font-weight:600; color:#374151; }
    .input-group input { padding:12px; border:1px solid #d1d5db; border-radius:10px; font-size:14px; outline:none; transition:all 0.2s; }
    .input-group input:focus { border-color:#3b82f6; ring:2px solid #bfdbfe; }

    .form-actions { margin-top:40px; border-top:1px solid #f3f4f6; padding-top:24px; display:flex; justify-content:flex-end; gap:16px; }
    .save-btn { background:#111827; color:#fff; border:none; padding:12px 24px; border-radius:10px; font-weight:600; cursor:pointer; font-size:14px; }
    .save-btn:disabled { opacity:0.5; }
    .clear-btn { background:#fff; border:1px solid #d1d5db; padding:12px 24px; border-radius:10px; font-weight:600; cursor:pointer; color:#4b5563; }

    .empty-state { padding:40px 20px; text-align:center; color:#9ca3af; font-size:14px; }
    .fade-in { animation:fadeIn 0.3s ease; }
    @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
  `]
})
export class NurseDashboardComponent implements OnInit {
  private readonly config = inject(ConfigService);
  private readonly BASE_URL = this.config.baseApiUrl;
  activePatient = signal<any>(null);
  saving = signal(false);
  activeView = signal<'vitals' | 'chat'>('vitals');

  vitals = {
    bloodPressure: '',
    heartRateBpm: null,
    temperatureFahrenheit: null,
    weightKg: null,
    spO2: null,
    respiratoryRate: null
  };

  constructor(
    public state: AppointmentStateService,
    private auth: AuthService,
    private http: HttpClient,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.state.loadToday(this.getHeaders());
  }

  getHeaders() {
    return { Authorization: `Bearer ${this.auth.getAccessToken()}` };
  }

  selectPatient(p: any) {
    this.activePatient.set(p);
    this.vitals = {
      bloodPressure: '',
      heartRateBpm: null,
      temperatureFahrenheit: null,
      weightKg: null,
      spO2: null,
      respiratoryRate: null
    };
  }

  saveVitals() {
    if (!this.activePatient()) return;
    
    this.saving.set(true);
    const payload = {
      appointmentId: this.activePatient().id,
      ...this.vitals
    };

    this.http.post<any>(`${this.BASE_URL}/api/consultation/vitals`, payload, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          if (res.success) {
            this.notify.success('Vitals saved successfully! These are now available to the doctor.');
            this.activePatient.set(null);
          }
        },
        error: () => this.saving.set(false)
      });
  }
}