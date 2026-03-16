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

        <div class="header-actions" style="display: flex; gap: 10px;">
          <button class="btn-repair" (click)="repairData()" title="Sync Departments & Doctors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Repair Data
          </button>
          <button class="btn-refresh" (click)="loadLayout()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>
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
      margin-bottom: 24px; padding: 24px; background: var(--card-bg); border-radius: var(--radius-md);
      box-shadow: var(--shadow-md); backdrop-filter: var(--glass-blur);
      border: 1px solid var(--glass-border);
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-icon { 
      width: 48px; height: 48px; background: var(--primary-gradient); color: #fff; 
      border-radius: 12px; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(10, 39, 68, 0.2);
    }
    .header-icon svg { width: 24px; height: 24px; }
    .page-header h1 { font-size: 24px; font-weight: 800; color: var(--primary); margin: 0; }
    .page-header p { font-size: 14px; color: #64748b; margin: 4px 0 0; }

    .header-stats { display: flex; gap: 12px; }
    .stat-box { 
      background: #fff; padding: 12px 20px; border-radius: 12px; 
      text-align: center; border: 1px solid #e2e8f0; min-width: 100px;
      box-shadow: var(--shadow-sm);
    }
    .stat-val { display: block; font-size: 20px; font-weight: 800; color: #0f172a; }
    .stat-lbl { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-box.occupied { border-color: var(--primary); background: var(--primary-gradient); }
    .stat-box.occupied .stat-val, .stat-box.occupied .stat-lbl { color: #fff; }
    .stat-box.available { border-color: var(--accent); background: #f0fdf4; }
    .stat-box.available .stat-val { color: var(--accent); }
    .stat-box.cleaning { border-color: var(--warning); background: #fffbeb; }
    .stat-box.cleaning .stat-val { color: #b45309; }

    .controls-bar { 
      display: flex; align-items: center; gap: 16px; margin-bottom: 20px; 
      padding: 0 4px; flex-wrap: wrap;
    }
    .floor-tabs { display: flex; background: #e2e8f0; padding: 4px; border-radius: 12px; }
    .floor-tab { 
      padding: 8px 16px; border: none; background: none; font-size: 13px; 
      font-weight: 700; color: #64748b; border-radius: 8px; cursor: pointer; transition: all 0.2s;
    }
    .floor-tab.active { background: #fff; color: var(--primary); box-shadow: var(--shadow-sm); }

    .search-box { 
      position: relative; flex: 1; max-width: 400px; 
    }
    .search-box svg { position: absolute; left: 12px; top: 10px; width: 18px; color: #94a3b8; }
    .search-box input { 
      width: 100%; padding: 10px 12px 10px 40px; border-radius: 12px; border: 1.5px solid #e2e8f0;
      background: #fff; font-size: 14px; outline: none; transition: border-color 0.2s;
    }
    .search-box input:focus { border-color: var(--primary); }

    .btn-repair {
      padding: 0 16px; height: 42px; border-radius: 12px; border: 1.5px solid var(--danger);
      background: #fef2f2; color: var(--danger); display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;
    }
    .btn-repair:hover { background: var(--danger); color: #fff; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); }
    .btn-repair svg { width: 16px; height: 16px; }

    .btn-refresh { 
      width: 42px; height: 42px; border-radius: 12px; border: 1.5px solid #e2e8f0;
      background: #fff; display: flex; align-items: center; justify-content: center;
      color: #64748b; cursor: pointer; transition: all 0.2s;
    }
    .btn-refresh:hover { background: #f1f5f9; color: var(--primary); border-color: #cbd5e1; }
    .btn-refresh svg { width: 18px; height: 18px; }

    .layout-grid { min-height: 400px; position: relative; }
    .rooms-container { 
      display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 24px;
    }
    .room-card { 
      background: var(--card-bg); border-radius: var(--radius-md); border: 1px solid var(--glass-border); 
      overflow: hidden; box-shadow: var(--shadow-md); backdrop-filter: var(--glass-blur);
      transition: all 0.3s ease;
    }
    .room-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    
    .room-header { 
      padding: 16px 20px; background: rgba(248, 250, 252, 0.8); border-bottom: 1px solid #f1f5f9;
      display: flex; justify-content: space-between; align-items: center;
    }
    .room-num { font-size: 18px; font-weight: 800; color: var(--primary); display: block; }
    .room-type { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .bed-count { font-size: 11px; font-weight: 700; padding: 4px 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 100px; color: #64748b; }

    .beds-grid { padding: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .bed-unit { 
      padding: 14px; border-radius: 14px; border: 1.5px solid #f1f5f9; 
      display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      background: #fff;
    }
    .bed-unit:hover { transform: scale(1.02); border-color: var(--primary-light); box-shadow: var(--shadow-md); }
    
    .bed-icon { 
      width: 36px; height: 36px; border-radius: 10px; display: flex; 
      align-items: center; justify-content: center; background: #f8fafc; color: #94a3b8;
      transition: all 0.2s;
    }
    .bed-icon svg { width: 20px; height: 20px; }
    
    .bed-num { font-size: 14px; font-weight: 800; color: #1e293b; }
    .bed-status { font-size: 11px; color: #94a3b8; font-weight: 600; }
    .bed-patient { font-size: 12px; font-weight: 700; color: var(--primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .bed-unit.available { border-color: var(--accent); background: #f0fdf4; }
    .bed-unit.available .bed-icon { background: #dcfce7; color: var(--accent); }
    .bed-unit.available .bed-status { color: var(--accent); }
    
    .bed-unit.occupied { border-color: var(--primary); background: var(--primary-gradient); }
    .bed-unit.occupied .bed-icon { background: rgba(255,255,255,0.15); color: #fff; }
    .bed-unit.occupied .bed-num, .bed-unit.occupied .bed-patient { color: #fff; }

    .bed-unit.cleaning { border-color: var(--warning); background: #fffbeb; }
    .bed-unit.cleaning .bed-icon { background: #fef3c7; color: var(--warning); }
    .bed-unit.cleaning .bed-status { color: #b45309; }

    /* Drawer */
    .drawer-backdrop { 
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px);
      z-index: 1000; display: flex; justify-content: flex-end;
    }
    .drawer { 
      width: 100%; max-width: 480px; background: #fff; height: 100%; 
      box-shadow: -20px 0 60px rgba(0,0,0,0.15); animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex; flex-direction: column;
    }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    
    .drawer-header { 
      padding: 28px 24px; border-bottom: 1px solid #f1f5f9; display: flex; 
      justify-content: space-between; align-items: center; background: var(--primary-gradient); color: #fff;
    }
    .drawer-header h2 { font-size: 20px; font-weight: 800; margin: 0; }
    .btn-close { background: rgba(255,255,255,0.2); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; transition: 0.2s; }
    .btn-close:hover { background: rgba(255,255,255,0.3); transform: rotate(90deg); }

    .drawer-body { padding: 32px 24px; overflow-y: auto; flex: 1; }
    .bed-summary { 
      display: flex; gap: 20px; padding: 20px; background: #f8fafc; 
      border-radius: 16px; margin-bottom: 32px; border: 1px solid #f1f5f9;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
    }
    .summary-item label { display: block; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
    .summary-item span { font-size: 15px; font-weight: 800; color: var(--primary); }

    .form-section { margin-bottom: 32px; }
    .form-section h3 { font-size: 14px; font-weight: 800; color: var(--primary); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
    
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .input-group { margin-bottom: 20px; }
    .input-group label { display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 8px; }
    .input-group select, .input-group textarea { 
      width: 100%; padding: 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; 
      font-size: 14px; outline: none; font-family: inherit; transition: all 0.2s;
      background: #fcfdfe;
    }
    .input-group select:focus, .input-group textarea:focus { border-color: var(--primary); background: #fff; box-shadow: 0 0 0 4px rgba(10, 39, 68, 0.05); }

    .form-actions { 
      position: sticky; bottom: 0; background: #fff; padding-top: 24px; 
      display: flex; gap: 12px; border-top: 1px solid #f1f5f9;
    }
    .btn-primary { 
      flex: 1; padding: 14px; background: var(--primary-gradient); color: #fff; border: none; 
      border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(10, 39, 68, 0.2);
    }
    .btn-primary:hover { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 6px 20px rgba(10, 39, 68, 0.3); }
    .btn-primary:disabled { background: #cbd5e1; box-shadow: none; cursor: not-allowed; }
    .btn-secondary { flex: 1; padding: 14px; background: #f1f5f9; color: #475569; border: none; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .btn-secondary:hover { background: #e2e8f0; }

    .loading-overlay { 
      display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 100px; color: #64748b;
    }
    .loader { width: 44px; height: 44px; border: 4px solid #f1f5f9; border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .p-header { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; }
    .p-avatar { 
      width: 64px; height: 64px; background: var(--primary-gradient); color: #fff; border-radius: 18px;
      display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800;
      box-shadow: 0 8px 16px rgba(10, 39, 68, 0.15);
    }
    .p-meta h4 { font-size: 20px; margin: 0; color: #0f172a; font-weight: 800; }
    .adm-num { font-size: 13px; color: #94a3b8; font-family: 'DM Mono', monospace; font-weight: 600; margin-top: 4px; display: block; }
    
    .p-actions { display: flex; flex-direction: column; gap: 14px; }
    .p-btn { 
      padding: 16px 20px; border-radius: 16px; border: 1.5px solid #f1f5f9; background: #fff;
      display: flex; align-items: center; gap: 14px; font-weight: 700; color: var(--primary);
      cursor: pointer; transition: all 0.2s;
    }
    .p-btn:hover { background: #f8fafc; border-color: var(--primary-light); transform: translateX(4px); box-shadow: var(--shadow-sm); }
    .p-btn svg { width: 22px; height: 22px; color: var(--primary-light); }
    .p-btn.discharge { color: var(--danger); border-color: #fee2e2; }
    .p-btn.discharge:hover { background: #fef2f2; border-color: var(--danger); }
    .p-btn.discharge svg { color: var(--danger); }

    .cleaning-view { text-align: center; padding: 60px 24px; }
    .cleaning-icon { font-size: 56px; margin-bottom: 20px; }
    .cleaning-view p { font-size: 16px; color: #64748b; margin-bottom: 32px; font-weight: 500; }
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
    this.ipdService.getAllPatients().subscribe(res => {
      if (res.success) this.patients.set(res.data);
    });

    const headers = { Authorization: `Bearer ${this.auth.getAccessToken()}` };
    
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

  repairData() {
    if (!confirm('This will ensure all Departments, Doctors and Patients are active and visible in dropdowns. Proceed?')) return;
    
    this.isLoading.set(true);
    this.ipdService.repairData().subscribe({
      next: (res) => {
        this.notify.success(res.message || 'Data repaired successfully');
        this.loadInitialData(); // Reload dropdowns
        this.loadLayout();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Repair failed');
        this.isLoading.set(false);
      }
    });
  }

  viewSummary(admId: number) {
    this.ipdService.getDischargeSummary(admId).subscribe({
      next: (res) => {
        // Here we could open a modal with the summary. 
        // For now let's just log it and notify the user it's ready.
        console.log('Discharge Summary:', res.data);
        this.notify.success('Discharge Summary & Bill Generated. View in Billing Section.');
      }
    });
  }

  openDischargeModal() {
    const admId = this.selectedBed()?.currentAdmissionId;
    if (!admId) return;

    if (!confirm('Are you sure you want to initiate discharge for this patient? Final Bill will be generated.')) return;

    // Simple discharge for now
    const request = {
      admissionId: admId,
      finalDiagnosis: 'Patient recovered well.',
      dischargeType: 'Normal'
    };

    this.ipdService.dischargePatient(request).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Discharge process initiated and Bill generated.');
          this.viewSummary(admId);
          this.showDrawer.set(false);
          this.loadLayout();
        }
      },
      error: (err) => this.notify.error(err.error?.message || 'Discharge failed')
    });
  }
}
