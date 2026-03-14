import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfigService } from '../../../core/services/config.service';
import { HospitalChatComponent } from '../../communication/chat/hospital-chat.component';

// const BASE_URL = 'https://localhost:7113';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HospitalChatComponent],
  template: `
    <div class="finance-dash">
      <div class="header">
        <div>
          <h1>Finance Dashboard</h1>
          <p>Revenue, Billing & Claims Management</p>
        </div>
        <div class="header-right">
          <div class="summary-card">
            <span class="lbl">TOTAL REVENUE (TODAY)</span>
            <span class="val">₹{{ todayRevenue() }}</span>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div style="display: flex; gap: 8px; margin-bottom: 20px;">
        <button [style.background]="activeView() === 'billing' ? '#4f46e5' : '#fff'" 
                [style.color]="activeView() === 'billing' ? '#fff' : '#64748b'"
                style="padding: 10px 20px; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"
                (click)="activeView.set('billing')">
          Billing & Invoices
        </button>
        <button [style.background]="activeView() === 'chat' ? '#4f46e5' : '#fff'" 
                [style.color]="activeView() === 'chat' ? '#fff' : '#64748b'"
                style="padding: 10px 20px; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);"
                (click)="activeView.set('chat')">
          Staff Chat
        </button>
      </div>

      <ng-container *ngIf="activeView() === 'billing'">
        <div class="stats-row">
          <div class="stat" (click)="filterStatus.set('All')" [class.active]="filterStatus() === 'All'">
            <div class="stat-num">{{ bills().length }}</div>
            <div class="stat-lbl">Total Bills</div>
          </div>
          <div class="stat pending" (click)="filterStatus.set('Pending')" [class.active]="filterStatus() === 'Pending'">
            <div class="stat-num">{{ pendingCount() }}</div>
            <div class="stat-lbl">Pending Payment</div>
          </div>
          <div class="stat paid" (click)="filterStatus.set('Paid')" [class.active]="filterStatus() === 'Paid'">
            <div class="stat-num">{{ paidCount() }}</div>
            <div class="stat-lbl">Paid Successfully</div>
          </div>
        </div>

        <div class="grid-layout">
          <div class="main-panel">
            <div class="panel-header">
              <h3>Recent Invoices</h3>
              <div class="filters">
                <input type="text" placeholder="Search by patient..." [(ngModel)]="searchQuery">
                <select [(ngModel)]="filterStatus">
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Waived">Waived</option>
                </select>
              </div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Bill #</th>
                    <th>Date</th>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment Type</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let b of filteredBills()">
                    <td class="bill-no">#{{ b.billNumber }}</td>
                    <td>{{ formatDate(b.createdAt) }}</td>
                    <td>
                      <div class="patient-blob">
                        <strong>{{ b.patientName }}</strong>
                        <span>{{ b.patientPhone }}</span>
                      </div>
                    </td>
                    <td>{{ b.doctorName }}</td>
                    <td class="amount">₹{{ b.totalAmount }}</td>
                    <td>
                      <span class="status-chip" [class]="b.status.toLowerCase()">{{ b.status }}</span>
                    </td>
                    <td>{{ b.paymentMode || '—' }}</td>
                    <td>
                      <button *ngIf="b.status === 'Pending'" class="pay-btn" (click)="openPaymentModal(b)">Collect Payment</button>
                      <button class="print-btn" (click)="printBill(b)">Print</button>
                      <button class="email-btn" (click)="emailInvoice(b)" [disabled]="emailLoading() === b.id">
                        {{ emailLoading() === b.id ? 'Sending...' : 'Email' }}
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="filteredBills().length === 0">
                    <td colspan="8" class="no-data">No bills found for the selected criteria.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="activeView() === 'chat'">
        <div style="height: calc(100vh - 250px); background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);">
          <app-hospital-chat></app-hospital-chat>
        </div>
      </ng-container>

      <!-- Payment Modal -->
      <div class="modal-overlay" *ngIf="showPaymentModal()">
        <div class="modal">
          <div class="modal-head">
            <h3>Collect Payment</h3>
            <button (click)="showPaymentModal.set(false)" class="close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <div class="bill-summary">
              <div class="summary-line"><span>Patient</span> <strong>{{ activeBill()?.patientName }}</strong></div>
              <div class="summary-line"><span>Bill Number</span> <span>#{{ activeBill()?.billNumber }}</span></div>
              <div class="total-line"><span>Total Due</span> <strong>₹{{ activeBill()?.totalAmount }}</strong></div>
            </div>

            <div class="form-group">
              <label>Payment Mode</label>
              <select [(ngModel)]="paymentMode">
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR Scan</option>
                <option value="Card">Credit/Debit Card</option>
                <option value="Insurance">Insurance Claim</option>
              </select>
            </div>

            <div class="form-group" style="margin-top:20px">
              <button class="primary-btn full" (click)="confirmPayment()" [disabled]="loading()">
                {{ loading() ? 'Processing...' : 'Mark as Paid' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
    :host { display:block; background:#f4f7fa; min-height:100vh; font-family:'DM Sans',sans-serif; padding:24px; color:#1e293b; }
    
    .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:28px; }
    .header h1 { font-size:26px; font-weight:700; color:#1e1b4b; }
    .header p { color:#64748b; font-size:14px; margin-top:2px; }
    
    .summary-card { background:linear-gradient(135deg,#4f46e5,#6366f1); color:#fff; padding:16px 24px; border-radius:14px; box-shadow:0 10px 15px -3px rgba(79,70,229,0.3); }
    .summary-card .lbl { display:block; font-size:11px; font-weight:700; opacity:0.8; letter-spacing:0.5px; }
    .summary-card .val { font-size:24px; font-weight:700; display:block; margin-top:4px; }

    .stats-row { display:flex; gap:16px; margin-bottom:24px; }
    .stat { flex:1; background:#fff; padding:20px; border-radius:16px; box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1); border-left:4px solid #cbd5e1; cursor:pointer; transition:all 0.2s; }
    .stat.active { border-left-width:8px; transform:translateY(-2px); }
    .stat.pending { border-left-color:#f59e0b; }
    .stat.paid { border-left-color:#10b981; }
    .stat-num { font-size:24px; font-weight:700; color:#1e1b4b; }
    .stat-lbl { font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; margin-top:2px; }

    .main-panel { background:#fff; border-radius:16px; box-shadow:0 10px 15px -3px rgb(0 0 0 / 0.1); overflow:hidden; }
    .panel-header { display:flex; justify-content:space-between; align-items:center; padding:20px 24px; border-bottom:1px solid #f1f5f9; }
    .panel-header h3 { font-size:18px; font-weight:700; }
    .filters { display:flex; gap:12px; }
    .filters input, .filters select { padding:8px 12px; border:1px solid #e2e8f0; border-radius:10px; font-size:13px; outline:none; font-family:inherit; }
    .filters input:focus { border-color:#4f46e5; }

    .table-container { overflow-x:auto; }
    table { width:100%; border-collapse:collapse; }
    th { text-align:left; padding:14px 24px; background:#f8fafc; font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase; }
    td { padding:16px 24px; border-bottom:1px solid #f1f5f9; font-size:14px; }
    .amount { font-weight:700; color:#1e1b4b; }
    .bill-no { font-family:monospace; color:#4f46e5; font-weight:700; }
    .patient-blob strong { display:block; color:#1e1b4b; }
    .patient-blob span { font-size:12px; color:#64748b; }
    
    .status-chip { font-size:11px; font-weight:700; padding:4px 10px; border-radius:12px; text-transform:uppercase; }
    .status-chip.pending { background:#fef3c7; color:#92400e; }
    .status-chip.paid { background:#dcfce7; color:#166534; }
    .status-chip.waived { background:#f1f5f9; color:#475569; }

    .pay-btn { background:#4f46e5; color:#fff; border:none; padding:6px 14px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; margin-right:8px; }
    .print-btn { background:#f1f5f9; color:#475569; border:none; padding:6px 14px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; margin-right:8px; }
    .email-btn { background:#eef2ff; color:#4f46e5; border:none; padding:6px 14px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; }
    .email-btn:disabled { opacity:0.6; }
    
    .no-data { text-align:center; color:#94a3b8; padding:40px !important; }

    .modal-overlay { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.6); display:flex; align-items:center; justify-content:center; z-index:1000; backdrop-filter:blur(4px); }
    .modal { background:#fff; width:400px; border-radius:20px; box-shadow:0 25px 50px -12px rgb(0 0 0 / 0.25); overflow:hidden; animation:slideUp 0.3s ease; }
    @keyframes slideUp { from{transform:translateY(20px);opacity:0;} to{transform:translateY(0);opacity:1;} }
    .modal-head { padding:20px 24px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; }
    .modal-body { padding:24px; }
    .close-btn { background:none; border:none; font-size:24px; color:#94a3b8; cursor:pointer; }

    .bill-summary { background:#f8fafc; padding:16px; border-radius:12px; margin-bottom:20px; }
    .summary-line { display:flex; justify-content:space-between; font-size:14px; margin-bottom:8px; color:#64748b; }
    .total-line { display:flex; justify-content:space-between; font-size:18px; border-top:1px dashed #cbd5e1; margin-top:12px; padding-top:12px; color:#1e1b4b; }
    
    .form-group { display:flex; flex-direction:column; gap:8px; }
    .form-group label { font-size:12px; font-weight:700; color:#475569; text-transform:uppercase; }
    .form-group select { padding:12px; border:1px solid #e2e8f0; border-radius:12px; font-family:inherit; outline:none; }
    .primary-btn { background:#4f46e5; color:#fff; border:none; padding:14px; border-radius:12px; font-weight:700; cursor:pointer; transition:all 0.2s; }
    .primary-btn:hover { background:#4338ca; }
    .primary-btn:disabled { opacity:0.6; cursor:not-allowed; }
  `]
})
export class FinanceDashboardComponent implements OnInit {
  private readonly config = inject(ConfigService);
  private readonly BASE_URL = this.config.baseApiUrl;
  loading = signal(false);
  emailLoading = signal<number | null>(null);
  bills = signal<any[]>([]);
  filterStatus = signal('All');
  searchQuery = '';
  activeView = signal<'billing' | 'chat'>('billing');
  
  todayRevenue = signal(0);
  pendingCount = signal(0);
  paidCount = signal(0);

  showPaymentModal = signal(false);
  activeBill = signal<any>(null);
  paymentMode = 'Cash';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.loadBills();
  }

  getHeaders() {
    return { Authorization: `Bearer ${this.auth.getAccessToken()}` };
  }

  loadBills() {
    this.http.get<any>(`${this.BASE_URL}/api/finance/bills`, { headers: this.getHeaders() }).subscribe(res => {
      if (res.success) {
        this.bills.set(res.data);
        this.calculateStats(res.data);
      }
    });
  }

  calculateStats(data: any[]) {
    const today = new Date().toDateString();
    let rev = 0;
    let pending = 0;
    let paid = 0;

    data.forEach(b => {
      if (b.status === 'Paid') {
        paid++;
        if (new Date(b.createdAt).toDateString() === today) {
          rev += b.totalAmount;
        }
      } else if (b.status === 'Pending') {
        pending++;
      }
    });

    this.todayRevenue.set(rev);
    this.pendingCount.set(pending);
    this.paidCount.set(paid);
  }

  filteredBills() {
    return this.bills().filter((b: any) => {
      const matchStatus = this.filterStatus() === 'All' || b.status === this.filterStatus();
      const matchSearch = b.patientName.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                          b.billNumber.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }

  formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  openPaymentModal(bill: any) {
    this.activeBill.set(bill);
    this.paymentMode = 'Cash';
    this.showPaymentModal.set(true);
  }

  confirmPayment() {
    this.loading.set(true);
    const payload = { status: 'Paid', paymentMode: this.paymentMode };
    this.http.patch<any>(`${this.BASE_URL}/api/finance/bills/${this.activeBill().id}/status`, payload, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success) {
            this.showPaymentModal.set(false);
            this.loadBills();
            // Also update appointment payment status
            this.updateAppointmentPayment(this.activeBill().appointmentId);
          }
        },
        error: () => this.loading.set(false)
      });
  }

  updateAppointmentPayment(apptId: number) {
     this.http.patch(`${this.BASE_URL}/api/appointments/${apptId}/payment`, { paymentStatus: 'Paid', paymentMode: this.paymentMode }, { headers: this.getHeaders() }).subscribe();
  }

  printBill(bill: any) {
    this.notify.info(`Generating invoice PDF for ${bill.billNumber}...`);
    // Logic for print view or PDF creation
  }

  emailInvoice(bill: any) {
    this.emailLoading.set(bill.id);
    this.http.post<any>(`${this.BASE_URL}/api/finance/bills/${bill.id}/email`, {}, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          this.emailLoading.set(null);
          if (res.success) {
            this.notify.success("Invoice has been sent to patient's email successfully.");
          }
        },
        error: (err) => {
          this.emailLoading.set(null);
          this.notify.error(err.error?.message || 'Failed to send email.');
        }
      });
  }
}