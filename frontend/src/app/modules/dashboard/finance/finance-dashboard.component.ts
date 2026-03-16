import { Component, OnInit, signal, inject, computed } from '@angular/core';
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
            <span class="value">₹{{ todayRevenue() | number:'1.0-0' }}</span>
          </div>
          <button class="export-btn" (click)="exportReports()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export
          </button>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card" (click)="filterStatus.set('All')" [class.active]="filterStatus() === 'All'">
          <div class="kpi-icon total"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div class="kpi-info">
            <span class="kpi-val">{{ bills().length }}</span>
            <span class="kpi-lbl">Total Invoices</span>
          </div>
        </div>
        <div class="kpi-card" (click)="filterStatus.set('Unpaid')" [class.active]="filterStatus() === 'Unpaid'">
          <div class="kpi-icon pending"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div class="kpi-info">
            <span class="kpi-val">{{ pendingCount() }}</span>
            <span class="kpi-lbl">Pending Collection</span>
          </div>
        </div>
        <div class="kpi-card" (click)="filterStatus.set('Paid')" [class.active]="filterStatus() === 'Paid'">
          <div class="kpi-icon success"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
          <div class="kpi-info">
            <span class="kpi-val">{{ paidCount() }}</span>
            <span class="kpi-lbl">Successfully Paid</span>
          </div>
        </div>
        <div class="kpi-card waived">
          <div class="kpi-icon promo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8l4 4-4 4M8 12h8"/></svg></div>
          <div class="kpi-info">
            <span class="kpi-val">₹0</span>
            <span class="kpi-lbl">Discounts/Waived</span>
          </div>
        </div>
      </div>

      <div class="billing-tabs">
        <button [class.active]="activeView() === 'billing'" (click)="activeView.set('billing')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Invoicing Center
        </button>
        <button [class.active]="activeView() === 'analytics'" (click)="activeView.set('analytics')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
          Revenue Analytics
        </button>
        <button [class.active]="activeView() === 'expenses'" (click)="activeView.set('expenses')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Expense Ledger
        </button>
        <button [class.active]="activeView() === 'chat'" (click)="activeView.set('chat')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Staff Connect
        </button>
      </div>

      <ng-container *ngIf="activeView() === 'billing'">
        <div class="billing-content animated fadeIn">
          <div class="content-header">
            <h3>Invoice Management</h3>
            <div class="content-filters">
              <div class="search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" placeholder="Search invoices..." [(ngModel)]="searchQuery">
              </div>
              <select [ngModel]="filterStatus()" (ngModelChange)="filterStatus.set($event)">
                <option value="All">All Transactions</option>
                <option value="Unpaid">Pending</option>
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
                  <td><span class="price-cell">₹{{ b.totalAmount | number:'1.0-0' }}</span></td>
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
                      <button *ngIf="b.status === 'Unpaid'" class="btn-pay" (click)="openPaymentModal(b)">
                        Collect
                      </button>
                      <button class="btn-icon-round" (click)="printBill(b)" title="Print Invoice">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                      </button>
                      <button class="btn-icon-round email" (click)="emailInvoice(b)" [disabled]="emailLoading() === b.id">
                        <svg *ngIf="emailLoading() !== b.id" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
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
        <div class="analytics-wrapper animated slideUp">
          <div class="analytics-header">
            <div class="summary-pills">
              <div class="p-pill">
                <span class="l">Monthly Revenue</span>
                <span class="v">₹{{ summary().monthRevenue | number:'1.0-0' }}</span>
              </div>
              <div class="p-pill expense">
                <span class="l">Monthly Expenses</span>
                <span class="v">₹{{ summary().monthExpenses | number:'1.0-0' }}</span>
              </div>
              <div class="p-pill profit" [class.loss]="summary().netProfit < 0">
                <span class="l">Estimated Net Profit</span>
                <span class="v">₹{{ summary().netProfit | number:'1.0-0' }}</span>
              </div>
            </div>
          </div>

          <div class="analytics-grid">
            <div class="chart-card">
              <div class="card-head"><h4>Revenue Source Distribution</h4></div>
              <div class="source-grid-premium">
                <div class="s-card pharmacy">
                  <div class="s-icon">💊</div>
                  <div class="s-info">
                    <span class="s-label">Pharmacy</span>
                    <span class="s-val">₹{{ summary().revenueBreakdown.Pharmacy | number:'1.0-0' }}</span>
                  </div>
                </div>
                <div class="s-card laboratory">
                  <div class="s-icon">🔬</div>
                  <div class="s-info">
                    <span class="s-label">Laboratories</span>
                    <span class="s-val">₹{{ summary().revenueBreakdown.Laboratory | number:'1.0-0' }}</span>
                  </div>
                </div>
                <div class="s-card opd">
                  <div class="s-icon">🩺</div>
                  <div class="s-info">
                    <span class="s-label">OPD / Consultations</span>
                    <span class="s-val">₹{{ summary().revenueBreakdown.OPD | number:'1.0-0' }}</span>
                  </div>
                </div>
                <div class="s-card ipd">
                  <div class="s-icon">🛌</div>
                  <div class="s-info">
                    <span class="s-label">IPD / Bed Charges</span>
                    <span class="s-val">₹{{ summary().revenueBreakdown.IPD | number:'1.0-0' }}</span>
                  </div>
                </div>
              </div>

              <div class="profit-viz">
                 <div class="viz-bar">
                    <div class="fill revenue" [style.width]="'100%'"></div>
                    <div class="fill expense" [style.width]="(summary().monthExpenses / summary().monthRevenue * 100) + '%'"></div>
                 </div>
                 <div class="viz-labels">
                    <span>Expenses vs Total Revenue</span>
                    <span>{{ (summary().monthExpenses / summary().monthRevenue * 100) | number:'1.0-1' }}% ratio</span>
                 </div>
              </div>
            </div>

            <div class="side-metrics">
              <div class="metric-box ipd-gradient">
                 <div class="m-head">
                   <span class="m-title">Bed Occupancy</span>
                   <span class="m-stat">{{ (occupiedBeds() / totalBeds() * 100) | number:'1.0-0' }}%</span>
                 </div>
                 <div class="m-progress"><div class="m-bar" [style.width]="(occupiedBeds() / totalBeds() * 100) + '%'"></div></div>
                 <div class="m-footer">{{ occupiedBeds() }} out of {{ totalBeds() }} beds in use</div>
              </div>

              <div class="metric-box dark">
                 <span class="m-title">Projected Annual Revenue</span>
                 <div class="m-val">₹{{ (summary().monthRevenue * 12) | number:'1.0-0' }}</div>
                 <span class="m-sub">Based on current month performance</span>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="activeView() === 'expenses'">
        <div class="expenses-content animated fadeIn">
          <div class="content-header">
            <h3>Hospital Expenditure Ledger</h3>
            <button class="add-expense-btn" (click)="showExpenseModal.set(true)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              Record New Expense
            </button>
          </div>

          <div class="billing-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let e of expenses()" class="invoice-row">
                  <td>{{ formatDate(e.expenseDate) }}</td>
                  <td><span class="category-chip" [class]="e.category.toLowerCase()">{{ e.category }}</span></td>
                  <td>{{ e.description }}</td>
                  <td style="text-align: right;"><span class="price-cell loss">₹{{ e.amount | number:'1.0-0' }}</span></td>
                </tr>
                <tr *ngIf="expenses().length === 0">
                  <td colspan="4" style="text-align:center; padding:40px; color:#94a3b8;">No expenses recorded yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="activeView() === 'chat'">
        <div class="chat-container-premium animated fadeIn">
          <app-hospital-chat></app-hospital-chat>
        </div>
      </ng-container>

      <div class="modal-backdrop" *ngIf="showExpenseModal()">
        <div class="modal-premium">
          <div class="modal-header">
            <h3>Record Hospital Expense</h3>
            <button class="close-btn" (click)="showExpenseModal.set(false)">&times;</button>
          </div>
          <div class="modal-body-premium">
            <div class="form-group">
              <label>Description</label>
              <input type="text" [(ngModel)]="newExpense.description" placeholder="e.g. Monthly Staff Salary, Medical Supplies">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Amount (₹)</label>
                <input type="number" [(ngModel)]="newExpense.amount">
              </div>
              <div class="form-group">
                <label>Category</label>
                <select [(ngModel)]="newExpense.category">
                  <option value="Salary">Salary</option>
                  <option value="Supplies">Medical Supplies</option>
                  <option value="Utilities">Utilities (Electricity/Water)</option>
                  <option value="Rent">Rent</option>
                  <option value="Equipment">Medical Equipment</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="General">Other / General</option>
                </select>
              </div>
            </div>
            <div class="form-group">
                <label>Expense Date</label>
                <input type="date" [(ngModel)]="newExpense.expenseDate">
            </div>
            <button class="confirm-btn-premium" (click)="addExpense()" [disabled]="isLoading()">
              {{ isLoading() ? 'Saving Record...' : 'Record Expense' }}
            </button>
          </div>
        </div>
      </div>

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
                <span class="total-val">₹{{ activeBill()?.totalAmount | number:'1.0-0' }}</span>
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
            <button class="confirm-btn-premium" (click)="confirmPayment()" [disabled]="isLoading()">
              {{ isLoading() ? 'Updating Ledger...' : 'Confirm Payment Receipt' }}
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
    .kpi-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
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
    .search-box input { padding:10px 12px 10px 38px; border:1px solid #e2e8f0; border-radius:12px; min-width:240px; outline:none; }
    .search-box input:focus { border-color: #6366f1; }
    .search-box svg { position:absolute; left:12px; top:50%; transform:translateY(-50%); width:16px; color:#94a3b8; }
    table { width:100%; border-collapse:collapse; }
    th { text-align:left; padding:16px 24px; background:#f8fafc; font-size:12px; color:#64748b; text-transform:uppercase; }
    td { padding:20px 24px; border-bottom:1px solid #f1f5f9; }
    .bill-badge { font-family:monospace; font-weight:700; color:#6366f1; background:#f5f3ff; padding:4px 8px; border-radius:6px; }
    .status-pill { display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:100px; font-size:12px; font-weight:600; text-transform: capitalize; }
    .status-pill.unpaid { background:#fffbeb; color:#92400e; }
    .status-pill.paid { background:#ecfdf5; color:#065f46; }
    .status-pill .dot { width:6px; height:6px; border-radius:50%; background:currentColor; }
    .action-group { display:flex; gap:8px; justify-content:flex-end; }
    .btn-pay { background:#6366f1; color:#fff; border:none; padding:8px 16px; border-radius:10px; font-weight:600; cursor:pointer; }
    .btn-icon-round { width:36px; height:36px; border-radius:10px; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; cursor:pointer; background:#fff; transition: 0.2s; }
    .btn-icon-round:hover { border-color: #6366f1; color: #6366f1; }
    .btn-icon-round svg { width:18px; }
    .analytics-grid { display:grid; grid-template-columns:1fr 340px; gap:24px; }
    .chart-card { background:#fff; padding:24px; border-radius:24px; border:1px solid #e2e8f0; }
    .bar-chart { height:200px; display:flex; align-items:flex-end; gap:20px; border-bottom:2px solid #f1f5f9; padding:0 20px; }
    .bar { flex:1; background:#eef2ff; border-radius:6px 6px 0 0; position:relative; }
    .bar.today { background:#6366f1; }
    .tooltip { position:absolute; top:-30px; left:50%; transform:translateX(-50%); background:#0f172a; color:#fff; font-size:11px; padding:4px 8px; border-radius:4px; opacity:0; transition:0.2s; }
    .bar:hover .tooltip { opacity:1; }
    .x-axis { display:flex; justify-content:space-between; padding:8px 20px; font-size:12px; color:#64748b; }
    .source-item { margin-top:16px; }
    .source-item label { display:block; font-size:13px; font-weight:600; margin-bottom:8px; }
    .progress-bg { background:#f1f5f9; height:8px; border-radius:4px; overflow:hidden; }
    .progress-inner { height:100%; }
    .modal-backdrop { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .modal-premium { background:#fff; width:450px; border-radius:28px; padding:32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
    .bill-details-card { background:#1e1b4b; color:#fff; padding:24px; border-radius:20px; margin-bottom:24px; }
    .b-divider { height:1px; background:rgba(255,255,255,0.1); margin:16px 0; }
    .b-row { display:flex; justify-content:space-between; font-size:14px; margin-bottom:8px; }
    .b-total { display:flex; justify-content:space-between; align-items:center; margin-top:16px; border-top:1px solid rgba(255,255,255,0.1); padding-top:16px; }
    .total-val { font-size:24px; font-weight:700; color:#10b981; }
    .method-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px; }
    .method-grid button { padding:12px; border:1px solid #e2e8f0; border-radius:12px; background:#fff; cursor:pointer; font-weight:600; transition:0.2s; }
    .method-grid button.active { border-color:#6366f1; background:#f5f3ff; color:#6366f1; }
    .confirm-btn-premium { width:100%; margin-top:24px; padding:16px; border-radius:16px; background:#6366f1; color:#fff; border:none; font-weight:700; cursor:pointer; transition:0.2s; }
    .confirm-btn-premium:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(99,102,241,0.3); }
    .confirm-btn-premium:disabled { opacity:0.6; cursor:not-allowed; }
    .animated { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* Premium Analytics Styles */
    .analytics-wrapper { display: flex; flex-direction: column; gap: 24px; }
    .summary-pills { display: flex; gap: 16px; margin-bottom: 8px; }
    .p-pill { background: #fff; border: 1px solid #e2e8f0; padding: 16px 24px; border-radius: 20px; flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .p-pill .l { font-size: 13px; color: #64748b; font-weight: 500; }
    .p-pill .v { font-size: 20px; font-weight: 700; color: #1e293b; }
    .p-pill.expense .v { color: #f43f5e; }
    .p-pill.profit { background: #f0fdf4; border-color: #bbf7d0; }
    .p-pill.profit .v { color: #10b981; }
    .p-pill.profit.loss { background: #fef2f2; border-color: #fecaca; }
    .p-pill.profit.loss .v { color: #ef4444; }

    .source-grid-premium { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 20px; }
    .s-card { background: #f8fafc; padding: 16px; border-radius: 16px; display: flex; align-items: center; gap: 16px; border: 1px solid #f1f5f9; }
    .s-icon { width: 40px; height: 40px; background: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    .s-label { display: block; font-size: 12px; color: #64748b; }
    .s-val { display: block; font-size: 16px; font-weight: 700; color: #0f172a; }

    .profit-viz { margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; }
    .viz-bar { height: 12px; background: #ecfdf5; border-radius: 100px; overflow: hidden; position: relative; margin-bottom: 12px; }
    .viz-bar .fill { height: 100%; position: absolute; left: 0; top: 0; border-radius: 100px; transition: 0.5s; }
    .viz-bar .fill.revenue { background: #10b981; opacity: 0.2; }
    .viz-bar .fill.expense { background: #f43f5e; }
    .viz-labels { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; font-weight: 500; }

    .ipd-gradient { background: linear-gradient(135deg, #0a2744 0%, #1e40af 100%); color: #fff; }
    .metric-box { padding: 24px; border-radius: 24px; display: flex; flex-direction: column; gap: 12px; }
    .metric-box.dark { background: #0f172a; color: #fff; }
    .m-head { display: flex; justify-content: space-between; align-items: flex-end; }
    .m-title { font-size: 13px; opacity: 0.8; font-weight: 500; }
    .m-stat { font-size: 20px; font-weight: 700; }
    .m-progress { height: 6px; background: rgba(255,255,255,0.1); border-radius: 100px; overflow: hidden; }
    .m-bar { height: 100%; background: #3b82f6; border-radius: 100px; }
    .m-footer { font-size: 11px; opacity: 0.7; }
    .m-val { font-size: 28px; font-weight: 700; color: #7dd3fc; }
    .m-sub { font-size: 12px; opacity: 0.6; }

    .add-expense-btn { background: #f43f5e; color: #fff; border: none; padding: 10px 18px; border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
    .add-expense-btn:hover { background: #e11d48; transform: translateY(-2px); }
    .add-expense-btn svg { width: 18px; }

    .category-chip { padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .category-chip.salary { background: #eff6ff; color: #1d4ed8; }
    .category-chip.supplies { background: #f0fdf4; color: #15803d; }
    .category-chip.utilities { background: #fff7ed; color: #c2410c; }
    .category-chip.general { background: #f1f5f9; color: #475569; }
    .price-cell.loss { color: #f43f5e; font-weight: 700; }

    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
    .form-group input, .form-group select { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px; outline: none; transition: 0.2s; }
    .form-group input:focus { border-color: #3b82f6; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  `]
})
export class FinanceDashboardComponent implements OnInit {
  private readonly config = inject(ConfigService);
  private readonly BASE_URL = this.config.baseApiUrl;
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);

  isLoading = signal(false);
  emailLoading = signal<number | null>(null);
  bills = signal<any[]>([]);
  filterStatus = signal('All');
  searchQuery = '';
  activeView = signal<'billing' | 'analytics' | 'chat' | 'expenses'>('billing');
  
  todayRevenue = signal(0);
  pendingCount = signal(0);
  paidCount = signal(0);
  
  // IPD Metrics
  occupiedBeds = signal(0);
  totalBeds = signal(0);
  ipdRevenueToday = signal(0);

  showPaymentModal = signal(false);
  showExpenseModal = signal(false);
  activeBill = signal<any>(null);
  paymentMode = 'Cash';

  // Summary State
  summary = signal<any>({
    revenueBreakdown: { Pharmacy: 0, Laboratory: 0, OPD: 0, IPD: 0 },
    todayRevenue: 0,
    monthRevenue: 0,
    monthExpenses: 0,
    netProfit: 0,
    pendingCount: 0
  });
  expenses = signal<any[]>([]);

  // New Expense Form
  newExpense = {
    description: '',
    amount: 0,
    category: 'General',
    expenseDate: new Date().toISOString().split('T')[0]
  };

  ngOnInit() { this.loadData(); }

  getHeaders() { return { Authorization: `Bearer ${this.auth.getAccessToken()}` }; }

  loadData() {
    this.isLoading.set(true);
    this.http.get<any>(`${this.BASE_URL}/api/finance/stats`, { headers: this.getHeaders() }).subscribe({
      next: res => {
        if (res.success) {
          const d = res.data;
          this.summary.set(d);
          this.todayRevenue.set(d.todayRevenue);
          this.pendingCount.set(d.pendingCount);
          this.occupiedBeds.set(d.ipdMetrics.occupiedBeds);
          this.totalBeds.set(d.ipdMetrics.totalBeds);
          this.ipdRevenueToday.set(d.ipdMetrics.ipdRevenueToday);
        }
        this.loadBills();
        this.loadExpenses();
      },
      error: () => this.loadBills()
    });
  }

  loadExpenses() {
    this.http.get<any>(`${this.BASE_URL}/api/finance/expenses`, { headers: this.getHeaders() }).subscribe({
      next: res => {
        if (res.success) this.expenses.set(res.data);
      }
    });
  }

  addExpense() {
    if (!this.newExpense.description || this.newExpense.amount <= 0) {
      this.notify.error('Please enter valid expense details.');
      return;
    }

    this.isLoading.set(true);
    this.http.post<any>(`${this.BASE_URL}/api/finance/expenses`, this.newExpense, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.notify.success('Expense recorded successfully!');
        this.showExpenseModal.set(false);
        this.newExpense = { description: '', amount: 0, category: 'General', expenseDate: new Date().toISOString().split('T')[0] };
        this.loadData();
      },
      error: () => {
        this.notify.error('Failed to record expense.');
        this.isLoading.set(false);
      }
    });
  }

  loadBills() {
    this.http.get<any>(`${this.BASE_URL}/api/finance/bills`, { headers: this.getHeaders() }).subscribe({
      next: res => {
        if (res.success) {
          this.bills.set(res.data);
          this.paidCount.set(res.data.filter((b: any) => b.status === 'Paid').length);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  filteredBills = computed(() => {
    return this.bills().filter(b => {
      const matchStatus = this.filterStatus() === 'All' || b.status === this.filterStatus();
      const matchSearch = b.patientName?.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                          b.billNumber?.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  });

  formatDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }

  openPaymentModal(bill: any) { this.activeBill.set(bill); this.paymentMode = 'Cash'; this.showPaymentModal.set(true); }

  confirmPayment() {
    if (!this.activeBill()) return;
    this.isLoading.set(true);
    this.http.patch<any>(`${this.BASE_URL}/api/finance/bills/${this.activeBill().id}/status`, 
      { status: 'Paid', paymentMode: this.paymentMode }, { headers: this.getHeaders() })
      .subscribe({
        next: () => { 
          this.showPaymentModal.set(false); 
          this.loadData(); 
          this.notify.success('Payment captured successfully!'); 
        },
        error: () => {
          this.notify.error('Failed to capture payment.');
          this.isLoading.set(false);
        }
      });
  }

  exportReports() { this.notify.success('Generating comprehensive financial report...'); }
  printBill(bill: any) { window.print(); }
  
  emailInvoice(bill: any) {
    this.emailLoading.set(bill.id);
    this.http.post<any>(`${this.BASE_URL}/api/finance/bills/${bill.id}/email`, {}, { headers: this.getHeaders() }).subscribe({
      next: () => { 
        this.emailLoading.set(null); 
        this.notify.success('Invoice emailed to patient successfully!'); 
      },
      error: () => {
        this.emailLoading.set(null);
        this.notify.error('Failed to send email.');
      }
    });
  }
}
