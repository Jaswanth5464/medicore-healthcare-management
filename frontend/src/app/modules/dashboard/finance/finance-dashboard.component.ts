/**
 * This file (FinanceDashboardComponent) is the main screen for the Hospital Admin and Finance Staff.
 * It provides a "Birds-eye view" of the entire hospital's financial health.
 * 
 * Major Features:
 * 1. KPI Cards: Shows total invoices, pending payments, and successful collections.
 * 2. Revenue Breakdown: Shows exactly how much money is coming from Pharmacy, Lab, OPD, and IPD.
 * 3. Bed Occupancy: Shows a real-time progress bar of how many beds are currently in use.
 * 4. Invoicing Center: A searchable list of all bills where staff can collect payments from patients.
 */
import { Component, OnInit, signal, inject, computed } from '@angular/core';
// This component (FinanceDashboard) is the main screen for the hospital's financial analytics.
// It shows Today's Revenue, Pending Bills, and a breakdown of income from different departments.
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
          <button class="seed-btn" (click)="seedData()" *ngIf="totalBeds() === 0" [disabled]="isLoading()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
            {{ isLoading() ? 'Syncing...' : 'Synchronize System' }}
          </button>
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
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;700;800&display=swap');
    :host { display: block; background: var(--bg-main); min-height: 100vh; font-family: 'DM Sans', sans-serif; padding: 32px; color: #0f172a; animation: fadeIn 0.4s ease-out; }
    
    .finance-dash { max-width: 1600px; margin: 0 auto; }
    
    .header-premium { display:flex; justify-content:space-between; align-items:center; margin-bottom:40px; }
    .header-main h1 { font-size:32px; font-weight:800; color:var(--primary); margin:0; letter-spacing: -0.5px; }
    .header-main p { color:#64748b; font-size:16px; margin:4px 0 0 0; font-weight: 500; }
    
    .header-actions { display: flex; align-items: center; gap: 16px; }
    .revenue-chip { background:var(--card-bg); padding:12px 24px; border-radius:100px; border:1px solid var(--glass-border); display:flex; align-items:center; gap:12px; backdrop-filter: var(--glass-blur); box-shadow: var(--shadow-md); }
    .revenue-chip .dot { width:8px; height:8px; background:var(--accent); border-radius:50%; box-shadow: 0 0 10px var(--accent); }
    .revenue-chip .label { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
    .revenue-chip .value { font-size:20px; font-weight:800; color:var(--accent); }
    
    .export-btn { background:var(--primary-gradient); color:#fff; border:none; padding:12px 24px; border-radius:14px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:10px; box-shadow: 0 10px 20px rgba(10, 39, 68, 0.15); transition: 0.3s; }
    .export-btn:hover { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 15px 30px rgba(10, 39, 68, 0.2); }
    .export-btn svg { width:18px; }

    .seed-btn { background: #f59e0b; color: #fff; border: none; padding: 12px 20px; border-radius: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2); transition: 0.3s; }
    .seed-btn:hover:not(:disabled) { background: #d97706; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(245, 158, 11, 0.3); }
    .seed-btn svg { width: 18px; }

    .kpi-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:24px; margin-bottom:40px; }
    .kpi-card { background:var(--card-bg); padding:28px; border-radius:var(--radius-md); border:1px solid var(--glass-border); cursor:pointer; display:flex; align-items:center; gap:20px; transition:0.3s cubic-bezier(0.16, 1, 0.3, 1); backdrop-filter: var(--glass-blur); box-shadow: var(--shadow-md); }
    .kpi-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-lg); border-color: var(--primary-light); }
    .kpi-card.active { border-color:var(--primary); background: rgba(10, 39, 68, 0.02); }
    
    .kpi-icon { width:56px; height:56px; border-radius:16px; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .kpi-icon.total { background:var(--primary-gradient); color:#fff; }
    .kpi-icon.pending { background:#fffbeb; color:#f59e0b; border: 1px solid #fef3c7; }
    .kpi-icon.success { background:#ecfdf5; color:var(--accent); border: 1px solid #d1fae5; }
    .kpi-icon.promo { background:#f1f5f9; color:#475569; }
    .kpi-icon svg { width:24px; height:24px; }
    
    .kpi-val { display:block; font-size:28px; font-weight:800; color: #0f172a; margin-bottom: 2px; }
    .kpi-lbl { display:block; font-size:12px; font-weight: 700; color:#64748b; text-transform: uppercase; letter-spacing: 0.5px; }

    .billing-tabs { display:flex; gap:12px; margin-bottom:32px; background:#e2e8f0; padding:6px; border-radius:16px; width:fit-content; }
    .billing-tabs button { border:none; padding:12px 24px; border-radius:12px; background:transparent; font-weight:700; color:#64748b; cursor:pointer; display:flex; align-items:center; gap:10px; transition: 0.2s; }
    .billing-tabs button.active { background:#fff; color:var(--primary); box-shadow:var(--shadow-sm); }
    .billing-tabs button svg { width: 18px; }

    .billing-content { background:var(--card-bg); border-radius:var(--radius-lg); border:1px solid var(--glass-border); overflow:hidden; backdrop-filter: var(--glass-blur); box-shadow: var(--shadow-lg); }
    .content-header { padding:28px 32px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; }
    .content-header h3 { font-size:20px; font-weight:800; color:var(--primary); margin:0; }
    
    .content-filters { display:flex; gap:16px; }
    .search-box { position:relative; }
    .search-box input { padding:12px 16px 12px 42px; border:1.5px solid #e2e8f0; border-radius:14px; min-width:280px; outline:none; font-family: inherit; font-size: 14px; transition: 0.2s; }
    .search-box input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(10, 39, 68, 0.05); }
    .search-box svg { position:absolute; left:14px; top:50%; transform:translateY(-50%); width:18px; color:#94a3b8; }
    
    .content-filters select { padding: 12px 16px; border-radius: 14px; border: 1.5px solid #e2e8f0; font-family: inherit; font-weight: 600; color: #475569; outline: none; cursor: pointer; }

    .billing-table-wrapper { overflow-x: auto; }
    table { width:100%; border-collapse:collapse; }
    th { text-align:left; padding:18px 32px; background:#f8fafc; font-size:11px; color:#64748b; text-transform:uppercase; font-weight: 800; letter-spacing: 0.5px; border-bottom: 1px solid #f1f5f9; }
    td { padding:24px 32px; border-bottom:1px solid #f1f5f9; vertical-align: middle; }
    
    .bill-badge { font-family: 'DM Mono', monospace; font-weight:800; color:var(--primary); background:rgba(10, 39, 68, 0.05); padding:6px 10px; border-radius:8px; font-size: 13px; }
    .p-name { display: block; font-weight: 800; color: #0f172a; font-size: 15px; }
    .p-sub { font-size: 12px; color: #64748b; font-weight: 600; }
    
    .d-dept { font-weight: 700; color: var(--primary); font-size: 13px; padding: 4px 10px; background: #f1f5f9; border-radius: 6px; }
    .price-cell { font-size: 18px; font-weight: 800; color: #0f172a; }

    .status-pill { display:inline-flex; align-items:center; gap:8px; padding:8px 16px; border-radius:100px; font-size:12px; font-weight:800; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-pill.unpaid { background:#fffbeb; color:#b45309; border: 1px solid #fef3c7; }
    .status-pill.paid { background:#ecfdf5; color:var(--accent); border: 1px solid #d1fae5; }
    .status-pill .dot { width:6px; height:6px; border-radius:50%; background:currentColor; }
    
    .method-tag { font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
    
    .action-group { display:flex; gap:10px; justify-content:flex-end; }
    .btn-pay { background:var(--primary-gradient); color:#fff; border:none; padding:10px 20px; border-radius:10px; font-weight:700; cursor:pointer; box-shadow: 0 4px 12px rgba(10, 39, 68, 0.1); transition: 0.2s; }
    .btn-pay:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(10, 39, 68, 0.2); }
    
    .btn-icon-round { width:42px; height:42px; border-radius:12px; border:1.5px solid #e2e8f0; display:flex; align-items:center; justify-content:center; cursor:pointer; background:#fff; color: #64748b; transition: 0.2s; }
    .btn-icon-round:hover { border-color: var(--primary); color: var(--primary); background: #f8fafc; }
    .btn-icon-round svg { width:20px; }

    /* Analytics Styles */
    .analytics-wrapper { animation: fadeInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    .summary-pills { display: flex; gap: 24px; margin-bottom: 24px; }
    .p-pill { background: #fff; border: 1.5px solid #f1f5f9; padding: 24px; border-radius: 24px; flex: 1; display: flex; flex-direction: column; gap: 8px; box-shadow: var(--shadow-sm); }
    .p-pill .l { font-size: 13px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .p-pill .v { font-size: 26px; font-weight: 900; color: #0f172a; }
    .p-pill.expense .v { color: var(--danger); }
    .p-pill.profit { background: #f0fdf4; border-color: #d1fae5; }
    .p-pill.profit .v { color: var(--accent); }

    .analytics-grid { display:grid; grid-template-columns:1fr 380px; gap:24px; }
    .chart-card { background:#fff; padding:32px; border-radius:24px; border:1px solid #f1f5f9; box-shadow: var(--shadow-md); }
    .card-head h4 { font-size: 18px; font-weight: 800; color: var(--primary); margin: 0 0 24px 0; }
    
    .source-grid-premium { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
    .s-card { background: #f8fafc; padding: 20px; border-radius: 20px; display: flex; align-items: center; gap: 16px; border: 1px solid #f1f5f9; transition: transform 0.2s; }
    .s-card:hover { transform: translateY(-4px); border-color: var(--primary-light); }
    .s-icon { width: 48px; height: 48px; background: #fff; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    .s-info { display: flex; flex-direction: column; }
    .s-label { font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; }
    .s-val { font-size: 18px; font-weight: 800; color: #0f172a; }

    .profit-viz { margin-top: 32px; padding-top: 32px; border-top: 1px dashed #e2e8f0; }
    .viz-bar { height: 16px; background: #f1f5f9; border-radius: 100px; overflow: hidden; position: relative; margin-bottom: 16px; }
    .viz-bar .fill { height: 100%; position: absolute; left: 0; top: 0; border-radius: 100px; transition: 1s cubic-bezier(0.16, 1, 0.3, 1); }
    .viz-bar .fill.revenue { background: var(--accent); opacity: 0.1; width: 100% !important; }
    .viz-bar .fill.expense { background: var(--danger); }
    .viz-labels { display: flex; justify-content: space-between; font-size: 13px; color: #64748b; font-weight: 700; }

    .side-metrics { display: flex; flex-direction: column; gap: 24px; }
    .metric-box { padding: 32px; border-radius: 28px; display: flex; flex-direction: column; gap: 16px; box-shadow: var(--shadow-lg); }
    .ipd-gradient { background: var(--primary-gradient); color: #fff; }
    .metric-box.dark { background: #0f172a; color: #fff; }
    
    .m-head { display: flex; justify-content: space-between; align-items: flex-end; }
    .m-title { font-size: 14px; opacity: 0.8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .m-stat { font-size: 24px; font-weight: 900; color: #fff; }
    .m-progress { height: 8px; background: rgba(255,255,255,0.1); border-radius: 100px; overflow: hidden; }
    .m-bar { height: 100%; background: #fff; border-radius: 100px; box-shadow: 0 0 10px rgba(255,255,255,0.5); }
    .m-footer { font-size: 12px; opacity: 0.7; font-weight: 500; }
    .m-val { font-size: 32px; font-weight: 900; color: #7dd3fc; letter-spacing: -0.5px; }
    .m-sub { font-size: 13px; opacity: 0.6; font-weight: 500; }

    .add-expense-btn { background: var(--danger); color: #fff; border: none; padding: 12px 24px; border-radius: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.2s; box-shadow: 0 8px 16px rgba(239, 68, 68, 0.2); }
    .add-expense-btn:hover { background: #dc2626; transform: translateY(-2px); box-shadow: 0 12px 24px rgba(239, 68, 68, 0.3); }

    .category-chip { padding: 6px 12px; border-radius: 100px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .category-chip.salary { background: #eff6ff; color: #1d4ed8; }
    .category-chip.supplies { background: #f0fdf4; color: #15803d; }
    .category-chip.utilities { background: #fff7ed; color: #c2410c; }
    .category-chip.general { background: #f1f5f9; color: #475569; }

    .modal-backdrop { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15, 23, 42, 0.4); backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center; z-index:1000; animation: fadeIn 0.2s ease-out; }
    .modal-premium { background:#fff; width:100%; max-width: 500px; border-radius:32px; padding:40px; box-shadow: 0 30px 60px rgba(0,0,0,0.15); animation: fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .modal-header h3 { font-size: 22px; font-weight: 800; color: var(--primary); margin: 0; }
    .close-btn { background: rgba(0,0,0,0.05); border: none; font-size: 24px; color: #64748b; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; transition: 0.2s; }
    .close-btn:hover { background: rgba(0,0,0,0.1); color: #0f172a; transform: rotate(90deg); }

    .bill-details-card { background:var(--primary-gradient); color:#fff; padding:32px; border-radius:24px; margin-bottom:32px; box-shadow: 0 12px 24px rgba(10, 39, 68, 0.2); }
    .b-divider { height:1px; background:rgba(255,255,255,0.1); margin:20px 0; }
    .b-row { display:flex; justify-content:space-between; font-size:15px; margin-bottom:12px; }
    .b-row span { opacity: 0.8; font-weight: 500; }
    .b-row strong { font-weight: 800; font-family: 'DM Mono', monospace; }
    
    .b-total { display:flex; justify-content:space-between; align-items:center; margin-top:20px; border-top:1px solid rgba(255,255,255,0.1); padding-top:20px; }
    .total-lbl { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; }
    .total-val { font-size:32px; font-weight:900; color:#fff; }

    .payment-selection label { display: block; font-size: 14px; font-weight: 800; color: var(--primary); margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
    .method-grid { display:grid; grid-template-columns: repeat(2, 1fr); gap:16px; margin-top:12px; }
    .method-grid button { padding:16px; border:2px solid #f1f5f9; border-radius:16px; background:#fff; cursor:pointer; font-weight:800; color: #64748b; transition:0.2s; }
    .method-grid button:hover { border-color: #e2e8f0; color: #1e293b; }
    .method-grid button.active { border-color:var(--primary); background: rgba(10, 39, 68, 0.02); color:var(--primary); box-shadow: var(--shadow-sm); }
    
    .confirm-btn-premium { width:100%; margin-top:32px; padding:20px; border-radius:18px; background:var(--primary-gradient); color:#fff; border:none; font-weight:800; font-size: 16px; cursor:pointer; transition:0.3s; box-shadow: 0 10px 20px rgba(10, 39, 68, 0.2); }
    .confirm-btn-premium:hover:not(:disabled) { transform: translateY(-3px); filter: brightness(1.1); box-shadow: 0 15px 30px rgba(10, 39, 68, 0.3); }

    .form-group label { display: block; font-size: 13px; font-weight: 800; color: #64748b; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-group input, .form-group select { width: 100%; padding: 14px 18px; border: 1.5px solid #e2e8f0; border-radius: 14px; outline: none; font-family: inherit; font-size: 14px; transition: 0.2s; background: #fff; }
    .form-group input:focus { border-color: var(--primary); background: #fff; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    
    @keyframes fadeInScale { from { opacity: 0; transform: scale(0.97) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
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

  // This function fetches all financial data from the backend.
  // It updates the cards at the top of the dashboard.
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

  seedData() {
    this.isLoading.set(true);
    this.http.post<any>(`${this.BASE_URL}/api/finance/seed-data`, {}, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        if (res.success) {
          this.notify.success('Project data synchronized and seeded successfully!');
          this.loadData();
        }
      },
      error: (err) => {
        this.notify.error(err.error?.message || 'Synchronization failed.');
        this.isLoading.set(false);
      }
    });
  }
}
