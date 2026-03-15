import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfigService } from '../../../core/services/config.service';
import { HospitalChatComponent } from '../../communication/chat/hospital-chat.component';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HospitalChatComponent],
  template: `
    <div class="finance-dash">
      <div class="header-premium">
        <div class="header-main">
          <h1>Finance Central</h1>
          <p>Revenue & Billing Analytics Center</p>
        </div>
        <div class="header-actions">
          <div class="revenue-chip">
            <span class="dot"></span>
            <span class="label">Today's Revenue</span>
            <span class="value">₹{{ todayRevenue() }}</span>
          </div>
          <button class="export-btn" (click)="exportReports()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export
          </button>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card" (click)="filterStatus.set('All')" [class.active]="filterStatus() === 'All'">
          <div class="kpi-icon total"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div class="kpi-info">
            <span class="kpi-val">{{ bills().length }}</span>
            <span class="kpi-lbl">Total Invoices</span>
          </div>
        </div>
        <div class="kpi-card" (click)="filterStatus.set('Pending')" [class.active]="filterStatus() === 'Pending'">
          <div class="kpi-icon pending"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div class="kpi-info">
            <span class="kpi-val">{{ pendingCount() }}</span>
            <span class="kpi-lbl">Pending Collection</span>
          </div>
        </div>
        <div class="kpi-card" (click)="filterStatus.set('Paid')" [class.active]="filterStatus() === 'Paid'">
          <div class="kpi-icon success"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
          <div class="kpi-info">
            <span class="kpi-val">{{ paidCount() }}</span>
            <span class="kpi-lbl">Successfully Paid</span>
          </div>
        </div>
        <div class="kpi-card waived">
          <div class="kpi-icon promo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M16 12l-4-4-4 4M12 8v8"/></svg></div>
          <div class="kpi-info">
            <span class="kpi-val">₹0</span>
            <span class="kpi-lbl">Discounts/Waived</span>
          </div>
        </div>
      </div>

      <div class="billing-tabs">
        <button [class.active]="activeView() === 'billing'" (click)="activeView.set('billing')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Invoicing Center
        </button>
        <button [class.active]="activeView() === 'analytics'" (click)="activeView.set('analytics')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
          Revenue Analytics
        </button>
        <button [class.active]="activeView() === 'chat'" (click)="activeView.set('chat')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Staff Connect
        </button>
      </div>

      <ng-container *ngIf="activeView() === 'billing'">
        <div class="billing-content animated fadeIn">
          <div class="content-header">
            <h3>Invoice Management</h3>
            <div class="content-filters">
              <div class="search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" placeholder="Search invoices..." [(ngModel)]="searchQuery">
              </div>
              <select [(ngModel)]="filterStatus">
                <option value="All">All Transactions</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>

          <div class="billing-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Issued Date</th>
                  <th>Patient Details</th>
                  <th>Medical Center</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Method</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let b of filteredBills()" class="invoice-row">
                  <td><span class="bill-badge">#{{ b.billNumber }}</span></td>
                  <td>{{ formatDate(b.createdAt) }}</td>
                  <td>
                    <div class="p-cell">
                      <span class="p-name">{{ b.patientName }}</span>
                      <span class="p-sub">{{ b.patientPhone }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="d-cell">
                      <span class="d-dept">{{ b.billSource }}</span>
                    </div>
                  </td>
                  <td><span class="price-cell">₹{{ b.totalAmount }}</span></td>
                  <td>
                    <div class="status-pill" [class]="b.status.toLowerCase()">
                      <span class="dot"></span>
                      {{ b.status }}
                    </div>
                  </td>
                  <td>
                    <span class="method-tag">{{ b.paymentMode || 'Waiting...' }}</span>
                  </td>
                  <td style="text-align: right;">
                    <div class="action-group">
                      <button *ngIf="b.status === 'Pending'" class="btn-pay" (click)="openPaymentModal(b)">
                        Collect
                      </button>
                      <button class="btn-icon-round" (click)="printBill(b)" title="Print Invoice">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                      </button>
                      <button class="btn-icon-round email" (click)="emailInvoice(b)" [disabled]="emailLoading() === b.id">
                        <svg *ngIf="emailLoading() !== b.id" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        <span *ngIf="emailLoading() === b.id" class="loader-small"></span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="activeView() === 'analytics'">
        <div class="analytics-grid animated slideUp">
          <div class="chart-card">
            <div class="card-head"><h4>Revenue Flow (Last 7 Days)</h4></div>
            <div class="viz-placeholder">
              <div class="bar-chart">
                <div class="bar" style="height: 60%"><span class="tooltip">₹12k</span></div>
                <div class="bar" style="height: 45%"><span class="tooltip">₹9k</span></div>
                <div class="bar" style="height: 90%"><span class="tooltip">₹18k</span></div>
                <div class="bar" style="height: 75%"><span class="tooltip">₹15k</span></div>
                <div class="bar today" [style.height]="'65%'"><span class="tooltip">Today: ₹{{todayRevenue()}}</span></div>
              </div>
              <div class="x-axis"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Today</span></div>
            </div>
          </div>
          <div class="side-analytics">
            <div class="summary-box">
              <h5>Source Breakdown</h5>
              <div class="source-item"><label>Pharmacy</label><div class="progress-bg"><div class="progress-inner" style="width: 45%; background: #6366f1;"></div></div><span>45%</span></div>
              <div class="source-item"><label>Laboratory</label><div class="progress-bg"><div class="progress-inner" style="width: 30%; background: #10b981;"></div></div><span>30%</span></div>
              <div class="source-item"><label>OPD/Cons.</label><div class="progress-bg"><div class="progress-inner" style="width: 25%; background: #f59e0b;"></div></div><span>25%</span></div>
            </div>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="activeView() === 'chat'">
        <div class="chat-container-premium animated fadeIn">
          <app-hospital-chat></app-hospital-chat>
        </div>
      </ng-container>

      <div class="modal-backdrop" *ngIf="showPaymentModal()">
        <div class="modal-premium">
          <div class="modal-header">
            <h3>Finalize Collection</h3>
            <button class="close-btn" (click)="showPaymentModal.set(false)">&times;</button>
          </div>
          <div class="modal-body-premium">
            <div class="bill-details-card">
              <div class="b-row"><span>Reference</span> <strong>#{{ activeBill()?.billNumber }}</strong></div>
              <div class="b-row"><span>Patient</span> <span>{{ activeBill()?.patientName }}</span></div>
              <div class="b-divider"></div>
              <div class="b-total">
                <span class="total-lbl">Payable Amount</span>
                <span class="total-val">₹{{ activeBill()?.totalAmount }}</span>
              </div>
            </div>
            <div class="payment-selection">
              <label>Select Payment Method</label>
              <div class="method-grid">
                <button [class.active]="paymentMode === 'Cash'" (click)="paymentMode = 'Cash'">Cash</button>
                <button [class.active]="paymentMode === 'UPI'" (click)="paymentMode = 'UPI'">UPI</button>
                <button [class.active]="paymentMode === 'Card'" (click)="paymentMode = 'Card'">Card</button>
                <button [class.active]="paymentMode === 'Insurance'" (click)="paymentMode = 'Insurance'">Insurance</button>
              </div>
            </div>
            <button class="confirm-btn-premium" (click)="confirmPayment()" [disabled]="loading()">
              {{ loading() ? 'Updating Ledger...' : 'Confirm Payment Receipt' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
    :host { display: block; background: #f8fafc; min-height: 100vh; font-family: 'Outfit', sans-serif; padding: 32px; color: #0f172a; }
    .header-premium { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:32px; }
    .header-main h1 { font-size:32px; font-weight:700; color:#1e1b4b; margin:0; }
    .header-main p { color:#64748b; font-size:16px; margin:4px 0 0 0; }
    .revenue-chip { background:#fff; padding:10px 20px; border-radius:100px; border:1px solid #e2e8f0; display:flex; align-items:center; gap:12px; }
    .revenue-chip .dot { width:8px; height:8px; background:#10b981; border-radius:50%; }
    .revenue-chip .value { font-size:18px; font-weight:700; color:#10b981; }
    .export-btn { background:#0f172a; color:#fff; border:none; padding:10px 20px; border-radius:12px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:8px; }
    .export-btn svg { width:18px; }
    .kpi-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:20px; margin-bottom:32px; }
    .kpi-card { background:#fff; padding:24px; border-radius:24px; border:1px solid #e2e8f0; cursor:pointer; display:flex; align-items:center; gap:16px; transition:0.3s; }
    .kpi-card.active { border-color:#6366f1; background:#f5f3ff; }
    .kpi-icon { width:48px; height:48px; border-radius:14px; display:flex; align-items:center; justify-content:center; }
    .kpi-icon.total { background:#eef2ff; color:#6366f1; }
    .kpi-icon.pending { background:#fffbeb; color:#f59e0b; }
    .kpi-icon.success { background:#ecfdf5; color:#10b981; }
    .kpi-icon.promo { background:#f1f5f9; color:#475569; }
    .kpi-val { display:block; font-size:24px; font-weight:700; }
    .kpi-lbl { display:block; font-size:13px; color:#64748b; }
    .billing-tabs { display:flex; gap:12px; margin-bottom:24px; background:#f1f5f9; padding:6px; border-radius:16px; width:fit-content; }
    .billing-tabs button { border:none; padding:10px 20px; border-radius:12px; background:transparent; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:8px; }
    .billing-tabs button.active { background:#fff; color:#6366f1; box-shadow:0 4px 6px rgba(0,0,0,0.05); }
    .billing-content { background:#fff; border-radius:24px; border:1px solid #e2e8f0; overflow:hidden; }
    .content-header { padding:24px; display:flex; justify-content:space-between; border-bottom:1px solid #f1f5f9; }
    .content-filters { display:flex; gap:16px; }
    .search-box { position:relative; }
    .search-box input { padding:10px 12px 10px 38px; border:1px solid #e2e8f0; border-radius:12px; min-width:240px; }
    .search-box svg { position:absolute; left:12px; top:50%; transform:translateY(-50%); width:16px; color:#94a3b8; }
    table { width:100%; border-collapse:collapse; }
    th { text-align:left; padding:16px 24px; background:#f8fafc; font-size:12px; color:#64748b; text-transform:uppercase; }
    td { padding:20px 24px; border-bottom:1px solid #f1f5f9; }
    .bill-badge { font-family:monospace; font-weight:700; color:#6366f1; background:#f5f3ff; padding:4px 8px; border-radius:6px; }
    .status-pill { display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:100px; font-size:12px; font-weight:600; }
    .status-pill.pending { background:#fffbeb; color:#92400e; }
    .status-pill.paid { background:#ecfdf5; color:#065f46; }
    .status-pill .dot { width:6px; height:6px; border-radius:50%; background:currentColor; }
    .action-group { display:flex; gap:8px; justify-content:flex-end; }
    .btn-pay { background:#6366f1; color:#fff; border:none; padding:8px 16px; border-radius:10px; font-weight:600; cursor:pointer; }
    .btn-icon-round { width:36px; height:36px; border-radius:10px; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; cursor:pointer; background:#fff; }
    .btn-icon-round svg { width:18px; }
    .analytics-grid { display:grid; grid-template-columns:1fr 340px; gap:24px; }
    .chart-card { background:#fff; padding:24px; border-radius:24px; border:1px solid #e2e8f0; }
    .bar-chart { height:200px; display:flex; align-items:flex-end; gap:20px; border-bottom:2px solid #f1f5f9; padding:0 20px; }
    .bar { flex:1; background:#eef2ff; border-radius:6px 6px 0 0; position:relative; }
    .bar.today { background:#6366f1; }
    .modal-backdrop { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .modal-premium { background:#fff; width:450px; border-radius:28px; padding:32px; }
    .bill-details-card { background:#1e1b4b; color:#fff; padding:24px; border-radius:20px; margin-bottom:24px; }
    .b-total { display:flex; justify-content:space-between; align-items:center; margin-top:16px; border-top:1px solid rgba(255,255,255,0.1); padding-top:16px; }
    .total-val { font-size:24px; font-weight:700; color:#10b981; }
    .method-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px; }
    .method-grid button { padding:12px; border:1px solid #e2e8f0; border-radius:12px; background:#fff; cursor:pointer; font-weight:600; }
    .method-grid button.active { border-color:#6366f1; background:#f5f3ff; color:#6366f1; }
    .confirm-btn-premium { width:100%; margin-top:24px; padding:16px; border-radius:16px; background:#6366f1; color:#fff; border:none; font-weight:700; cursor:pointer; }
    .animated { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
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
  activeView = signal<'billing' | 'analytics' | 'chat'>('billing');
  todayRevenue = signal(0);
  pendingCount = signal(0);
  paidCount = signal(0);
  showPaymentModal = signal(false);
  activeBill = signal<any>(null);
  paymentMode = 'Cash';

  constructor(private http: HttpClient, private auth: AuthService, private notify: NotificationService) {}

  ngOnInit() { this.loadBills(); }

  getHeaders() { return { Authorization: `Bearer ${this.auth.getAccessToken()}` }; }

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
    let rev = 0, pending = 0, paid = 0;
    data.forEach(b => {
      if (b.status === 'Paid') {
        paid++;
        if (new Date(b.createdAt).toDateString() === today) rev += b.totalAmount;
      } else if (b.status === 'Pending') pending++;
    });
    this.todayRevenue.set(rev);
    this.pendingCount.set(pending);
    this.paidCount.set(paid);
  }

  filteredBills() {
    return this.bills().filter(b => {
      const matchStatus = this.filterStatus() === 'All' || b.status === this.filterStatus();
      const matchSearch = b.patientName?.toLowerCase().includes(this.searchQuery.toLowerCase()) || b.billNumber?.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }

  formatDate(d: string) { return new Date(d).toLocaleDateString('en-GB'); }

  openPaymentModal(bill: any) { this.activeBill.set(bill); this.paymentMode = 'Cash'; this.showPaymentModal.set(true); }

  confirmPayment() {
    this.loading.set(true);
    this.http.patch<any>(`${this.BASE_URL}/api/finance/bills/${this.activeBill().id}/status`, { status: 'Paid', paymentMode: this.paymentMode }, { headers: this.getHeaders() })
      .subscribe({
        next: () => { this.loading.set(false); this.showPaymentModal.set(false); this.loadBills(); this.notify.success('Payment captured!'); },
        error: () => this.loading.set(false)
      });
  }

  exportReports() { this.notify.success('Report export started...'); }
  printBill(bill: any) { window.print(); }
  emailInvoice(bill: any) {
    this.emailLoading.set(bill.id);
    this.http.post<any>(`${this.BASE_URL}/api/finance/bills/${bill.id}/email`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => { this.emailLoading.set(null); this.notify.success('Email sent!'); },
      error: () => this.emailLoading.set(null)
    });
  }
}