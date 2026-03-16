import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { IpdService } from '../../../core/services/ipd.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../../core/services/config.service';
import { IpdBillingComponent } from './ipd-billing.component';

interface Bed {
  id: number;
  bedNumber: string;
  status: 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance';
  currentAdmissionId?: number;
  patientName?: string;
  admissionNumber?: string;
}

interface Room {
  id: number;
  roomNumber: string;
  roomName: string;
  roomTypeId: number;
  roomTypeName: string;
  floorNumber: number;
  beds: Bed[];
}

interface Floor {
  floorNumber: number;
  rooms: Room[];
}

@Component({
  selector: 'app-bed-allocation',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IpdBillingComponent],
  template: `
    <div class="ipd-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <h1>IPD & Bed Management</h1>
            <p>Real-time hospital occupancy and patient admission control</p>
          </div>
        </div>
        
        <div class="header-stats">
          <div class="stat-box">
            <span class="stat-val">{{ stats().totalBeds }}</span>
            <span class="stat-lbl">Total Beds</span>
          </div>
          <div class="stat-box occupied">
            <span class="stat-val">{{ stats().occupiedBeds }}</span>
            <span class="stat-lbl">Occupied</span>
          </div>
          <div class="stat-box available">
            <span class="stat-val">{{ stats().availableBeds }}</span>
            <span class="stat-lbl">Available</span>
          </div>
          <div class="stat-box cleaning">
            <span class="stat-val">{{ stats().cleaningBeds }}</span>
            <span class="stat-lbl">In Cleaning</span>
          </div>
        </div>
      </div>

      <!-- Controls & Filters -->
      <div class="controls-bar">
        <div class="floor-tabs">
          <button 
            *ngFor="let floor of floors()" 
            class="floor-tab" 
            [class.active]="activeFloor() === floor.floorNumber"
            (click)="activeFloor.set(floor.floorNumber)">
            Floor {{ floor.floorNumber === 0 ? 'G' : floor.floorNumber }}
          </button>
        </div>
        
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search Patient or Room..." [(ngModel)]="searchQuery">
        </div>

        <button class="btn-refresh" (click)="loadLayout()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
      </div>

      <!-- Grid View -->
      <div class="layout-grid">
        <div *ngIf="isLoading()" class="loading-overlay">
          <div class="loader"></div>
          <p>Syncing hospital layout...</p>
        </div>

        <ng-container *ngFor="let floor of floors()">
          <div class="floor-section" *ngIf="activeFloor() === floor.floorNumber">
            <div class="rooms-container">
              <div *ngFor="let room of filterRooms(floor.rooms)" class="room-card">
                <div class="room-header">
                  <div class="room-info">
                    <span class="room-num">{{ room.roomNumber }}</span>
                    <span class="room-type">{{ room.roomTypeName }}</span>
                  </div>
                  <span class="bed-count">{{ getOccupiedCount(room) }}/{{ room.beds.length }} Occupied</span>
                </div>
                
                <div class="beds-grid">
                  <div *ngFor="let bed of room.beds" 
                       class="bed-unit" 
                       [class]="bed.status.toLowerCase()"
                       (click)="onBedClick(bed, room)">
                    <div class="bed-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 4v16M2 8h18M2 12h18M22 4v16M2 20h20"/>
                      </svg>
                    </div>
                    <div class="bed-details">
                      <div class="bed-num">{{ bed.bedNumber }}</div>
                      <div class="bed-patient" *ngIf="bed.status === 'Occupied'">{{ bed.patientName }}</div>
                      <div class="bed-status" *ngIf="bed.status !== 'Occupied'">{{ bed.status }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ng-container>
      </div>

      <!-- Admission Drawer/Modal -->
      <div class="drawer-backdrop" *ngIf="showDrawer()" (click)="showDrawer.set(false)">
        <div class="drawer" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <h2>{{ selectedBed()?.status === 'Available' ? 'New Admission' : 'Patient Details' }}</h2>
            <button class="btn-close" (click)="showDrawer.set(false)">✕</button>
          </div>
          
          <div class="drawer-body">
            <div class="bed-summary">
              <div class="summary-item">
                <label>Room</label>
                <span>{{ selectedRoom()?.roomNumber }} - {{ selectedRoom()?.roomTypeName }}</span>
              </div>
              <div class="summary-item">
                <label>Bed Number</label>
                <span>{{ selectedBed()?.bedNumber }}</span>
              </div>
            </div>

            <!-- ADMISSION FORM -->
            <form *ngIf="selectedBed()?.status === 'Available'" [formGroup]="admissionForm" (ngSubmit)="admitPatient()">
              <div class="form-section">
                <h3>Patient Information</h3>
                <div class="input-group">
                  <label>Select Registered Patient *</label>
                  <select formControlName="patientUserId">
                    <option value="">Select Patient</option>
                    <option *ngFor="let p of patients()" [value]="p.id">{{ p.fullName }} ({{ p.phoneNumber }})</option>
                  </select>
                </div>
              </div>

              <div class="form-section">
                <h3>Medical Selection</h3>
                <div class="form-row">
                  <div class="input-group">
                    <label>Department *</label>
                    <select formControlName="departmentId" (change)="onDeptChange()">
                      <option value="">Select Dept</option>
                      <option *ngFor="let d of departments()" [value]="d.id">{{ d.name }}</option>
                    </select>
                  </div>
                  <div class="input-group">
                    <label>Admitting Doctor *</label>
                    <select formControlName="admittingDoctorProfileId">
                      <option value="">Select Doctor</option>
                      <option *ngFor="let d of filteredDoctors()" [value]="d.id">Dr. {{ d.fullName }}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="form-section">
                <h3>Initial Vitals & Diagnosis</h3>
                <div class="input-group">
                  <label>Chief Complaints</label>
                  <textarea formControlName="chiefComplaints" rows="2"></textarea>
                </div>
                <div class="input-group">
                  <label>Initial Diagnosis</label>
                  <textarea formControlName="initialDiagnosis" rows="2"></textarea>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn-secondary" (click)="showDrawer.set(false)">Cancel</button>
                <button type="submit" class="btn-primary" [disabled]="admissionForm.invalid || isSubmitting()">
                  {{ isSubmitting() ? 'Processing...' : 'Confirm Admission' }}
                </button>
              </div>
            </form>

            <!-- OCCUPIED VIEW -->
            <div *ngIf="selectedBed()?.status === 'Occupied'" class="patient-details">
              <div class="detail-card">
                <div class="p-header">
                  <div class="p-avatar">{{ selectedBed()?.patientName?.charAt(0) }}</div>
                  <div class="p-meta">
                    <h4>{{ selectedBed()?.patientName }}</h4>
                    <span class="adm-num">{{ selectedBed()?.admissionNumber }}</span>
                  </div>
                </div>
                
                <div class="p-actions">
                  <button class="p-btn" (click)="viewBilling()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    Daily Billing
                  </button>
                  <button class="p-btn discharge" (click)="openDischargeModal()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                    </svg>
                    Initiate Discharge
                  </button>
                </div>
              </div>
            </div>

            <!-- CLEANING VIEW -->
            <div *ngIf="selectedBed()?.status === 'Cleaning'" class="cleaning-view">
              <div class="cleaning-icon">🧹</div>
              <p>Bed is currently being prepared and sanitized.</p>
              <button class="btn-primary" (click)="markAvailable()">Mark as Available</button>
            </div>
          </div>
        </div>
      <div class="drawer-backdrop" *ngIf="showBilling()" (click)="showBilling.set(false)">
        <div class="drawer billing" (click)="$event.stopPropagation()">
           <app-ipd-billing 
            [admissionId]="selectedBed()?.currentAdmissionId || 0" 
            (close)="showBilling.set(false)">
           </app-ipd-billing>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ipd-container { padding: 0; animation: fadeIn 0.4s ease-out; font-family: 'DM Sans', sans-serif; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .page-header { 
      display: flex; justify-content: space-between; align-items: center; 
      margin-bottom: 24px; padding: 24px; background: #fff; border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-icon { 
      width: 48px; height: 48px; background: #0a2744; color: #fff; 
      border-radius: 12px; display: flex; align-items: center; justify-content: center;
    }
    .header-icon svg { width: 24px; height: 24px; }
    .page-header h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
    .page-header p { font-size: 14px; color: #64748b; margin: 4px 0 0; }

    .header-stats { display: flex; gap: 12px; }
    .stat-box { 
      background: #f8fafc; padding: 12px 20px; border-radius: 12px; 
      text-align: center; border: 1px solid #e2e8f0; min-width: 100px;
    }
    .stat-val { display: block; font-size: 20px; font-weight: 800; color: #0f172a; }
    .stat-lbl { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-box.occupied { border-color: #0d3461; background: #0d3461; }
    .stat-box.occupied .stat-val, .stat-box.occupied .stat-lbl { color: #fff; }
    .stat-box.available { border-color: #22c55e; background: #f0fdf4; }
    .stat-box.available .stat-val { color: #15803d; }
    .stat-box.cleaning { border-color: #f59e0b; background: #fffbeb; }
    .stat-box.cleaning .stat-val { color: #b45309; }

    .controls-bar { 
      display: flex; align-items: center; gap: 16px; margin-bottom: 20px; 
      padding: 0 4px; flex-wrap: wrap;
    }
    .floor-tabs { display: flex; background: #e2e8f0; padding: 4px; border-radius: 10px; }
    .floor-tab { 
      padding: 8px 16px; border: none; background: none; font-size: 13px; 
      font-weight: 600; color: #64748b; border-radius: 7px; cursor: pointer; transition: all 0.2s;
    }
    .floor-tab.active { background: #fff; color: #0a2744; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

    .search-box { 
      position: relative; flex: 1; max-width: 400px; 
    }
    .search-box svg { position: absolute; left: 12px; top: 10px; width: 18px; color: #94a3b8; }
    .search-box input { 
      width: 100%; padding: 10px 12px 10px 40px; border-radius: 10px; border: 1.5px solid #e2e8f0;
      background: #fff; font-size: 14px; outline: none; transition: border-color 0.2s;
    }
    .search-box input:focus { border-color: #0a2744; }

    .btn-refresh { 
      width: 40px; height: 40px; border-radius: 10px; border: 1.5px solid #e2e8f0;
      background: #fff; display: flex; align-items: center; justify-content: center;
      color: #64748b; cursor: pointer; transition: all 0.2s;
    }
    .btn-refresh:hover { background: #f1f5f9; color: #0a2744; border-color: #cbd5e1; }
    .btn-refresh svg { width: 18px; height: 18px; }

    .layout-grid { min-height: 400px; position: relative; }
    .rooms-container { 
      display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;
    }
    .room-card { 
      background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; 
      overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.02);
    }
    .room-header { 
      padding: 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
      display: flex; justify-content: space-between; align-items: center;
    }
    .room-num { font-size: 16px; font-weight: 800; color: #0f172a; display: block; }
    .room-type { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .bed-count { font-size: 11px; font-weight: 600; padding: 4px 8px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; }

    .beds-grid { padding: 16px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .bed-unit { 
      padding: 12px; border-radius: 12px; border: 1.5px solid #e2e8f0; 
      display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s;
    }
    .bed-unit:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    
    .bed-icon { 
      width: 32px; height: 32px; border-radius: 8px; display: flex; 
      align-items: center; justify-content: center; background: #f1f5f9; color: #94a3b8;
    }
    .bed-icon svg { width: 18px; height: 18px; }
    
    .bed-num { font-size: 13px; font-weight: 700; color: #0f172a; }
    .bed-status { font-size: 11px; color: #94a3b8; }
    .bed-patient { font-size: 12px; font-weight: 600; color: #0a2744; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .bed-unit.available { border-color: #22c55e; background: #f0fdf4; }
    .bed-unit.available .bed-icon { background: #dcfce7; color: #22c55e; }
    
    .bed-unit.occupied { border-color: #0d3461; background: #0d3461; }
    .bed-unit.occupied .bed-icon { background: rgba(255,255,255,0.1); color: #fff; }
    .bed-unit.occupied .bed-num, .bed-unit.occupied .bed-patient { color: #fff; }

    .bed-unit.cleaning { border-color: #f59e0b; background: #fffbeb; }
    .bed-unit.cleaning .bed-icon { background: #fef3c7; color: #f59e0b; }

    /* Drawer */
    .drawer-backdrop { 
      position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(4px);
      z-index: 1000; display: flex; justify-content: flex-end;
    }
    .drawer { 
      width: 100%; max-width: 450px; background: #fff; height: 100%; 
      box-shadow: -10px 0 40px rgba(0,0,0,0.1); animation: slideIn 0.3s ease-out;
      display: flex; flex-direction: column;
    }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    
    .drawer-header { 
      padding: 24px; border-bottom: 1px solid #e2e8f0; display: flex; 
      justify-content: space-between; align-items: center; background: #0a2744; color: #fff;
    }
    .drawer-header h2 { font-size: 18px; font-weight: 700; margin: 0; }
    .btn-close { background: rgba(255,255,255,0.2); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; }

    .drawer-body { padding: 24px; overflow-y: auto; flex: 1; }
    .bed-summary { 
      display: flex; gap: 20px; padding: 16px; background: #f8fafc; 
      border-radius: 12px; margin-bottom: 24px; border: 1px solid #e2e8f0;
    }
    .summary-item label { display: block; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
    .summary-item span { font-size: 14px; font-weight: 700; color: #0a2744; }

    .form-section { margin-bottom: 24px; }
    .form-section h3 { font-size: 13px; font-weight: 700; color: #0a2744; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed #e2e8f0; }
    
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .input-group { margin-bottom: 16px; }
    .input-group label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 6px; }
    .input-group select, .input-group textarea { 
      width: 100%; padding: 10px; border: 1.5px solid #e2e8f0; border-radius: 8px; 
      font-size: 14px; outline: none; font-family: inherit;
    }
    .input-group select:focus { border-color: #0a2744; }

    .form-actions { 
      position: sticky; bottom: 0; background: #fff; padding-top: 20px; 
      display: flex; gap: 12px; border-top: 1px solid #e2e8f0;
    }
    .btn-primary { 
      flex: 1; padding: 12px; background: #0a2744; color: #fff; border: none; 
      border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s;
    }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
    .btn-secondary { flex: 1; padding: 12px; background: #f1f5f9; color: #475569; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; }

    .loading-overlay { 
      display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px; color: #64748b;
    }
    .loader { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #0a2744; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .p-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .p-avatar { 
      width: 56px; height: 56px; background: #0a2744; color: #fff; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800;
    }
    .p-meta h4 { font-size: 18px; margin: 0; color: #0f172a; }
    .adm-num { font-size: 12px; color: #64748b; font-family: monospace; }
    
    .p-actions { display: flex; flex-direction: column; gap: 12px; }
    .p-btn { 
      padding: 14px; border-radius: 12px; border: 1.5px solid #e2e8f0; background: #fff;
      display: flex; align-items: center; gap: 12px; font-weight: 700; color: #0a2744;
      cursor: pointer; transition: all 0.2s;
    }
    .p-btn:hover { background: #f8fafc; border-color: #0a2744; }
    .p-btn svg { width: 20px; height: 20px; }
    .p-btn.discharge { color: #ef4444; border-color: #fca5a5; }
    .p-btn.discharge:hover { background: #fef2f2; border-color: #ef4444; }

    .cleaning-view { text-align: center; padding: 40px 20px; }
    .cleaning-icon { font-size: 48px; margin-bottom: 16px; }
    .cleaning-view p { color: #64748b; margin-bottom: 24px; }
  `]
})
export class BedAllocationComponent implements OnInit {
  private ipdService = inject(IpdService);
  private notify = inject(NotificationService);
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  private fb = inject(FormBuilder);

  isLoading = signal(true);
  isSubmitting = signal(false);
  floors = signal<Floor[]>([]);
  activeFloor = signal(0);
  searchQuery = '';

  showDrawer = signal(false);
  showBilling = signal(false);
  selectedBed = signal<Bed | null>(null);
  selectedRoom = signal<Room | null>(null);

  patients = signal<any[]>([]);
  departments = signal<any[]>([]);
  doctors = signal<any[]>([]);
  filteredDoctors = computed(() => {
    const deptId = this.admissionForm.get('departmentId')?.value;
    if (!deptId) return [];
    return this.doctors().filter(d => d.departmentId === +deptId);
  });

  admissionForm = this.fb.group({
    patientUserId: ['', Validators.required],
    departmentId: ['', Validators.required],
    admittingDoctorProfileId: ['', Validators.required],
    admissionType: ['Regular'],
    chiefComplaints: [''],
    initialDiagnosis: ['']
  });

  stats = computed(() => {
    let total = 0, occupied = 0, available = 0, cleaning = 0;
    this.floors().forEach(f => {
      f.rooms.forEach(r => {
        r.beds.forEach(b => {
          total++;
          if (b.status === 'Occupied') occupied++;
          else if (b.status === 'Available') available++;
          else if (b.status === 'Cleaning') cleaning++;
        });
      });
    });
    return { totalBeds: total, occupiedBeds: occupied, availableBeds: available, cleaningBeds: cleaning };
  });

  ngOnInit() {
    this.loadLayout();
    this.loadInitialData();
  }

  loadLayout() {
    this.isLoading.set(true);
    this.ipdService.getHospitalLayout().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.floors.set(res.data);
          if (res.data.length > 0 && !this.activeFloor()) {
            this.activeFloor.set(res.data[0].floorNumber);
          }
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.notify.error('Failed to load hospital layout');
        this.isLoading.set(false);
      }
    });
  }

  loadInitialData() {
    const headers = { Authorization: `Bearer ${this.auth.getAccessToken()}` };
    
    // Load patients
    this.http.get<any>(`${this.config.apiUrl}/users?role=Patient`, { headers }).subscribe(res => {
      if (res.success) {
        // Handle both 'users' and 'data' property depending on response shape
        this.patients.set(res.users || res.data || []);
      }
    });

    // Load departments
    this.http.get<any>(`${this.config.apiUrl}/departments`, { headers }).subscribe(res => {
      if (res.success) this.departments.set(res.data);
    });

    // Load doctors
    this.http.get<any>(`${this.config.apiUrl}/doctors`, { headers }).subscribe(res => {
      if (res.success) this.doctors.set(res.data);
    });
  }

  filterRooms(rooms: Room[]) {
    if (!this.searchQuery) return rooms;
    const q = this.searchQuery.toLowerCase();
    return rooms.filter(r => 
      r.roomNumber.toLowerCase().includes(q) || 
      r.roomName.toLowerCase().includes(q) ||
      r.beds.some(b => b.patientName?.toLowerCase().includes(q))
    );
  }

  getOccupiedCount(room: Room) {
    return room.beds.filter(b => b.status === 'Occupied').length;
  }

  onBedClick(bed: Bed, room: Room) {
    this.selectedBed.set(bed);
    this.selectedRoom.set(room);
    this.showDrawer.set(true);
    
    if (bed.status === 'Available') {
      this.admissionForm.reset({
        admissionType: 'Regular',
        patientUserId: '',
        departmentId: '',
        admittingDoctorProfileId: '',
        chiefComplaints: '',
        initialDiagnosis: ''
      });
    }
  }

  onDeptChange() {
    this.admissionForm.get('admittingDoctorProfileId')?.setValue('');
  }

  admitPatient() {
    if (this.admissionForm.invalid) return;
    this.isSubmitting.set(true);

    const request = {
      ...this.admissionForm.value,
      roomId: this.selectedRoom()?.id,
      roomTypeId: this.selectedRoom()?.roomTypeId,
      bedId: this.selectedBed()?.id
    };

    this.ipdService.admitPatient(request).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Patient admitted successfully');
          this.showDrawer.set(false);
          this.loadLayout();
        }
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Failed to admit patient');
        this.isSubmitting.set(false);
      }
    });
  }

  markAvailable() {
    const bedId = this.selectedBed()?.id;
    if (!bedId) return;
    
    // In a real app we'd have an endpoint to update bed status. 
    // For now I'll just use a generic update or simulate it if the API is restricted.
    const headers = { Authorization: `Bearer ${this.auth.getAccessToken()}` };
    this.http.patch(`${this.config.apiUrl}/ipd/beds/${bedId}/status`, { status: 'Available' }, { headers }).subscribe({
      next: () => {
        this.notify.success('Bed marked as available');
        this.showDrawer.set(false);
        this.loadLayout();
      }
    });
  }

  viewBilling() {
    this.showDrawer.set(false);
    this.showBilling.set(true);
  }

  openDischargeModal() {
    const admId = this.selectedBed()?.currentAdmissionId;
    if (!admId) return;

    if (!confirm('Are you sure you want to initiate discharge for this patient?')) return;

    // Simple discharge for now
    const request = {
      admissionId: admId,
      finalDiagnosis: 'Patient recovered well.',
      dischargeType: 'Normal'
    };

    this.ipdService.dischargePatient(request).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Discharge process initiated');
          this.showDrawer.set(false);
          this.loadLayout();
        }
      },
      error: (err) => this.notify.error(err.error?.message || 'Discharge failed')
    });
  }
}
