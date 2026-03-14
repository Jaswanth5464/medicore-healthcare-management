import {
  Component, signal, computed, inject, effect,
  ElementRef, ViewChild, AfterViewChecked, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { SignalRService, ChatMessage } from '../../../core/services/signalr.service';
import { ConfigService } from '../../../core/services/config.service';

const DEPT_ORDER: Record<string, number> = {
  Doctor: 1, Nurse: 2, Receptionist: 3, LabTechnician: 4,
  Pharmacist: 5, Finance: 6, HospitalAdmin: 7, SuperAdmin: 7
};

const ROLE_LABEL: Record<string, string> = {
  Doctor: 'Doctor', Nurse: 'Nurse', Receptionist: 'Receptionist',
  LabTechnician: 'Lab Tech', Pharmacist: 'Pharmacist',
  Finance: 'Finance', HospitalAdmin: 'Admin', SuperAdmin: 'Super Admin',
  Patient: 'Patient'
};

const ROLE_COLOR: Record<string, string> = {
  Doctor: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
  Nurse: 'linear-gradient(135deg,#0891b2,#0e7490)',
  Receptionist: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
  LabTechnician: 'linear-gradient(135deg,#d97706,#b45309)',
  Pharmacist: 'linear-gradient(135deg,#059669,#047857)',
  Finance: 'linear-gradient(135deg,#dc2626,#b91c1c)',
  HospitalAdmin: 'linear-gradient(135deg,#1e293b,#334155)',
  SuperAdmin: 'linear-gradient(135deg,#1e293b,#334155)',
  Patient: 'linear-gradient(135deg,#64748b,#475569)',
};

@Component({
  selector: 'app-hospital-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="hub-root" [class.dnd-active]="signalR.isDndActive()">

      <!-- ========= SIDEBAR ========= -->
      <aside class="sidebar">
        <div class="sidebar-top">
          <div class="brand">
            <span class="brand-icon">🏥</span>
            <div>
              <div class="brand-title">Clinical Comms</div>
              <div class="brand-sub">MediCore Hub</div>
            </div>
          </div>

          <!-- DND Toggle -->
          <button class="dnd-btn" (click)="signalR.toggleDnd()" [class.on]="signalR.isDndActive()" [title]="signalR.isDndActive() ? 'DND On – click to disable' : 'Enable Do Not Disturb'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
            <span>{{ signalR.isDndActive() ? 'DND On' : 'DND' }}</span>
          </button>
        </div>

        <!-- Search -->
        <div class="search-wrap">
          <svg class="search-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search staff..." class="search-input">
        </div>

        <!-- Department grouped user list -->
        <div class="user-list">
          <ng-container *ngFor="let dept of deptGroups()">
            <div class="dept-label">{{ dept.label }}</div>
            <div *ngFor="let user of dept.users"
                 class="user-row"
                 [class.active]="selectedUserId() === user.id"
                 (click)="selectUser(user)">
              <div class="u-avatar" [style.background]="getRoleColor(user.role)">
                <span>{{ user.fullName[0] | uppercase }}</span>
                <span class="presence-dot" [class.online]="isOnline(user.id)"></span>
              </div>
              <div class="u-info">
                <div class="u-name">{{ user.fullName }}</div>
                <div class="u-sub">{{ isTypingTo(user.id) ? '✏️ typing...' : (isOnline(user.id) ? 'Online' : 'Offline') }}</div>
              </div>
              <span *ngIf="getUnread(user.id) > 0" class="unread-pill">{{ getUnread(user.id) }}</span>
            </div>
          </ng-container>
          <div *ngIf="availableUsers().length === 0" class="empty-list">
            <div class="spin"></div>Loading staff...
          </div>
        </div>
      </aside>

      <!-- ========= CHAT MAIN ========= -->
      <main class="chat-main">

        <!-- No selection placeholder -->
        <div *ngIf="!selectedUserId()" class="placeholder">
          <div class="ph-icon">💬</div>
          <h2>MediCore Clinical Communication Hub</h2>
          <p>Select a colleague from the left panel to start a conversation</p>
          <div class="feature-pills">
            <span>✅ Secure</span><span>📎 Media</span><span>🔔 Notifications</span><span>🚫 DND Mode</span>
          </div>
        </div>

        <ng-container *ngIf="selectedUserId()">

          <!-- Header -->
          <div class="chat-header">
            <div class="ch-avatar" [style.background]="getRoleColor(selectedUser()?.role)">
              {{ selectedUser()?.fullName?.[0] | uppercase }}
            </div>
            <div class="ch-info">
              <div class="ch-name">{{ selectedUser()?.fullName }}</div>
              <div class="ch-status" [class.online-text]="isOnline(selectedUser()?.id)">
                {{ isTypingTo(selectedUser()?.id) ? '✏️ typing...' : (isOnline(selectedUser()?.id) ? '● Online' : '○ Offline') }}
              </div>
            </div>
            <div class="ch-role-badge">{{ getRoleLabel(selectedUser()?.role) }}</div>
          </div>

          <!-- Messages -->
          <div class="messages" #scrollMe>
            <div *ngIf="activeMessages().length === 0" class="msgs-empty">
              <div class="empty-bubble">
                <span>👋</span>
                <p>Say hello to {{ selectedUser()?.fullName }}!</p>
              </div>
            </div>

            <!-- Date separator logic via tracking -->
            <ng-container *ngFor="let msg of activeMessages(); let i = index">
              <div *ngIf="showDateSep(msg, i)" class="date-sep">
                <span>{{ msg.sentAt | date:'EEEE, MMM d' }}</span>
              </div>
              <div class="msg-row" [class.sent]="isMine(msg)">
                <div class="msg-avatar" *ngIf="!isMine(msg)" [style.background]="getRoleColor(selectedUser()?.role)">
                  {{ selectedUser()?.fullName?.[0] | uppercase }}
                </div>
                <div class="bubble" [class.sent]="isMine(msg)">
                  <img *ngIf="msg.imageUrl" [src]="msg.imageUrl" class="bubble-img" (click)="lightboxUrl = msg.imageUrl!" />
                  <p *ngIf="msg.message">{{ msg.message }}</p>
                  <div class="bubble-meta">
                    <span class="bt">{{ msg.sentAt | date:'h:mm a' }}</span>
                    <span class="status-ico" *ngIf="isMine(msg)" [title]="msg.status">
                      {{ msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : '✓' }}
                    </span>
                  </div>
                </div>
              </div>
            </ng-container>

            <!-- Typing indicator -->
            <div *ngIf="isTypingTo(selectedUserId())" class="typing-indicator">
              <div class="typing-dots"><span></span><span></span><span></span></div>
              <span>{{ selectedUser()?.fullName }} is typing...</span>
            </div>
          </div>

          <!-- Image preview strip -->
          <div class="img-preview" *ngIf="previewUrl">
            <img [src]="previewUrl">
            <button (click)="clearFile()">✕</button>
          </div>

          <!-- DND banner -->
          <div *ngIf="signalR.isDndActive()" class="dnd-banner">
            🚫 Do Not Disturb is ON – incoming messages are muted
            <button (click)="signalR.toggleDnd()">Disable</button>
          </div>

          <!-- Input bar -->
          <div class="input-bar">
            <input type="file" #fi (change)="onFile($event)" accept="image/*,application/pdf" style="display:none">
            <button class="icon-act" (click)="fi.click()" title="Attach file or image">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2.12 2.12 0 1 1-3-3l9.19-9.19"/>
              </svg>
            </button>
            <input class="msg-input"
                   type="text"
                   [(ngModel)]="newMessage"
                   (keyup.enter)="send()"
                   (keyup)="sendTyping()"
                   placeholder="Type a message..."
                   [disabled]="isSending()">
            <button class="send-act" (click)="send()" [disabled]="(!newMessage.trim() && !selectedFile) || isSending()">
              <ng-container *ngIf="!isSending(); else spinner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </ng-container>
              <ng-template #spinner><div class="spin-sm"></div></ng-template>
            </button>
          </div>
        </ng-container>
      </main>

      <!-- Lightbox -->
      <div class="lightbox" *ngIf="lightboxUrl" (click)="lightboxUrl = null">
        <img [src]="lightboxUrl"><div class="lb-close">✕ Close</div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    :host { display: flex; height: 100%; font-family: 'Inter', sans-serif; }

    /* ── Root ── */
    .hub-root {
      display: flex; width: 100%; height: calc(100vh - 140px); min-height: 600px;
      border-radius: 18px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0; background: #fff;
    }
    .hub-root.dnd-active { border: 2px solid #f59e0b; }

    /* ── Sidebar ── */
    .sidebar {
      width: 300px; flex-shrink: 0; background: #0f172a; color: #e2e8f0;
      display: flex; flex-direction: column; overflow: hidden;
    }
    .sidebar-top { padding: 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon { font-size: 24px; }
    .brand-title { font-size: 13px; font-weight: 700; color: #f1f5f9; }
    .brand-sub { font-size: 10px; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; }

    .dnd-btn {
      display: flex; align-items: center; gap: 5px; padding: 6px 10px; border-radius: 10px; border: 1px solid #334155;
      background: transparent; color: #94a3b8; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.2s;
    }
    .dnd-btn svg { width: 14px; height: 14px; }
    .dnd-btn:hover { border-color: #f59e0b; color: #f59e0b; }
    .dnd-btn.on { background: #f59e0b22; border-color: #f59e0b; color: #fbbf24; }

    .search-wrap { position: relative; padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .search-ico { position: absolute; left: 26px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #475569; }
    .search-input { width: 100%; padding: 10px 10px 10px 36px; background: #1e293b; border: 1px solid #334155; border-radius: 12px; color: #e2e8f0; font-size: 13px; outline: none; box-sizing: border-box; }
    .search-input:focus { border-color: #3b82f6; }
    .search-input::placeholder { color: #475569; }

    .user-list { flex: 1; overflow-y: auto; padding-bottom: 10px; }
    .user-list::-webkit-scrollbar { width: 4px; }
    .user-list::-webkit-scrollbar-track { background: transparent; }
    .user-list::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

    .dept-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #475569; padding: 16px 16px 6px; }

    .user-row {
      display: flex; align-items: center; gap: 10px; padding: 10px 14px;
      cursor: pointer; transition: all 0.18s; border-left: 3px solid transparent; position: relative;
    }
    .user-row:hover { background: rgba(255,255,255,0.04); }
    .user-row.active { background: rgba(59,130,246,0.12); border-left-color: #3b82f6; }

    .u-avatar {
      width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0; position: relative;
      display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #fff;
    }
    .presence-dot {
      position: absolute; bottom: 1px; right: 1px; width: 10px; height: 10px; border-radius: 50%;
      background: #475569; border: 2px solid #0f172a;
    }
    .presence-dot.online { background: #22c55e; }

    .u-info { flex: 1; min-width: 0; }
    .u-name { font-size: 13px; font-weight: 600; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .u-sub { font-size: 11px; color: #64748b; margin-top: 1px; }
    .unread-pill { background: #ef4444; color: #fff; border-radius: 10px; font-size: 10px; font-weight: 700; min-width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; padding: 0 4px; flex-shrink: 0; }

    .empty-list { display: flex; align-items: center; gap: 10px; padding: 24px 18px; color: #475569; font-size: 13px; }
    .spin { width: 18px; height: 18px; border: 2px solid #334155; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Chat Main ── */
    .chat-main {
      flex: 1; min-width: 0; display: flex; flex-direction: column; background: #f8fafc;
      background-image: radial-gradient(circle, #e2e8f0 1px, transparent 1px); background-size: 22px 22px;
    }

    .placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px; text-align: center; padding: 40px; }
    .ph-icon { font-size: 80px; filter: grayscale(1) opacity(0.2); }
    .placeholder h2 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0; }
    .placeholder p { font-size: 14px; color: #64748b; margin: 0; }
    .feature-pills { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
    .feature-pills span { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }

    /* Chat header */
    .chat-header {
      padding: 14px 20px; background: #fff; border-bottom: 1px solid #e2e8f0;
      display: flex; align-items: center; gap: 14px; flex-shrink: 0; z-index: 5;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }
    .ch-avatar { width: 42px; height: 42px; border-radius: 50%; color: #fff; font-weight: 700; font-size: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ch-info { flex: 1; }
    .ch-name { font-size: 16px; font-weight: 700; color: #0f172a; }
    .ch-status { font-size: 12px; color: #64748b; }
    .ch-status.online-text { color: #22c55e; font-weight: 600; }
    .ch-role-badge { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; flex-shrink: 0; }

    /* Messages area */
    .messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 8px; }
    .messages::-webkit-scrollbar { width: 4px; }
    .messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }

    .msgs-empty { display: flex; align-items: center; justify-content: center; flex: 1; }
    .empty-bubble { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 20px 32px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .empty-bubble span { font-size: 40px; }
    .empty-bubble p { margin: 8px 0 0; color: #64748b; font-size: 14px; }

    /* Date separator */
    .date-sep { display: flex; align-items: center; gap: 10px; margin: 12px 0; }
    .date-sep::before, .date-sep::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }
    .date-sep span { font-size: 11px; color: #94a3b8; font-weight: 600; white-space: nowrap; background: #f8fafc; padding: 2px 8px; border-radius: 20px; border: 1px solid #e2e8f0; }

    /* Message rows */
    .msg-row { display: flex; align-items: flex-end; gap: 8px; max-width: 75%; animation: fadeMsg 0.22s ease; }
    @keyframes fadeMsg { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
    .msg-row { align-self: flex-start; }
    .msg-row.sent { align-self: flex-end; flex-direction: row-reverse; }
    .msg-avatar { width: 28px; height: 28px; border-radius: 50%; color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

    .bubble {
      padding: 10px 16px; border-radius: 18px; max-width: 100%; word-break: break-word;
      font-size: 14px; line-height: 1.55;
    }
    .bubble:not(.sent) { background: #fff; color: #1e293b; border-bottom-left-radius: 4px; border: 1px solid #e2e8f0; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
    .bubble.sent { background: #2563eb; color: #fff; border-bottom-right-radius: 4px; box-shadow: 0 2px 8px rgba(37,99,235,0.18); }
    .bubble p { margin: 0; }
    .bubble-img { max-width: 220px; max-height: 200px; border-radius: 10px; margin-bottom: 6px; display: block; cursor: zoom-in; object-fit: contain; }
    .bubble-meta { display: flex; align-items: center; justify-content: flex-end; gap: 4px; margin-top: 5px; }
    .bt { font-size: 10px; opacity: 0.65; }
    .status-ico { font-size: 11px; opacity: 0.9; }

    /* Typing indicator */
    .typing-indicator { display: flex; align-items: center; gap: 8px; padding: 4px 0; margin-top: 4px; }
    .typing-dots { display: flex; gap: 4px; }
    .typing-dots span { width: 7px; height: 7px; background: #94a3b8; border-radius: 50%; animation: bounce 1.4s ease-in-out infinite; }
    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { 0%, 60%, 100% { transform: none; opacity: 0.4; } 30% { transform: translateY(-6px); opacity: 1; } }
    .typing-indicator span { font-size: 12px; color: #64748b; }

    /* Image preview */
    .img-preview { padding: 10px 20px; background: #fff; border-top: 1px solid #f1f5f9; display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .img-preview img { height: 56px; border-radius: 8px; border: 1px solid #e2e8f0; object-fit: cover; }
    .img-preview button { background: #fee2e2; color: #dc2626; border: none; border-radius: 8px; padding: 5px 10px; font-size: 12px; font-weight: 600; cursor: pointer; }

    /* DND banner */
    .dnd-banner { background: #fef3c7; border-top: 1px solid #fde68a; padding: 8px 20px; font-size: 13px; color: #92400e; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    .dnd-banner button { background: #f59e0b; color: #fff; border: none; padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; }

    /* Input bar */
    .input-bar {
      padding: 14px 20px; background: #fff; border-top: 1px solid #e2e8f0;
      display: flex; gap: 10px; align-items: center; flex-shrink: 0; z-index: 5;
    }
    .msg-input {
      flex: 1; padding: 12px 18px; border: 1.5px solid #e2e8f0; border-radius: 24px;
      font-size: 14px; outline: none; background: #f8fafc; transition: all 0.2s; font-family: inherit;
    }
    .msg-input:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 4px rgba(37,99,235,0.08); }
    .msg-input:disabled { opacity: 0.5; }

    .icon-act {
      width: 44px; height: 44px; border-radius: 50%; background: #f1f5f9; border: none; color: #475569;
      cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0;
    }
    .icon-act:hover { background: #eff6ff; color: #2563eb; }
    .icon-act svg { width: 20px; height: 20px; }

    .send-act {
      width: 48px; height: 48px; border-radius: 50%; background: #2563eb; color: #fff; border: none;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.2s; box-shadow: 0 4px 12px rgba(37,99,235,0.25); flex-shrink: 0;
    }
    .send-act:hover:not(:disabled) { background: #1d4ed8; transform: scale(1.06); }
    .send-act:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; background: #94a3b8; transform: none; }
    .send-act svg { width: 20px; height: 20px; margin-left: -2px; }

    .spin-sm { width: 20px; height: 20px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }

    /* Lightbox */
    .lightbox {
      position: fixed; inset: 0; background: rgba(0,0,0,0.88); display: flex; flex-direction: column;
      align-items: center; justify-content: center; z-index: 9999; cursor: zoom-out; gap: 14px;
    }
    .lightbox img { max-width: 90vw; max-height: 82vh; border-radius: 12px; object-fit: contain; }
    .lb-close { color: rgba(255,255,255,0.7); font-size: 14px; }
  `]
})
export class HospitalChatComponent implements AfterViewChecked, OnDestroy {
  @ViewChild('scrollMe') private scrollContainer!: ElementRef;

  private http = inject(HttpClient);
  readonly auth = inject(AuthService);
  readonly signalR = inject(SignalRService);
  private config = inject(ConfigService);

  availableUsers = signal<any[]>([]);
  selectedUserId = signal<string | null>(null);
  selectedUser = signal<any | null>(null);
  newMessage = '';
  searchQuery = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  lightboxUrl: string | null = null;
  isSending = signal(false);
  private typingTimeout: any = null;

  /** Department-grouped users after search */
  deptGroups = computed(() => {
    const q = this.searchQuery.toLowerCase();
    const users = q
      ? this.availableUsers().filter(u => u.fullName?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q))
      : this.availableUsers();

    const map = new Map<string, any[]>();
    for (const u of users) {
      const key = u.role || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(u);
    }

    return [...map.entries()]
      .sort((a, b) => (DEPT_ORDER[a[0]] ?? 99) - (DEPT_ORDER[b[0]] ?? 99))
      .map(([role, users]) => ({ label: ROLE_LABEL[role] || role, users }));
  });

  /** Messages for the active conversation */
  activeMessages = computed(() => {
    const selId = this.selectedUserId();
    const meId = String(this.auth.currentUser()?.id);
    if (!selId) return [];
    return this.signalR.chatMessages().filter(m =>
      (String(m.fromUserId) === String(selId) && String(m.toUserId) === meId) ||
      (String(m.fromUserId) === meId && String(m.toUserId) === String(selId))
    ).sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  });

  constructor() {
    this.loadStaff();
    effect(() => { this.activeMessages(); this.scrollToBottom(); });
  }

  ngAfterViewChecked() { this.scrollToBottom(); }
  ngOnDestroy() { clearTimeout(this.typingTimeout); }

  loadStaff() {
    this.http.get<any>(`${this.config.baseApiUrl}/api/chat/users`, {
      headers: { Authorization: `Bearer ${this.auth.getAccessToken()}` }
    }).subscribe({
      next: r => { if (r.success) this.availableUsers.set(r.data); },
      error: e => console.error('Failed to load staff', e)
    });
  }

  selectUser(user: any) {
    this.selectedUserId.set(user.id);
    this.selectedUser.set(user);
    this.signalR.activeChatPartner.set(user.id);
    this.loadHistory(user.id);
  }

  loadHistory(toUserId: string) {
    this.http.get<any>(`${this.config.baseApiUrl}/api/chat/recent?withUserId=${toUserId}`, {
      headers: { Authorization: `Bearer ${this.auth.getAccessToken()}` }
    }).subscribe(r => {
      if (r.success && r.data?.length) {
        const existing = this.signalR.chatMessages();
        const existingIds = new Set(existing.map((e: any) => e.id).filter(Boolean));
        const fresh = r.data.filter((m: any) => !m.id || !existingIds.has(m.id));
        this.signalR.chatMessages.set([...existing, ...fresh]);
      }
    });
  }

  async send() {
    if ((!this.newMessage.trim() && !this.selectedFile) || !this.selectedUserId()) return;

    let imageUrl: string | undefined;
    if (this.selectedFile) {
      imageUrl = await this.toDataUrl(this.selectedFile);
      this.selectedFile = null; this.previewUrl = null;
    }

    const msg = this.newMessage;
    this.isSending.set(true);
    try {
      await this.signalR.sendChatMessage(this.selectedUserId()!, msg, imageUrl);
      this.signalR.chatMessages.update(ms => [...ms, {
        id: Date.now(),
        fromUserId: String(this.auth.currentUser()?.id),
        toUserId: String(this.selectedUserId()!),
        message: msg,
        imageUrl,
        sentAt: new Date(),
        status: 'sent' as const
      }]);
      this.newMessage = '';
    } catch (e) {
      console.error('Send failed', e);
    } finally {
      this.isSending.set(false);
    }
  }

  sendTyping() {
    if (!this.selectedUserId()) return;
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.signalR.sendTypingIndicator(this.selectedUserId()!);
    }, 400);
  }

  onFile(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => { this.previewUrl = reader.result as string; };
    reader.readAsDataURL(file);
  }

  clearFile() { this.selectedFile = null; this.previewUrl = null; }

  getUnread(userId: string): number {
    const me = String(this.auth.currentUser()?.id);
    return this.signalR.chatMessages().filter(m =>
      String(m.fromUserId) === String(userId) && String(m.toUserId) === me && !(m as any).read
    ).length;
  }

  isOnline(userId: any): boolean { return this.signalR.isUserOnline(String(userId)); }

  isTypingTo(userId: any): boolean {
    return String(this.signalR.typingUserId()) === String(userId) && !!userId;
  }

  getRoleColor(role: string): string { return ROLE_COLOR[role] || 'linear-gradient(135deg,#475569,#334155)'; }
  getRoleLabel(role: string): string { return ROLE_LABEL[role] || role; }

  isMine(msg: ChatMessage) { return String(msg.fromUserId) === String(this.auth.currentUser()?.id); }

  showDateSep(msg: ChatMessage, i: number): boolean {
    if (i === 0) return true;
    const prev = this.activeMessages()[i - 1];
    return new Date(msg.sentAt).toDateString() !== new Date(prev.sentAt).toDateString();
  }

  private toDataUrl(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  private scrollToBottom() {
    try { this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight; }
    catch {}
  }
}
