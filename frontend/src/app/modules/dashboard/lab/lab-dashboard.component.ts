import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfigService } from '../../../core/services/config.service';
import { AuthService } from '../../../core/services/auth.service';
import { HospitalChatComponent } from '../../communication/chat/hospital-chat.component';

@Component({
  selector: 'app-lab-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HospitalChatComponent],
  template: `
    <div class="lab-container">
      <!-- Premium Header -->
      <header class="lab-header">
        <div class="header-content">
          <div class="brand">
            <div class="brand-icon">🔬</div>
            <div class="brand-text">
              <h1>Diagnostics Center</h1>
              <p>Precision Medical Laboratory Information System</p>
            </div>
          </div>
          <div class="header-actions">
            <div class="live-status">
              <span class="pulse-dot"></span>
              <span class="status-text">System Live</span>
            </div>
            <button class="btn-refresh" (click)="loadQueue()" [class.spinning]="isLoading()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-tile total">
          <div class="tile-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
          <div class="tile-data">
            <span class="value">{{ stats().totalOrders }}</span>
            <span class="label">Total Orders</span>
          </div>
        </div>
        <div class="stat-tile pending">
          <div class="tile-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div class="tile-data">
            <span class="value">{{ stats().pending }}</span>
            <span class="label">Pending Samples</span>
          </div>
        </div>
        <div class="stat-tile processing">
          <div class="tile-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></div>
          <div class="tile-data">
            <span class="value">{{ stats().processing }}</span>
            <span class="label">In Processing</span>
          </div>
        </div>
        <div class="stat-tile revenue">
          <div class="tile-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>
          <div class="tile-data">
            <span class="value">₹{{ stats().revenue }}</span>
            <span class="label">Lab Revenue</span>
          </div>
        </div>
      </div>

      <!-- Main Navigation -->
      <nav class="lab-nav">
        <button [class.active]="activeTab() === 'queue'" (click)="activeTab.set('queue')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
          Active Orders
        </button>
        <button [class.active]="activeTab() === 'tests'" (click)="activeTab.set('tests')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          Test Management
        </button>
        <button [class.active]="activeTab() === 'chat'" (click)="activeTab.set('chat')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Lab Communications
        </button>
      </nav>

      <!-- Content Area -->
      <main class="lab-content animated fadeIn">
        
        <!-- ACTIVE QUEUE -->
        <div *ngIf="activeTab() === 'queue'" class="queue-container">
          <div class="content-header">
            <h3>Workflow Queue</h3>
            <div class="filters">
              <input type="text" placeholder="Search patient or test..." [(ngModel)]="searchQuery">
              <select [(ngModel)]="statusFilter">
                <option value="All">All Statuses</option>
                <option value="Requested">New Requests</option>
                <option value="Pending">Waiting for Payment</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div class="table-frame">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Patient</th>
                  <th>Prescribed Test</th>
                  <th>Priority</th>
                  <th>Payment</th>
                  <th>Workflow Status</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let order of filteredQueue()" class="order-row">
                  <td><span class="order-id">#ORD-{{ order.id }}</span><br><span class="time">{{ order.createdAt | date:'shortTime' }}</span></td>
                  <td>
                    <div class="p-info">
                      <span class="p-name">{{ order.patientName }}</span>
                      <span class="p-meta">Age: {{ order.patientAge || 'N/A' }} | {{ order.patientGender || 'Gen' }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="test-info">
                      <span class="test-name">{{ order.testType }}</span>
                      <span class="doc-name">Dr. {{ order.doctorName }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="priority-pill" [class]="(order.priority || 'Regular').toLowerCase()">
                      {{ order.priority || 'Regular' }}
                    </span>
                  </td>
                  <td>
                    <span class="pay-chip" [class.paid]="order.isPaid" [class.pending]="!order.isPaid">
                      {{ order.isPaid ? 'PAID' : 'DUE ₹' + order.price }}
                    </span>
                  </td>
                  <td>
                    <div class="status-indicator">
                      <span class="status-dot" [class]="order.status.toLowerCase()"></span>
                      <span class="status-text">{{ order.status }}</span>
                    </div>
                  </td>
                  <td style="text-align: right;">
                    <div class="action-btns">
                      <button *ngIf="order.status === 'Requested' || order.status === 'Pending'" 
                              class="btn-collect" 
                              (click)="collectSample(order)"
                              [disabled]="!order.isPaid && order.status !== 'Requested'">
                        Collect Sample
                      </button>
                      <button *ngIf="order.status === 'Processing'" 
                              class="btn-complete" 
                              (click)="openUploadModal(order)">
                        Add Results
                      </button>
                      <button *ngIf="order.status === 'Completed'" 
                              class="btn-view" 
                              (click)="viewReport(order.reportUrl)">
                        Report
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="filteredQueue().length === 0">
                  <td colspan="7" class="empty-msg">No active orders found matching filters.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TEST REGISTRY -->
        <div *ngIf="activeTab() === 'tests'" class="registry-container animated slideUp">
          <div class="content-header">
            <h3>Test Master Catalog</h3>
            <button class="btn-add-test" (click)="showNewTestForm.set(true)">+ New Test Spec</button>
          </div>
          
          <div class="registry-grid">
            <div *ngFor="let test of testMasters()" class="test-card">
              <div class="test-card-head">
                <code>{{ test.testCode }}</code>
                <span class="test-price">₹{{ test.price }}</span>
              </div>
              <h4>{{ test.testName }}</h4>
              <div class="test-details">
                <div class="detail"><span>Ref:</span> <strong>{{ test.normalRange || 'Varies' }}</strong></div>
                <div class="detail"><span>TAT:</span> <strong>{{ test.turnaroundTimeHours }}h</strong></div>
              </div>
            </div>
          </div>
        </div>

        <!-- CHAT -->
        <div *ngIf="activeTab() === 'chat'" class="chat-wrapper">
          <app-hospital-chat></app-hospital-chat>
        </div>

      </main>

      <!-- Results Modal -->
      <div class="modal-overlay" *ngIf="selectedOrder()">
        <div class="modal-card">
          <div class="modal-head">
            <h3>Diagnostic Results Entry</h3>
            <button class="btn-close" (click)="selectedOrder.set(null)">&times;</button>
          </div>
          <div class="modal-body">
            <div class="order-summary-box">
              <div class="os-col"><span>Patient:</span> <strong>{{ selectedOrder()?.patientName }}</strong></div>
              <div class="os-col"><span>Test:</span> <strong>{{ selectedOrder()?.testType }}</strong></div>
            </div>

            <div class="results-table-container">
              <table>
                <thead>
                  <tr>
                    <th>Parameter (Unit)</th>
                    <th>Result Value</th>
                    <th>Reference Range</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let res of labResults(); let i = index">
                    <td><input [(ngModel)]="res.parameter" placeholder="e.g. Platelets (10^3/uL)"></td>
                    <td><input [(ngModel)]="res.value" class="val-input" placeholder="Value"></td>
                    <td><input [(ngModel)]="res.normalRange" placeholder="e.g. 150 - 450"></td>
                    <td><button (click)="removeResultRow(i)" class="btn-del">&times;</button></td>
                  </tr>
                </tbody>
              </table>
              <button class="btn-add-row" (click)="addResultRow()">+ Add Parameter</button>
            </div>

            <div class="notes-area">
              <label>Interpretation & Notes</label>
              <textarea [(ngModel)]="uploadData.resultNotes" rows="3" placeholder="Clinical findings and remarks..."></textarea>
            </div>

            <div class="critical-flag">
              <input type="checkbox" id="crit-val" [(ngModel)]="uploadData.isCritical">
              <label for="crit-val">MARK AS CRITICAL (Sends immediate alert to Doctor)</label>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn-cancel" (click)="selectedOrder.set(null)">Discard</button>
            <button class="btn-submit" (click)="submitReport()" [disabled]="isUploading()">
              {{ isUploading() ? 'Processing...' : 'Confirm & Publish Report' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
    :host { display:block; height:100vh; overflow:hidden; font-family:'Outfit',sans-serif; background:#f0f2f5; }
    .lab-container { height:100vh; display:flex; flex-direction:column; padding:24px; box-sizing:border-box; }
    
    .lab-header { background:#fff; border-radius:24px; padding:20px 32px; box-shadow:0 4px 20px rgba(0,0,0,0.03); margin-bottom:24px; }
    .header-content { display:flex; justify-content:space-between; align-items:center; }
    .brand { display:flex; align-items:center; gap:16px; }
    .brand-icon { width:56px; height:56px; background:#e0e7ff; border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:32px; }
    .brand-text h1 { margin:0; font-size:24px; color:#1e1b4b; font-weight:700; }
    .brand-text p { margin:2px 0 0 0; color:#64748b; font-size:14px; }
    
    .header-actions { display:flex; align-items:center; gap:20px; }
    .live-status { display:flex; align-items:center; gap:8px; background:#f0fdf4; padding:8px 16px; border-radius:100px; }
    .pulse-dot { width:8px; height:8px; background:#10b981; border-radius:50%; animation:pulse 2s infinite; }
    .status-text { color:#166534; font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }

    .stats-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:20px; margin-bottom:24px; }
    .stat-tile { background:#fff; padding:24px; border-radius:24px; display:flex; align-items:center; gap:20px; border:1px solid #e2e8f0; transition:0.3s; }
    .stat-tile:hover { transform:translateY(-4px); box-shadow:0 12px 24px rgba(0,0,0,0.05); }
    .tile-icon { width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center; color:#fff; }
    .stat-tile.total .tile-icon { background:#6366f1; }
    .stat-tile.pending .tile-icon { background:#f59e0b; }
    .stat-tile.processing .tile-icon { background:#8b5cf6; }
    .stat-tile.revenue .tile-icon { background:#10b981; }
    .tile-data .value { display:block; font-size:28px; font-weight:700; color:#1e1b4b; line-height:1; }
    .tile-data .label { display:block; font-size:13px; color:#64748b; font-weight:500; margin-top:4px; }

    .lab-nav { display:flex; gap:12px; margin-bottom:24px; background:#fff; padding:8px; border-radius:16px; width:fit-content; }
    .lab-nav button { border:none; padding:12px 24px; border-radius:12px; background:transparent; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:10px; color:#64748b; transition:0.2s; }
    .lab-nav button svg { width:20px; }
    .lab-nav button.active { background:#1e1b4b; color:#fff; }

    .lab-content { flex:1; background:#fff; border-radius:24px; border:1px solid #e2e8f0; display:flex; flex-direction:column; overflow:hidden; }
    .content-header { padding:24px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; }
    .content-header h3 { margin:0; font-size:20px; color:#1e1b4b; }
    .filters { display:flex; gap:12px; }
    .filters input { padding:10px 16px; border:1px solid #e2e8f0; border-radius:12px; width:300px; font-size:14px; }
    .filters select { padding:10px 16px; border:1px solid #e2e8f0; border-radius:12px; font-size:14px; background:#f8fafc; }

    .table-frame { flex:1; overflow-y:auto; }
    table { width:100%; border-collapse:collapse; }
    th { text-align:left; padding:16px 24px; background:#f8fafc; font-size:12px; color:#64748b; text-transform:uppercase; letter-spacing:1px; position:sticky; top:0; z-index:10; }
    td { padding:16px 24px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
    .order-id { font-family:monospace; font-weight:700; color:#6366f1; background:#f5f3ff; padding:4px 8px; border-radius:6px; font-size:13px; }
    .time { font-size:12px; color:#94a3b8; }
    .p-name { display:block; font-weight:600; color:#1e1b4b; }
    .p-meta { font-size:12px; color:#64748b; }
    .test-name { display:block; font-weight:600; color:#4338ca; }
    .doc-name { font-size:11px; color:#94a3b8; text-transform:uppercase; }
    
    .priority-pill { font-size:11px; font-weight:700; padding:4px 10px; border-radius:100px; text-transform:uppercase; }
    .priority-pill.stat { background:#fee2e2; color:#dc2626; border:1px solid #fecaca; }
    .priority-pill.urgent { background:#fef3c7; color:#d97706; }
    .priority-pill.regular { background:#f1f5f9; color:#64748b; }

    .pay-chip { font-size:11px; font-weight:700; padding:4px 10px; border-radius:6px; }
    .pay-chip.paid { background:#dcfce7; color:#166534; }
    .pay-chip.pending { background:#f1f5f9; color:#dc2626; }

    .status-indicator { display:flex; align-items:center; gap:8px; }
    .status-dot { width:8px; height:8px; border-radius:50%; }
    .status-dot.requested { background:#6366f1; box-shadow:0 0 8px #6366f1; }
    .status-dot.processing { background:#f59e0b; box-shadow:0 0 8px #f59e0b; }
    .status-dot.completed { background:#10b981; }
    .status-text { font-size:13px; font-weight:600; color:#1e1b4b; text-transform:capitalize; }

    .action-btns button { padding:8px 16px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; transition:0.2s; border:none; }
    .btn-collect { background:#1e1b4b; color:#fff; }
    .btn-collect:disabled { opacity:0.5; cursor:not-allowed; }
    .btn-complete { background:#8b5cf6; color:#fff; }
    .btn-view { background:#f1f5f9; color:#1e1b4b; }

    /* Modal Styling */
    .modal-overlay { position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.6); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .modal-card { background:#fff; width:600px; border-radius:32px; box-shadow:0 30px 60px -12px rgba(0,0,0,0.3); overflow:hidden; animation:slideUp 0.4s ease; }
    .modal-head { padding:24px 32px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; }
    .modal-head h3 { margin:0; font-size:22px; font-weight:700; color:#1e1b4b; }
    .btn-close { background:none; border:none; font-size:32px; color:#94a3b8; cursor:pointer; }
    .modal-body { padding:32px; }
    .order-summary-box { background:#f5f3ff; padding:20px; border-radius:20px; display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px; border:1px solid #e0e7ff; }
    .os-col span { display:block; font-size:12px; color:#6366f1; text-transform:uppercase; font-weight:600; }
    .os-col strong { display:block; font-size:18px; color:#1e1b4b; margin-top:4px; }

    .results-table-container { margin-bottom:24px; }
    .results-table-container table { width:100%; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; margin-bottom:12px; }
    .results-table-container th { background:#f8fafc; color:#64748b; font-size:11px; padding:12px; }
    .results-table-container td { padding:8px; border-bottom:1px solid #f1f5f9; }
    .results-table-container input { width:100%; border:1px solid #e2e8f0; padding:8px; border-radius:8px; font-size:13px; transition:0.2s; }
    .results-table-container input:focus { border-color:#6366f1; outline:none; background:#f5f3ff; }
    .val-input { font-weight:700; color:#1e1b4b; background:#f0f9ff !important; border-color:#bae6fd !important; }
    .btn-del { border:none; background:#fee2e2; color:#dc2626; width:28px; height:28px; border-radius:50%; cursor:pointer; }
    .btn-add-row { background:#f1f5f9; color:#6366f1; border:none; padding:8px 16px; border-radius:8px; font-weight:600; cursor:pointer; font-size:12px; }

    .notes-area label { display:block; font-size:12px; font-weight:700; text-transform:uppercase; color:#64748b; margin-bottom:8px; }
    .notes-area textarea { width:100%; border:1px solid #e2e8f0; border-radius:12px; padding:12px; font-family:inherit; font-size:14px; resize:none; }
    .critical-flag { margin-top:20px; background:#fef2f2; padding:16px; border-radius:12px; display:flex; align-items:center; gap:12px; border:1px solid #fecaca; }
    .critical-flag input { width:20px; height:20px; accent-color:#dc2626; }
    .critical-flag label { font-size:13px; font-weight:700; color:#dc2626; }

    .modal-foot { padding:24px 32px; background:#f8fafc; display:flex; justify-content:flex-end; gap:16px; }
    .btn-cancel { background:none; border:none; font-weight:600; color:#64748b; cursor:pointer; }
    .btn-submit { background:#1e1b4b; color:#fff; border:none; padding:12px 32px; border-radius:14px; font-weight:700; cursor:pointer; box-shadow:0 10px 15px -3px rgba(30,27,75,0.2); }

    .registry-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:20px; padding:24px; overflow-y:auto; flex:1; }
    .test-card { background:#fff; border:1px solid #e2e8f0; border-radius:20px; padding:20px; transition:0.3s; }
    .test-card:hover { border-color:#6366f1; transform:translateY(-2px); }
    .test-card-head { display:flex; justify-content:space-between; margin-bottom:12px; }
    .test-card-head code { background:#f1f5f9; color:#475569; padding:4px 8px; border-radius:6px; font-size:12px; }
    .test-price { font-weight:700; color:#10b981; }
    .test-card h4 { margin:0 0 16px 0; color:#1e1b4b; font-size:16px; }
    .test-details { display:grid; grid-template-columns:1fr 1fr; gap:10px; border-top:1px dashed #f1f5f9; pt-12px; margin-top:12px; padding-top:12px; }
    .detail span { display:block; font-size:11px; color:#94a3b8; text-transform:uppercase; }
    .detail strong { font-size:13px; color:#475569; }

    @keyframes pulse { 0% { opacity:1; } 50% { opacity:0.4; } 100% { opacity:1; } }
    @keyframes slideUp { from { transform:translateY(30px); opacity:0; } to { transform:translateY(0); opacity:1; } }
    .animated { animation-duration:0.4s; animation-fill-mode:both; }
    .fadeIn { animation-name:fadeIn; }
    .slideUp { animation-name:slideUp; }
    .spinning { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LabDashboardComponent implements OnInit {
  private readonly config = inject(ConfigService);
  private readonly BASE_URL = this.config.baseApiUrl;
  private http = inject(HttpClient);
  private ns = inject(NotificationService);
  private auth = inject(AuthService);

  activeTab = signal<'queue' | 'tests' | 'chat'>('queue');
  isLoading = signal(false);
  isUploading = signal(false);
  queue = signal<any[]>([]);
  stats = signal<any>({ totalOrders: 0, pending: 0, processing: 0, completed: 0, revenue: 0 });
  testMasters = signal<any[]>([]);
  
  // Filtering
  searchQuery = '';
  statusFilter = 'All';

  // Results State
  selectedOrder = signal<any>(null);
  labResults = signal<any[]>([]);
  uploadData = { reportPdfUrl: '', resultNotes: '', isCritical: false, resultsJson: '' };
  showNewTestForm = signal(false);

  ngOnInit() {
    this.loadQueue();
    this.loadStats();
    this.loadTestMasters();
  }

  getHeaders() { return { Authorization: `Bearer ${this.auth.getAccessToken()}` }; }

  loadQueue() {
    this.isLoading.set(true);
    this.http.get<any>(`${this.BASE_URL}/api/laboratory/orders`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.queue.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadStats() {
    this.http.get<any>(`${this.BASE_URL}/api/laboratory/stats`, { headers: this.getHeaders() }).subscribe(res => {
      if (res.success) this.stats.set(res.data);
    });
  }

  loadTestMasters() {
    this.http.get<any>(`${this.BASE_URL}/api/laboratory/tests`, { headers: this.getHeaders() }).subscribe(res => {
      if (res.success) this.testMasters.set(res.data);
    });
  }

  filteredQueue() {
    return this.queue().filter(item => {
      const matchStatus = this.statusFilter === 'All' || item.status === this.statusFilter;
      const matchSearch = item.patientName?.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                          item.testType?.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }

  collectSample(order: any) {
    this.http.patch<any>(`${this.BASE_URL}/api/laboratory/orders/${order.id}/collect`, {}, { headers: this.getHeaders() }).subscribe(res => {
      if (res.success) {
        this.ns.success('Sample collected successfully. Order moved to processing.');
        this.loadQueue();
        this.loadStats();
      }
    });
  }

  openUploadModal(order: any) {
    this.selectedOrder.set(order);
    this.labResults.set([{ parameter: '', value: '', unit: '', normalRange: order.referenceRange || '' }]);
    this.uploadData = { reportPdfUrl: 'https://demo-report-url.pdf', resultNotes: '', isCritical: false, resultsJson: '' };
  }

  addResultRow() {
    this.labResults.update(r => [...r, { parameter: '', value: '', unit: '', normalRange: '' }]);
  }

  removeResultRow(index: number) {
    this.labResults.update(r => r.filter((_, i) => i !== index));
  }

  submitReport() {
    if (!this.selectedOrder()) return;
    this.isUploading.set(true);
    const payload = {
      ...this.uploadData,
      resultsJson: JSON.stringify(this.labResults())
    };

    this.http.post<any>(`${this.BASE_URL}/api/laboratory/orders/${this.selectedOrder().id}/complete`, payload, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.isUploading.set(false);
        this.selectedOrder.set(null);
        this.ns.success('Report published and synchronized with Patient Record.');
        this.loadQueue();
        this.loadStats();
      },
      error: () => this.isUploading.set(false)
    });
  }

  viewReport(url: string) {
    if (url) window.open(url, '_blank');
    else this.ns.info('No PDF report generated yet.');
  }
}