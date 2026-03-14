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
import { CallOverlayComponent } from './call-overlay.component';
import { CryptoService } from '../../../core/services/crypto.service';

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
  imports: [CommonModule, FormsModule, CallOverlayComponent],
  template: `
    <div class="hub-root" [class.dnd-active]="signalR.isDndActive()">
      <!-- Call Overlay -->
      <app-call-overlay
        *ngIf="showCall()"
        [callerName]="selectedUser()?.fullName || 'Colleague'"
        [callType]="callType()"
        [callerId]="selectedUserId()!"
        [isInitiator]="callInitiator()"
        (callEnded)="showCall.set(false)">
      </app-call-overlay>

      <!-- ========= SIDEBAR ========= -->
      <aside class="sidebar">
        <div class="sidebar-top">
          <div class="brand">
            <div class="brand-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div>
              <div class="brand-title">Staff Messaging</div>
              <div class="brand-sub">MediCore HMS</div>
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
                <div class="u-sub" [class.typing-text]="isTypingTo(user.id)">
                  <ng-container *ngIf="isTypingTo(user.id)">typing...</ng-container>
                  <ng-container *ngIf="!isTypingTo(user.id)">{{ isOnline(user.id) ? 'Online' : 'Offline' }}</ng-container>
                </div>
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
          <div class="ph-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h2>MediCore Staff Messaging</h2>
          <p>Select a colleague from the panel on the left to start a secure conversation</p>
          <div class="feature-pills">
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Encrypted
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2.12 2.12 0 1 1-3-3l9.19-9.19"/></svg>
              File Sharing
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>
              Video Calls
            </span>
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              DND Mode
            </span>
          </div>
        </div>

        <div *ngIf="selectedUserId()" class="chat-pane">

          <!-- Header -->
          <div class="chat-header">
            <div class="ch-avatar" [style.background]="getRoleColor(selectedUser()?.role)">
              {{ selectedUser()?.fullName?.[0] | uppercase }}
            </div>
            <div class="ch-info">
              <div class="ch-name">{{ selectedUser()?.fullName }}</div>
              <div class="ch-status" [class.online-text]="isOnline(selectedUser()?.id)">
                <ng-container *ngIf="isTypingTo(selectedUser()?.id)">typing...</ng-container>
                <ng-container *ngIf="!isTypingTo(selectedUser()?.id)">
                  {{ isOnline(selectedUser()?.id) ? 'Online' : 'Offline' }}
                </ng-container>
              </div>
            </div>
            <div class="ch-role-badge">{{ getRoleLabel(selectedUser()?.role) }}</div>
            <!-- Call buttons -->
            <button class="hdr-btn audio" (click)="startCall('audio')" title="Audio Call">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
            </button>
            <button class="hdr-btn video" (click)="startCall('video')" title="Video Call">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>
            </button>
          </div>

          <!-- Messages -->
          <div class="messages" #scrollMe>
            <div *ngIf="activeMessages().length === 0" class="msgs-empty">
              <div class="empty-bubble">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <p>No messages yet. Send a message to {{ selectedUser()?.fullName }}.</p>
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
                  <p *ngIf="msg.message">{{ getDecrypted(msg) }}</p>
                  <div class="bubble-meta">
                    <span class="bt">{{ msg.sentAt | date:'h:mm a' }}</span>
                    <span class="status-ico" *ngIf="isMine(msg)">
                      <svg viewBox="0 0 16 10" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:10px;opacity:0.8">
                        <ng-container *ngIf="msg.status === 'delivered' || msg.status === 'read'">
                          <polyline points="1,5 4,8 9,1"/>
                          <polyline points="6,5 9,8 14,1"/>
                        </ng-container>
                        <polyline *ngIf="msg.status === 'sent'" points="3,5 6,8 12,1"/>
                      </svg>
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;flex-shrink:0">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
            Do Not Disturb is ON — incoming messages are paused
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
        </div>
      </main>

      <!-- Lightbox -->
      <div class="lightbox" *ngIf="lightboxUrl" (click)="lightboxUrl = null">
        <img [src]="lightboxUrl"><div class="lb-close">✕ Close</div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    :host { display: block; height: 100%; width: 100%; overflow: hidden; }

    /* ── Root ── */
    .hub-root {
      display: flex; height: 100%; width: 100%; background: #fff; overflow: hidden;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    .hub-root.dnd-active { border: 2px solid #f59e0b; }

    /* ── Sidebar ── */
    .sidebar {
      width: 290px; flex-shrink: 0; background: #fff;
      border-right: 1px solid #e2e8f0;
      display: flex; flex-direction: column; overflow: hidden;
    }
    .sidebar-top {
      padding: 16px; display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid #f1f5f9; background: #f8fafc;
    }
    .brand { display: flex; align-items: center; gap: 10px; }    .brand-logo {
      width: 34px; height: 34px; border-radius: 8px;
      background: linear-gradient(135deg,#1d4ed8,#3b82f6);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .brand-logo svg { width: 18px; height: 18px; stroke: #fff; }
    .brand-title { font-size: 13px; font-weight: 700; color: #0f172a; }
    .brand-sub { font-size: 10px; color: #94a3b8; letter-spacing: 0.5px; text-transform: uppercase; }

    .dnd-btn {
      display: flex; align-items: center; gap: 5px; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0;
      background: #fff; color: #64748b; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.2s;
    }
    .dnd-btn svg { width: 14px; height: 14px; }
    .dnd-btn:hover { border-color: #f59e0b; color: #f59e0b; background: #fffbeb; }
    .dnd-btn.on { background: #fffbeb; border-color: #f59e0b; color: #d97706; }

    .search-wrap { position: relative; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    .search-ico { position: absolute; left: 24px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; color: #94a3b8; }
    .search-input {
      width: 100%; padding: 9px 9px 9px 34px; background: #f8fafc; border: 1px solid #e2e8f0;
      border-radius: 8px; color: #1e293b; font-size: 13px; outline: none; box-sizing: border-box; font-family: inherit;
    }
    .search-input:focus { border-color: #3b82f6; background: #fff; }
    .search-input::placeholder { color: #94a3b8; }

    .user-list { flex: 1; overflow-y: auto; padding-bottom: 10px; }
    .user-list::-webkit-scrollbar { width: 4px; }
    .user-list::-webkit-scrollbar-track { background: transparent; }
    .user-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }

    .dept-label {
      font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
      color: #94a3b8; padding: 14px 14px 5px; border-top: 1px solid #f1f5f9; margin-top: 4px;
    }

    .user-row {
      display: flex; align-items: center; gap: 10px; padding: 9px 12px;
      cursor: pointer; transition: all 0.15s; border-left: 3px solid transparent;
    }
    .user-row:hover { background: #f8fafc; }
    .user-row.active { background: #eff6ff; border-left-color: #2563eb; }

    .u-avatar {
      width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; position: relative;
      display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #fff;
    }
    .presence-dot {
      position: absolute; bottom: -2px; right: -2px; width: 10px; height: 10px; border-radius: 50%;
      background: #cbd5e1; border: 2px solid #fff;
    }
    .presence-dot.online { background: #22c55e; }

    .u-info { flex: 1; min-width: 0; }
    .u-name { font-size: 13px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .u-sub { font-size: 11px; color: #94a3b8; margin-top: 1px; }
    .typing-text { color: #3b82f6; font-weight: 600; }
    .unread-pill { background: #ef4444; color: #fff; border-radius: 10px; font-size: 10px; font-weight: 700; min-width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; padding: 0 4px; flex-shrink: 0; }

    .empty-list { display: flex; align-items: center; gap: 10px; padding: 24px 18px; color: #94a3b8; font-size: 13px; }
    .spin { width: 18px; height: 18px; border: 2px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Chat Main ── */
    .chat-main {
      flex: 1; min-width: 0; display: flex; flex-direction: column; background: #fff;
      height: 100%; max-height: 100%; overflow: hidden;
    }
    /* The pane that wraps header + messages + input when a user is selected */
    .chat-pane {
      flex: 1; display: flex; flex-direction: column; height: 100%; width: 100%; overflow: hidden;
    }

    .placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px; text-align: center; padding: 40px; }
    .ph-icon { width: 80px; height: 80px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .ph-icon svg { width: 40px; height: 40px; stroke: #2563eb; }
    .placeholder h2 { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; }
    .placeholder p { font-size: 15px; color: #64748b; margin: 0; max-width: 400px; line-height: 1.6; }
    .feature-pills { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
    .feature-pills span { display: flex; align-items: center; gap: 5px; background: #fff; color: #1e293b; border: 1px solid #e2e8f0; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 500; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .feature-pills span svg { width: 13px; height: 13px; flex-shrink: 0; }

    /* Chat header */
    .chat-header {
      padding: 14px 20px; background: #fff; border-bottom: 1px solid #e2e8f0;
      display: flex; align-items: center; gap: 12px; flex-shrink: 0; z-index: 5;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .ch-avatar { width: 42px; height: 42px; border-radius: 10px; color: #fff; font-weight: 700; font-size: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ch-info { flex: 1; }
    .ch-name { font-size: 15px; font-weight: 700; color: #0f172a; }
    .ch-status { font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 4px; margin-top: 1px; }
    .ch-status.online-text { color: #16a34a; font-weight: 600; }
    .ch-status.online-text::before { content: ''; display: inline-block; width: 6px; height: 6px; background: #22c55e; border-radius: 50%; }
    .ch-role-badge { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; flex-shrink: 0; letter-spacing: 0.3px; text-transform: uppercase; }
    /* Call buttons in header */
    .hdr-btn { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; background: #f8fafc; }
    .hdr-btn svg { width: 17px; height: 17px; }
    .hdr-btn.audio { color: #16a34a; }
    .hdr-btn.audio:hover { background: #16a34a; color: #fff; border-color: #16a34a; }
    .hdr-btn.video { color: #2563eb; }
    .hdr-btn.video:hover { background: #2563eb; color: #fff; border-color: #2563eb; }

    /* Messages area */
    .messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 6px; }
    .messages::-webkit-scrollbar { width: 4px; }
    .messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }

    .msgs-empty { display: flex; align-items: center; justify-content: center; flex: 1; }
    .empty-bubble { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px 36px; text-align: center; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
    .empty-bubble svg { width: 36px; height: 36px; stroke: #cbd5e1; display: block; margin: 0 auto 12px; }
    .empty-bubble p { margin: 0; color: #94a3b8; font-size: 14px; }

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
      padding: 16px 20px; background: #fff; border-top: 1px solid #f1f5f9;
      display: flex; gap: 12px; align-items: center; flex-shrink: 0;
      box-shadow: 0 -4px 10px rgba(0,0,0,0.02);
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
  private crypto = inject(CryptoService);

  /** Async decryption cache: msgKey → plaintext */
  decryptedTexts = signal<Map<number | string, string>>(new Map());

  availableUsers = signal<any[]>([]);
  selectedUserId = signal<string | null>(null);
  selectedUser = signal<any | null>(null);
  newMessage = '';
  searchQuery = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  lightboxUrl: string | null = null;
  isSending = signal(false);
  showCall = signal(false);
  callType = signal<'video' | 'audio'>('video');
  callInitiator = signal(false);
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

  /**
   * Returns decrypted text for a message.
   * If it starts with ENC: it's patient↔doctor encrypted — decrypt it async.
   * For all other messages (staff↔staff), they're plaintext.
   */
  getDecrypted(msg: ChatMessage): string {
    if (!msg.message?.startsWith('ENC:')) return msg.message ?? '';
    const key = msg.id ?? msg.sentAt.toString();
    const cache = this.decryptedTexts();
    if (cache.has(key)) return cache.get(key)!;
    const myId = String(this.auth.currentUser()?.id);
    // The other userId is whoever is NOT me
    const otherId = String(msg.fromUserId) === myId ? String(msg.toUserId) : String(msg.fromUserId);
    this.crypto.decrypt(msg.message, myId, otherId).then(plain => {
      this.decryptedTexts.update(m => { const n = new Map(m); n.set(key, plain); return n; });
    });
    return '⋯ Decrypting...';
  }

  constructor() {
    this.loadStaff();
    effect(() => { this.activeMessages(); this.scrollToBottom(); });
    // Listen for incoming calls
    this.signalR.onWebRtcEvent('IncomingCall', (from: string, type: string) => {
      if (this.selectedUserId() && String(from) === String(this.selectedUserId())) {
        this.callType.set(type as 'video' | 'audio');
        this.callInitiator.set(false);
        this.showCall.set(true);
      }
    });
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

  startCall(type: 'video' | 'audio') {
    if (!this.selectedUserId()) return;
    this.callType.set(type);
    this.callInitiator.set(true);
    this.showCall.set(true);
    this.signalR.sendCallRequest(this.selectedUserId()!, type);
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
