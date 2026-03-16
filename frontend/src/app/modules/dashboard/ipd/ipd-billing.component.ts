import { Component, signal, computed, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { IpdService } from '../../../core/services/ipd.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-ipd-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="billing-container">
      <div class="billing-header">
        <div class="patient-info">
          <h3>Billing: {{ admission()?.patientName }}</h3>
          <span class="adm-num">ADM: {{ admission()?.admissionNumber }}</span>
        </div>
        <button class="btn-close" (click)="close.emit()">✕</button>
      </div>

      <div class="billing-body">
        <!-- Summary Cards -->
        <div class="summary-grid">
          <div class="summary-card total">
            <label>Grand Total</label>
            <span class="value">₹{{ summary()?.grandTotal || 0 }}</span>
          </div>
          <div class="summary-card">
            <label>Room Charges</label>
            <span class="valueSmall">₹{{ summary()?.totalRoomCharges || 0 }}</span>
          </div>
          <div class="summary-card">
            <label>Doctor Visits</label>
            <span class="valueSmall">₹{{ summary()?.totalDoctorCharges || 0 }}</span>
          </div>
          <div class="summary-card">
            <label>Medicines</label>
            <span class="valueSmall">₹{{ summary()?.totalMedicineCharges || 0 }}</span>
          </div>
        </div>

        <!-- Add Charge Form -->
        <div class="section-card add-charge">
          <h4>Add Daily Charge</h4>
          <form [formGroup]="chargeForm" (ngSubmit)="addCharge()">
            <div class="form-grid">
              <div class="input-group">
                <label>Doctor Visit</label>
                <input type="number" formControlName="doctorVisitCharge" placeholder="0">
              </div>
              <div class="input-group">
                <label>Nursing</label>
                <input type="number" formControlName="nursingCharge" placeholder="0">
              </div>
              <div class="input-group">
                <label>Medicines</label>
                <input type="number" formControlName="medicineCharge" placeholder="0">
              </div>
              <div class="input-group">
                <label>Lab / Tests</label>
                <input type="number" formControlName="labCharge" placeholder="0">
              </div>
              <div class="input-group">
                <label>Procedures</label>
                <input type="number" formControlName="procedureCharge" placeholder="0">
              </div>
              <div class="input-group">
                <label>Other</label>
                <input type="number" formControlName="otherCharges" placeholder="0">
              </div>
            </div>
            <div class="input-group full">
              <label>Notes</label>
              <textarea formControlName="notes" rows="1"></textarea>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="chargeForm.invalid || isSubmitting()">
                {{ isSubmitting() ? 'Adding...' : 'Add Daily Charge' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Charges Table -->
        <div class="section-card charges-history">
          <h4>Charge History</h4>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Room</th>
                  <th>Doctor</th>
                  <th>Med/Lab</th>
                  <th>Other</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let charge of charges()">
                  <td class="date-cell">
                    {{ charge.chargeDate | date:'MMM d, y' }}
                    <span class="time">{{ charge.chargeDate | date:'shortTime' }}</span>
                  </td>
                  <td>₹{{ charge.roomCharge }}</td>
                  <td>₹{{ charge.doctorVisitCharge }}</td>
                  <td>₹{{ charge.medicineCharge + charge.labCharge }}</td>
                  <td>₹{{ charge.otherCharges + charge.procedureCharge }}</td>
                  <td class="total-cell">₹{{ charge.totalDayCharge }}</td>
                </tr>
                <tr *ngIf="charges().length === 0">
                  <td colspan="6" class="empty">No charges recorded yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .billing-container { background: var(--bg-main); height: 100%; display: flex; flex-direction: column; font-family: 'DM Sans', sans-serif; animation: fadeIn 0.4s ease-out; }
    
    .billing-header { 
      padding: 24px 32px; background: var(--primary-gradient); color: #fff; display: flex; 
      justify-content: space-between; align-items: center; box-shadow: var(--shadow-md);
    }
    .patient-info h3 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
    .adm-num { font-size: 13px; opacity: 0.8; font-family: 'DM Mono', monospace; font-weight: 600; }
    .btn-close { background: rgba(255,255,255,0.15); border: none; color: #fff; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
    .btn-close:hover { background: rgba(255,255,255,0.25); transform: rotate(90deg); }

    .billing-body { padding: 32px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 24px; }

    .summary-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 16px; }
    .summary-card { padding: 20px; background: var(--card-bg); border: 1px solid var(--glass-border); border-radius: 16px; backdrop-filter: var(--glass-blur); box-shadow: var(--shadow-sm); transition: 0.2s; }
    .summary-card.total { background: var(--primary-gradient); color: #fff; border: none; box-shadow: 0 10px 20px rgba(10, 39, 68, 0.2); }
    .summary-card label { display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; opacity: 0.8; }
    .summary-card .value { font-size: 28px; font-weight: 900; letter-spacing: -1px; }
    .summary-card .valueSmall { font-size: 18px; font-weight: 800; color: var(--primary); }
    .summary-card:hover:not(.total) { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: var(--primary-light); }

    .section-card { background: var(--card-bg); border: 1px solid var(--glass-border); border-radius: 20px; padding: 24px; backdrop-filter: var(--glass-blur); box-shadow: var(--shadow-sm); }
    .section-card h4 { font-size: 16px; font-weight: 800; color: var(--primary); margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px dashed #f1f5f9; padding-bottom: 12px; }

    .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .input-group { margin-bottom: 16px; }
    .input-group label { display: block; font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 8px; }
    .input-group input, .input-group textarea { width: 100%; padding: 12px 16px; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 14px; outline: none; transition: 0.2s; font-family: inherit; }
    .input-group input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(10, 39, 68, 0.05); }
    .input-group.full { grid-column: 1 / -1; }

    .form-actions { display: flex; justify-content: flex-end; margin-top: 12px; }
    .btn-primary { padding: 14px 28px; background: var(--primary-gradient); color: #fff; border: none; border-radius: 14px; font-weight: 800; cursor: pointer; box-shadow: 0 8px 16px rgba(10, 39, 68, 0.15); transition: 0.3s; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(10, 39, 68, 0.25); filter: brightness(1.1); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .table-wrapper { overflow-x: auto; border-radius: 16px; border: 1px solid #f1f5f9; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { text-align: left; padding: 16px 20px; background: #f8fafc; color: #64748b; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #f1f5f9; }
    td { padding: 18px 20px; border-bottom: 1px solid #f1f5f9; color: #334155; font-weight: 500; }
    .date-cell { display: flex; flex-direction: column; font-weight: 800; color: #0f172a; }
    .date-cell .time { font-size: 11px; color: #94a3b8; font-weight: 600; margin-top: 2px; }
    .total-cell { font-weight: 900; color: var(--primary); font-size: 15px; }
    .empty { text-align: center; padding: 60px; color: #94a3b8; font-weight: 600; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class IpdBillingComponent implements OnInit {
  private ipdService = inject(IpdService);
  private notify = inject(NotificationService);
  private fb = inject(FormBuilder);

  @Input() admissionId!: number;
  @Output() close = new EventEmitter<void>();

  admission = signal<any>(null);
  charges = signal<any[]>([]);
  summary = signal<any>(null);
  isSubmitting = signal(false);

  chargeForm = this.fb.group({
    doctorVisitCharge: [0],
    nursingCharge: [0],
    medicineCharge: [0],
    labCharge: [0],
    procedureCharge: [0],
    otherCharges: [0],
    notes: ['']
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    if (!this.admissionId) return;

    this.ipdService.getChargesForAdmission(this.admissionId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.charges.set(res.data);
          this.summary.set(res.summary);
        }
      }
    });

    this.ipdService.getAdmissionDetails(this.admissionId).subscribe({
      next: (res: any) => {
        if (res.success) this.admission.set(res.data);
      }
    });
  }

  addCharge() {
    this.isSubmitting.set(true);
    const request = {
      ...this.chargeForm.value,
      admissionId: this.admissionId
    };

    this.ipdService.addDailyCharge(request).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notify.success('Charge added successfully');
          this.chargeForm.reset({
            doctorVisitCharge: 0, nursingCharge: 0, medicineCharge: 0,
            labCharge: 0, procedureCharge: 0, otherCharges: 0, notes: ''
          });
          this.loadData();
        }
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Failed to add charge');
        this.isSubmitting.set(false);
      }
    });
  }
}
