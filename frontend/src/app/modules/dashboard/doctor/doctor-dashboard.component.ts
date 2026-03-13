import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentStateService } from '../../../core/services/appointment-state.service';
import { AppointmentCalendarComponent } from '../receptionist/appointment-calendar.component';
import { NotificationService } from '../../../core/services/notification.service';

import { ConfigService } from '../../../core/services/config.service';

// const BASE_URL = 'https://localhost:7113';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AppointmentCalendarComponent],
  template: `
    <div class="doctor-dash">
      <div class="header">
        <div class="header-left">
          <div class="avatar">{{ myProfile()?.specialization?.[0] || 'D' }}</div>
          <div>
            <h1>Dr. {{ auth.currentUser()?.fullName }}</h1>
            <p>{{ myProfile()?.specialization || 'Doctor' }} Module</p>
          </div>
        </div>
        <div class="stats">
          <div class="stat-chip"><div class="stat-val">{{ state.totalToday() }}</div><div class="stat-lbl">Appointments Today</div></div>
          <div class="stat-chip pending"><div class="stat-val">{{ state.checkedInCount() }}</div><div class="stat-lbl">Waiting</div></div>
        </div>
      </div>

      <div class="main-content">
        <!-- Sidebar Navigation -->
        <div class="sidebar">
          <button [class.active]="activeTab() === 'schedule'" (click)="activeTab.set('schedule')">
            My Schedule
          </button>
          <button [class.active]="activeTab() === 'leaves'" (click)="activeTab.set('leaves')">
            Manage Leaves
          </button>
          <button [class.active]="activeTab() === 'consultation'" (click)="activeTab.set('consultation')" [disabled]="!activeAppointmentId()">
            Consultation {{ activeAppointmentId() ? '(Active)' : '' }}
          </button>
          <button [class.active]="activeTab() === 'performance'" (click)="loadPerformance()">
            Performance
          </button>
        </div>

        <!-- Content Area -->
        <div class="content-panel">
          
          <!-- SCHEDULE TAB -->
          <div *ngIf="activeTab() === 'schedule'" class="fade-in">
            <div *ngIf="loadingProfile()" class="loading">Loading schedule...</div>
            <app-appointment-calendar 
              *ngIf="!loadingProfile() && myProfile()"
              mode="doctor" 
              [restrictDoctorId]="myProfile()!.id"
              (patientSelected)="startConsultation($event)">
            </app-appointment-calendar>
          </div>

          <!-- LEAVES TAB -->
          <div *ngIf="activeTab() === 'leaves'" class="fade-in">
            <div class="panel">
              <div class="panel-head"><h3>Mark New Leave / Absence</h3></div>
              <div class="panel-body form-grid">
                <div class="input-group"><label>Start Date</label><input type="date" [(ngModel)]="leaveForm.startDate"></div>
                <div class="input-group"><label>End Date</label><input type="date" [(ngModel)]="leaveForm.endDate"></div>
                <div class="input-group full"><label>Reason</label><input [(ngModel)]="leaveForm.reason" placeholder="e.g. Personal, Conference, Sick"></div>
                <div class="input-group full"><button class="primary-btn" (click)="submitLeave()">Submit Leave Request</button></div>
              </div>
            </div>

            <div class="panel" style="margin-top:20px;">
              <div class="panel-head"><h3>Your Recent Leaves</h3></div>
              <div class="panel-body">
                <div *ngIf="myLeaves().length === 0" class="empty">No leave records found.</div>
                <table class="data-table" *ngIf="myLeaves().length > 0">
                   <thead><tr><th>Dates</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
                   <tbody>
                     <tr *ngFor="let l of myLeaves()">
                       <td>{{ formatDateShort(l.startDate) }} - {{ formatDateShort(l.endDate) }}</td>
                       <td>{{ l.reason }}</td>
                       <td><span class="status-badge" [class]="l.status.toLowerCase()">{{ l.status }}</span></td>
                       <td><button class="small-btn danger" (click)="cancelLeave(l.id)">Cancel</button></td>
                     </tr>
                   </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- CONSULTATION TAB -->
          <div *ngIf="activeTab() === 'consultation'" class="consult-view fade-in">
            <div class="consult-header">
              <h2>Consultation — {{ consultationPatientName() }}</h2>
              <span class="patient-id">Appt ID: #{{ activeAppointmentId() }}</span>
            </div>

            <div class="consult-grid">
              
              <!-- Vitals Section -->
              <div class="panel">
                <div class="panel-head">
                  <h3><span class="icon">❤️</span> Vitals</h3>
                  <button class="small-btn" (click)="saveVitals()" [disabled]="vitalsSaved()">
                    {{ vitalsSaved() ? 'Saved' : 'Save Vitals' }}
                  </button>
                </div>
                <div class="panel-body form-grid">
                  <div class="input-group"><label>Blood Pressure</label><input [(ngModel)]="vitals.bloodPressure" placeholder="e.g. 120/80"></div>
                  <div class="input-group"><label>Heart Rate (bpm)</label><input [(ngModel)]="vitals.heartRateBpm" type="number"></div>
                  <div class="input-group"><label>Temp (°F)</label><input [(ngModel)]="vitals.temperatureFahrenheit" type="number" step="0.1"></div>
                  <div class="input-group"><label>Weight (kg)</label><input [(ngModel)]="vitals.weightKg" type="number" step="0.1"></div>
                  <div class="input-group"><label>SpO2 (%)</label><input [(ngModel)]="vitals.spO2" type="number"></div>
                </div>
              </div>

              <!-- Lab Orders Section -->
              <div class="panel">
                <div class="panel-head">
                  <h3><span class="icon">🔬</span> Lab Test Orders</h3>
                  <button class="small-btn" (click)="saveLab()">Order Test</button>
                </div>
                <div class="panel-body form-grid">
                  <div class="input-group full"><label>Test Type</label>
                    <select [(ngModel)]="lab.testType">
                      <option value="Blood Test">Blood Test</option>
                      <option value="Urine Test">Urine Test</option>
                      <option value="X-Ray">X-Ray</option>
                      <option value="MRI">MRI</option>
                      <option value="ECG">ECG</option>
                    </select>
                  </div>
                  <div class="input-group full"><label>Reason</label><textarea [(ngModel)]="lab.notes" rows="2"></textarea></div>
                </div>
                <div *ngIf="savedLabs().length > 0" class="saved-items">
                  <h4>Ordered Tests:</h4>
                  <ul><li *ngFor="let l of savedLabs()">
                    <span [class.font-bold]="l.criticalAlert" [class.text-red]="l.criticalAlert">{{ l.testType }}</span> - {{ l.notes }}
                    <span *ngIf="l.status === 'Completed' && l.reportUrl">
                      <a [href]="l.reportUrl" target="_blank" style="color: #2563eb; text-decoration: underline; font-size: 12px; margin-left: 8px;">View PDF Report</a>
                    </span>
                    <span *ngIf="l.status !== 'Completed'" style="color: #64748b; font-size: 12px; margin-left: 8px;">({{ l.status }})</span>
                  </li></ul>
                </div>
              </div>

              <!-- Prescription Section -->
              <div class="panel full-width">
                <div class="panel-head">
                  <h3><span class="icon">💊</span> Prescription</h3>
                </div>
                <div class="panel-body">
                  <div class="input-group full" style="margin-top:10px;"><label>Diagnosis</label><input [(ngModel)]="prescription.diagnosis" placeholder="Primary diagnosis"></div>
                  
                  <div class="medication-checklist" style="margin-top:20px;">
                    <label style="font-size:12px; font-weight:700; color:#475569; text-transform:uppercase; margin-bottom:12px; display:block;">Quick Medicine Select</label>
                    <div class="med-grid">
                      <label *ngFor="let med of checkboxMeds()" class="med-item">
                        <input type="checkbox" (change)="toggleMed(med.name)" [checked]="isMedSelected(med.name)">
                        <span>{{ med.name }} <small>({{ med.dose }})</small></span>
                      </label>
                    </div>
                  </div>

                  <div class="input-group full" style="margin-top:20px;"><label>Full Prescription / Medicines</label>
                    <textarea [(ngModel)]="prescription.medicinesJson" rows="4" placeholder="1. Paracetamol 500mg, 1-0-1..."></textarea>
                  </div>

                  <div class="form-grid" style="margin-top:20px;">
                    <div class="input-group"><label>Advice / Instructions</label><input [(ngModel)]="prescription.advice" placeholder="e.g. Drink 3L water daily"></div>
                    <div class="input-group"><label>Recommended Diet Plan</label>
                      <select [(ngModel)]="prescription.dietPlan">
                        <option value="">No specific diet</option>
                        <option value="Low Sodium - Avoid salty foods, pickles, and processed snacks.">Low Sodium</option>
                        <option value="Diabetic Friendly - Avoid sugar, refined carbs. High fiber focus.">Diabetic Friendly</option>
                        <option value="High Protein - Include lean meats, eggs, pulses, and nuts.">High Protein</option>
                        <option value="Liquid Diet - Clear soups, juices, and water only.">Liquid Diet</option>
                        <option value="Soft Food - Mashed vegetables, curd rice, and soft fruits.">Soft Food</option>
                      </select>
                    </div>
                  </div>
                  <div style="margin-top:16px; text-align:right; display:flex; justify-content:flex-end; gap:8px;">
                    <button class="primary-btn" (click)="savePrescription()" [disabled]="prescSaved()">
                      {{ prescSaved() ? 'Prescription Saved' : 'Save Prescription' }}
                    </button>
                    <button class="secondary-btn" *ngIf="prescSaved()" (click)="printPrescription()">
                      🖨️ Print / Save PDF
                    </button>
                  </div>
                </div>
              </div>

            </div>

            <!-- Complete Action -->
            <div class="consultation-actions">
              <button class="cancel-btn" (click)="endConsultation()">Close</button>
              <button class="complete-btn" (click)="markCompleted()">Mark as Completed (Auto-Bill)</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    :host { display:block; font-family:'Inter',sans-serif; background:#f4f7f6; min-height:100vh; padding:20px 24px; }
    * { box-sizing:border-box; margin:0; padding:0; }
    
    .header { display:flex; justify-content:space-between; align-items:center; background:#fff; padding:20px 24px; border-radius:16px; margin-bottom:20px; box-shadow:0 4px 14px rgba(0,0,0,0.03); flex-wrap:wrap; gap:12px; }
    .header-left { display:flex; align-items:center; gap:16px; }
    .avatar { width:50px; height:50px; border-radius:12px; background:linear-gradient(135deg,#1d4ed8,#0ea5e9); color:#fff; display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:700; flex-shrink:0; }
    .header h1 { font-size:20px; color:#0f172a; font-weight:700; }
    .header p { font-size:14px; color:#64748b; margin-top:2px; }
    .stats { display:flex; gap:12px; flex-wrap:wrap; }
    .stat-chip { background:#f1f5f9; padding:8px 16px; border-radius:10px; text-align:center; min-width:100px; }
    .stat-chip.pending { background:#ecfdf5; }
    .stat-val { font-size:20px; font-weight:700; color:#0f172a; }
    .stat-chip.pending .stat-val { color:#047857; }
    .stat-lbl { font-size:11px; color:#64748b; text-transform:uppercase; margin-top:2px; font-weight:600; }

    .main-content { display:flex; gap:20px; align-items:flex-start; }
    
    .sidebar { width:180px; display:flex; flex-direction:column; gap:8px; background:#fff; padding:16px; border-radius:16px; box-shadow:0 4px 14px rgba(0,0,0,0.03); flex-shrink:0; }
    .sidebar button { text-align:left; padding:12px 16px; border:none; background:transparent; border-radius:10px; font-size:14px; font-weight:600; color:#64748b; cursor:pointer; transition:all 0.2s; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .sidebar button:hover:not(:disabled) { background:#f8fafc; color:#0f172a; }
    .sidebar button.active { background:#e0f2fe; color:#0369a1; }
    .sidebar button:disabled { opacity:0.5; cursor:not-allowed; }

    .content-panel { flex:1; min-width:0; background:#fff; border-radius:16px; padding:24px; box-shadow:0 4px 14px rgba(0,0,0,0.03); overflow:auto; }
    .loading { color:#64748b; font-size:14px; text-align:center; padding:40px; }
    .fade-in { animation:fadeIn 0.3s ease; }
    @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }

    .consult-header { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:16px; margin-bottom:20px; flex-wrap:wrap; gap:8px; }
    .consult-header h2 { font-size:18px; color:#0f172a; }
    .patient-id { background:#f1f5f9; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:600; color:#475569; }

    .consult-grid { display:flex; flex-direction:column; gap:20px; }
    .panel { border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; }
    .panel-head { background:#f8fafc; padding:12px 16px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; }
    .panel-head h3 { font-size:15px; color:#0f172a; display:flex; align-items:center; gap:8px; }
    .panel-body { padding:16px; }
    
    .form-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; }
    .input-group { display:flex; flex-direction:column; gap:6px; }
    .input-group.full { grid-column:1 / -1; }
    .input-group label { font-size:12px; font-weight:600; color:#475569; }
    .input-group input, .input-group select, .input-group textarea { padding:8px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:13px; outline:none; font-family:inherit; width:100%; }
    .input-group input:focus, .input-group select:focus, .input-group textarea:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.1); }

    .small-btn { background:#e0f2fe; color:#0369a1; border:none; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; white-space:nowrap; }
    .small-btn:disabled { opacity:0.6; cursor:not-allowed; }
    .primary-btn { background:#0369a1; color:#fff; border:none; padding:10px 20px; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; }
    .primary-btn:disabled { opacity:0.6; }

    .saved-items { margin-top:12px; padding:12px; background:#f0fdf4; border:1px dashed #bbf7d0; border-radius:8px; font-size:13px; color:#166534; }
    .saved-items h4 { font-size:12px; margin-bottom:4px; text-transform:uppercase; color:#15803d; }
    .saved-items ul { padding-left:20px; }

    .secondary-btn { background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; padding:10px 16px; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; }
    .secondary-btn:hover { background:#e2e8f0; }

    .consultation-actions { margin-top:24px; padding-top:20px; border-top:1px solid #e2e8f0; display:flex; justify-content:flex-end; gap:12px; flex-wrap:wrap; }
    .cancel-btn { padding:10px 20px; border:1px solid #cbd5e1; background:#fff; border-radius:8px; font-weight:600; color:#475569; cursor:pointer; }
    .complete-btn { padding:10px 24px; background:#16a34a; color:#fff; border:none; border-radius:8px; font-weight:600; font-size:15px; cursor:pointer; box-shadow:0 4px 12px rgba(22,163,74,0.3); }
    .complete-btn:hover { background:#15803d; }

    .data-table { width:100%; border-collapse:collapse; margin-top:10px; font-size:13px; }
    .data-table th, .data-table td { text-align:left; padding:12px; border-bottom:1px solid #e2e8f0; }
    .data-table th { background:#f8fafc; font-weight:600; color:#475569; }
    .status-badge { padding:4px 8px; border-radius:6px; font-size:11px; font-weight:700; text-transform:uppercase; }
    .status-badge.approved { background:#ecfdf5; color:#047857; }
    .status-badge.pending { background:#fefce8; color:#a16207; }
    .status-badge.rejected { background:#fef2f2; color:#b91c1c; }
    .small-btn.danger { background:#fef2f2; color:#b91c1c; }

    /* PERFORMANCE STYLES */
    .perf-header { margin-bottom:24px; }
    .perf-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:30px; }
    .perf-card { padding:24px; border-radius:16px; background:#fff; border:1px solid #e2e8f0; display:flex; flex-direction:column; align-items:center; text-align:center; transition:all 0.3s; }
    .perf-card:hover { transform:translateY(-5px); box-shadow:0 12px 24px rgba(0,0,0,0.05); }
    .perf-icon { font-size:32px; margin-bottom:12px; }
    .perf-val { font-size:28px; font-weight:800; color:#0f172a; margin-bottom:4px; }
    .perf-lbl { font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; }
    .perf-card.blue { border-left:4px solid #3b82f6; }
    .perf-card.green { border-left:4px solid #10b981; }
    .perf-card.amber { border-left:4px solid #f59e0b; }
    .perf-card.purple { border-left:4px solid #8b5cf6; }

    .perf-chart-mock { background:#f8fafc; border-radius:16px; padding:30px; border:1px solid #e2e8f0; }
    .chart-header { font-weight:700; color:#334155; margin-bottom:40px; }
    .bars { display:flex; align-items:flex-end; gap:30px; height:200px; padding-bottom:30px; border-bottom:2px solid #e2e8f0; }
    .bar { flex:1; background:#cbd5e1; border-radius:6px 6px 0 0; position:relative; min-width:40px; animation:grow 1s ease-out; }
    .bar.current { background:linear-gradient(to top, #6366f1, #818cf8); }
    .bar span { position:absolute; bottom:-25px; left:50%; transform:translateX(-50%); font-size:12px; font-weight:600; color:#64748b; }
    @keyframes grow { from { height:0; } }

    /* PRESCRIPTION CHECKLIST */
    .med-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:12px; }
    .med-item { display:flex; align-items:center; gap:8px; padding:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; cursor:pointer; font-size:13px; transition:0.2s; }
    .med-item:hover { background:#f1f5f9; }
    .med-item input { width:auto; }
    .med-item small { color:#64748b; }
  `]
})
export class DoctorDashboardComponent implements OnInit {
  private readonly config = inject(ConfigService);
  private readonly BASE_URL = this.config.baseApiUrl;
  
  activeTab = signal<'schedule' | 'consultation' | 'leaves' | 'performance'>('schedule');
  performanceStats = signal<any>(null);
  myProfile = signal<any>(null);
  loadingProfile = signal(true);
  myLeaves = signal<any[]>([]);

  // Forms
  leaveForm = { startDate: '', endDate: '', reason: '' };
  activeAppointmentId = signal<number | null>(null);
  consultationPatientName = signal('');

  vitals = { bloodPressure: '', heartRateBpm: null, temperatureFahrenheit: null, weightKg: null, spO2: null };
  lab = { testType: 'Blood Test', notes: '' };
  prescription: any = { diagnosis: '', medicinesJson: '', advice: '', dietPlan: '' };

  checkboxMeds = signal([
    { name: 'Paracetamol', dose: '500mg' },
    { name: 'Amoxicillin', dose: '250mg' },
    { name: 'Cetirizine', dose: '10mg' },
    { name: 'Pantoprazole', dose: '40mg' },
    { name: 'Vitamin C', dose: '500mg' },
    { name: 'Ibuprofen', dose: '400mg' }
  ]);

  // Statuses
  vitalsSaved = signal(false);
  prescSaved = signal(false);
  savedLabs = signal<any[]>([]);

  constructor(
    public state: AppointmentStateService,
    private http: HttpClient,
    public auth: AuthService,
    private notify: NotificationService
  ) { }

  ngOnInit() {
    this.loadProfile();
    this.loadLeaves();
  }

  getHeaders() {
    return { Authorization: `Bearer ${this.auth.getAccessToken()}` };
  }

  loadProfile() {
    this.http.get<any>(`${this.BASE_URL}/api/doctors/my`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        if (res.success) {
          this.myProfile.set(res.data);
          // Load today's stats via service using doctorId
          this.state.loadToday(this.getHeaders(), res.data.id);
        }
        this.loadingProfile.set(false);
      },
      error: (err) => {
        this.loadingProfile.set(false);
        if (err.status === 404) {
          this.notify.error('Your doctor profile has not been set up yet. Please contact the administrator.');
        } else {
          this.notify.error('Failed to load profile. Please try again.');
        }
      }
    });
  }

  startConsultation(event: { appointmentId: number, patientName: string }) {
    this.activeAppointmentId.set(event.appointmentId);
    this.consultationPatientName.set(event.patientName);

    // Reset forms
    this.vitals = { bloodPressure: '', heartRateBpm: null, temperatureFahrenheit: null, weightKg: null, spO2: null };
    this.lab = { testType: 'Blood Test', notes: '' };
    this.prescription = { diagnosis: '', medicinesJson: '', advice: '' };
    this.vitalsSaved.set(false);
    this.prescSaved.set(false);
    this.savedLabs.set([]);

    // Optional: fetch existing consultation data
    this.http.get<any>(`${this.BASE_URL}/api/consultation/${event.appointmentId}`, { headers: this.getHeaders() })
      .subscribe(res => {
        if (res.success && res.data) {
          if (res.data.vitals?.length > 0) {
            this.vitals = res.data.vitals[0];
            this.vitalsSaved.set(true);
          }
          if (res.data.prescriptions?.length > 0) {
            this.prescription = res.data.prescriptions[0];
            this.prescSaved.set(true);
          }
          if (res.data.labOrders?.length > 0) {
            this.savedLabs.set(res.data.labOrders);
          }
        }
      });

    this.activeTab.set('consultation');

    // Auto mark status as "WithDoctor"
    this.state.updateStatus(event.appointmentId, 'WithDoctor', this.getHeaders());
  }

  saveVitals() {
    const payload = { appointmentId: this.activeAppointmentId(), ...this.vitals };
    this.http.post<any>(`${this.BASE_URL}/api/consultation/vitals`, payload, { headers: this.getHeaders() })
      .subscribe(res => { if (res.success) this.vitalsSaved.set(true); });
  }

  saveLab() {
    if (!this.lab.notes) { this.notify.error('Enter reason for test'); return; }
    const payload = { appointmentId: this.activeAppointmentId(), testType: this.lab.testType, notes: this.lab.notes };
    this.http.post<any>(`${this.BASE_URL}/api/consultation/lab-orders`, payload, { headers: this.getHeaders() })
      .subscribe(res => {
        if (res.success) {
          this.savedLabs.update(l => [...l, res.data]);
          this.lab.notes = '';
        }
      });
  }

  savePrescription() {
    if (!this.prescription.diagnosis) { this.notify.error('Diagnosis is required'); return; }
    const payload = { appointmentId: this.activeAppointmentId(), ...this.prescription };
    this.http.post<any>(`${this.BASE_URL}/api/consultation/prescription`, payload, { headers: this.getHeaders() })
      .subscribe(res => { if (res.success) this.prescSaved.set(true); });
  }

  printPrescription() {
    const rx = this.prescription;
    const pt = this.consultationPatientName();
    const docName = this.auth.currentUser()?.fullName;
    const docSpec = this.myProfile()?.specialization;
    const date = new Date().toLocaleDateString('en-GB');

    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; border: 1px solid #ccc;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #1d4ed8; margin: 0;">MediCore Hospital</h1>
          <p style="margin: 5px 0 0 0; color: #666;">Multispecialty Healthcare Facility</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <h3 style="margin: 0;">Dr. ${docName}</h3>
            <p style="margin: 5px 0; color: #666;">${docSpec}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>Appt ID:</strong> #${this.activeAppointmentId()}</p>
          </div>
        </div>

        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
          <h4 style="margin: 0 0 10px 0;">Patient: ${pt}</h4>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Diagnosis</h3>
          <p>${rx.diagnosis}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">℞ Medicines</h3>
          <pre style="font-family: inherit; white-space: pre-wrap; margin-top: 10px;">${rx.medicinesJson}</pre>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Advice / Notes</h3>
          <p>${rx.advice || 'N/A'}</p>
        </div>

        ${rx.dietPlan ? `
        <div style="margin-bottom: 40px; background: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fde68a;">
          <h3 style="margin: 0 0 10px 0; color: #92400e;">🥗 Recommended Diet Plan</h3>
          <p style="margin: 0; color: #92400e;">${rx.dietPlan}</p>
        </div>` : ''}

        <div style="margin-top: 60px; text-align: right;">
          <p style="margin: 0;">_______________________</p>
          <p style="margin: 5px 0 0 0;">Doctor's Signature</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '', 'width=900,height=700');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Prescription PDF</title></head><body>');
      printWindow.document.write(printContent);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      // Delay printing slightly to ensure content renders
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }

  markCompleted() {
    if (confirm('Mark this appointment as Completed? This will auto-generate the patient bill.')) {
      this.state.updateStatus(this.activeAppointmentId()!, 'Completed', this.getHeaders());
      this.endConsultation();
    }
  }

  loadLeaves() {
    this.http.get<any>(`${this.BASE_URL}/api/doctor-leaves/my`, { headers: this.getHeaders() }).subscribe({
      next: (res) => { if (res.success) this.myLeaves.set(res.data); },
      error: () => { /* Handle profile missing cases silently or generically */ }
    });
  }

  submitLeave() {
    if (!this.leaveForm.startDate || !this.leaveForm.endDate || !this.leaveForm.reason) {
      this.notify.error('Please fill all fields');
      return;
    }
    this.http.post<any>(`${this.BASE_URL}/api/doctor-leaves`, this.leaveForm, { headers: this.getHeaders() }).subscribe(res => {
      if (res.success) {
        this.notify.success('Leave submitted successfully');
        this.leaveForm = { startDate: '', endDate: '', reason: '' };
        this.loadLeaves();
      }
    });
  }

  cancelLeave(id: number) {
    if (confirm('Cancel this leave?')) {
      this.http.delete<any>(`${this.BASE_URL}/api/doctor-leaves/${id}`, { headers: this.getHeaders() }).subscribe(res => {
        if (res.success) {
          this.notify.success('Leave cancelled');
          this.loadLeaves();
        }
      });
    }
  }

  formatDateShort(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  endConsultation() {
    this.activeAppointmentId.set(null);
    this.consultationPatientName.set('');
    this.activeTab.set('schedule');
  }

  loadPerformance() {
    this.activeTab.set('performance');
    if (!this.myProfile()) return;
    this.http.get<any>(`${this.BASE_URL}/api/reports/doctor-performance/${this.myProfile()!.id}`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => { if (res.success) this.performanceStats.set(res.data); },
        error: () => this.notify.error('Failed to load performance stats.')
      });
  }

  toggleMed(name: string) {
    let current = this.prescription.medicinesJson || '';
    if (this.isMedSelected(name)) {
      this.prescription.medicinesJson = current.replace(`${name} | 1-0-1 | After Food\n`, '').replace(`${name} | 1-0-1 | After Food`, '').trim();
    } else {
      this.prescription.medicinesJson = current + (current ? '\n' : '') + `${name} | 1-0-1 | After Food`;
    }
  }

  isMedSelected(name: string): boolean {
    return (this.prescription.medicinesJson || '').includes(name);
  }
}