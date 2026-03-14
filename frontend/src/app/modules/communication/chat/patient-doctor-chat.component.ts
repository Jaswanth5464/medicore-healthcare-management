import { Component, signal, computed, inject, effect, ElementRef, ViewChild, AfterViewChecked, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { SignalRService, ChatMessage } from '../../../core/services/signalr.service';
import { ConfigService } from '../../../core/services/config.service';
import { CryptoService } from '../../../core/services/crypto.service';
import { CallOverlayComponent } from './call-overlay.component';

@Component({
  selector: 'app-patient-doctor-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, CallOverlayComponent],
  template: `
    <div class="chat-wrapper" [class.mini]="isMini">
      <!-- Active Call Overlay -->
      <app-call-overlay
        *ngIf="showCall()"
        [callerName]="otherUserName"
        [callType]="callType()"
        [callerId]="otherUserId"
        [isInitiator]="callInitiator()"
        (callEnded)="showCall.set(false)">
      </app-call-overlay>

      <div class="chat-header">
        <div class="user-info">
          <div class="avatar">{{ otherUserName[0] | uppercase }}</div>
          <div>
            <h4>{{ otherUserName }}</h4>
            <span class="status">● Online</span>
          </div>
        </div>
        <div class="header-actions">
          <!-- Audio call -->
          <button class="call-btn audio" (click)="startCall('audio')" title="Audio Call">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
          </button>
          <!-- Video call -->
          <button class="call-btn video" (click)="startCall('video')" title="Video Call">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
          </button>
          <!-- 🔒 Encrypted badge -->
          <span class="enc-badge" title="Messages are end-to-end encrypted">🔒 E2E</span>
          <button class="close-btn" (click)="close.emit()" title="Close">✕</button>
        </div>
      </div>

      <div class="messages-area" #scrollMe>
        <div *ngIf="activeMessages().length === 0" class="no-messages">
          <p>No messages yet. Say hello 👋</p>
        </div>
        <div *ngFor="let msg of activeMessages()"
             class="message-wrapper"
             [class.sent]="isSentByMe(msg)">
          <div class="message-bubble">
            <img *ngIf="msg.imageUrl" [src]="msg.imageUrl" class="chat-img" (click)="lightboxUrl = msg.imageUrl!" />
            <p *ngIf="msg.message">{{ msg.message }}</p>
            <span class="message-time">{{ msg.sentAt | date:'shortTime' }}</span>
          </div>
        </div>
      </div>

      <!-- Image preview before send -->
      <div *ngIf="previewUrl" class="image-preview">
        <img [src]="previewUrl" />
        <button (click)="clearFile()">✕ Remove</button>
      </div>

      <div class="chat-input-area">
        <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/*" style="display:none">
        <button class="icon-btn" (click)="fileInput.click()" title="Attach image">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2.12 2.12 0 1 1-3-3l9.19-9.19"/>
          </svg>
        </button>
        <input type="text"
               [(ngModel)]="newMessage"
               (keyup.enter)="sendMessage()"
               placeholder="Type a message..."
               [disabled]="isUploading()">
        <button class="send-btn" (click)="sendMessage()" [disabled]="(!newMessage.trim() && !selectedFile) || isUploading()">
          <ng-container *ngIf="!isUploading(); else loading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </ng-container>
          <ng-template #loading>
            <div class="loader-sm"></div>
          </ng-template>
        </button>
      </div>
    </div>

    <!-- Image lightbox -->
    <div class="lightbox" *ngIf="lightboxUrl" (click)="lightboxUrl = null">
      <img [src]="lightboxUrl">
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    :host { display: block; font-family: 'Inter', sans-serif; }

    .chat-wrapper {
      display: flex; flex-direction: column; height: 520px; width: 100%;
      background: #f0f4ff; background-image: radial-gradient(#dbeafe 1px, transparent 1px); background-size: 20px 20px;
      border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.12); border: 1px solid #e2e8f0;
    }
    .chat-wrapper.mini { height: 400px; }

    .chat-header {
      padding: 16px 20px; background: #fff; border-bottom: 1px solid #e2e8f0;
      display: flex; justify-content: space-between; align-items: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04); z-index: 10; flex-shrink: 0;
    }
    .user-info { display: flex; align-items: center; gap: 12px; }
    .avatar {
      width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px;
      box-shadow: 0 2px 6px rgba(99,102,241,0.25);
    }
    .chat-header h4 { font-size: 15px; margin: 0; color: #0f172a; font-weight: 700; }
    .status { font-size: 12px; color: #10b981; font-weight: 600; }
    .close-btn { background: none; border: none; font-size: 18px; color: #64748b; cursor: pointer; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .close-btn:hover { background: #f1f5f9; color: #0f172a; }

    .messages-area { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; }

    .no-messages { display: flex; align-items: center; justify-content: center; height: 100%; }
    .no-messages p { background: rgba(255,255,255,0.8); padding: 12px 24px; border-radius: 20px; font-size: 14px; color: #64748b; border: 1px solid #e2e8f0; }

    .message-wrapper { display: flex; flex-direction: column; max-width: 78%; animation: fadeMsg 0.25s ease; }
    @keyframes fadeMsg { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .message-wrapper { align-self: flex-start; }
    .message-wrapper.sent { align-self: flex-end; }

    .message-bubble { padding: 11px 16px; border-radius: 18px; position: relative; font-size: 14px; line-height: 1.55; }
    .message-wrapper:not(.sent) .message-bubble { background: #fff; color: #1e293b; border-bottom-left-radius: 4px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .sent .message-bubble { background: #6366f1; color: #fff; border-bottom-right-radius: 4px; box-shadow: 0 2px 8px rgba(99,102,241,0.2); }

    .message-bubble p { margin: 0; word-break: break-word; }
    .message-time { font-size: 11px; margin-top: 5px; display: block; text-align: right; }
    .message-wrapper:not(.sent) .message-time { color: #94a3b8; }
    .sent .message-time { color: rgba(255,255,255,0.65); }

    .chat-img { max-width: 100%; max-height: 200px; border-radius: 10px; margin-bottom: 6px; display: block; cursor: zoom-in; object-fit: contain; }

    .image-preview { padding: 8px 20px; background: #fff; border-top: 1px solid #e2e8f0; display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .image-preview img { height: 55px; border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0; }
    .image-preview button { background: #fee2e2; color: #dc2626; border: none; border-radius: 8px; padding: 6px 10px; font-size: 12px; font-weight: 600; cursor: pointer; }

    .chat-input-area { padding: 14px 20px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; align-items: center; background: #fff; flex-shrink: 0; z-index: 10; }
    .chat-input-area input[type="text"] { flex: 1; padding: 11px 16px; border: 1.5px solid #e2e8f0; border-radius: 24px; font-size: 14px; outline: none; background: #f8fafc; transition: all 0.2s; }
    .chat-input-area input:focus { border-color: #6366f1; background: #fff; box-shadow: 0 0 0 4px rgba(99,102,241,0.1); }
    .chat-input-area input:disabled { opacity: 0.5; }

    .icon-btn { width: 40px; height: 40px; border-radius: 50%; background: #f1f5f9; border: none; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
    .icon-btn:hover { background: #e2e8f0; color: #6366f1; }
    .icon-btn svg { width: 19px; height: 19px; }

    .send-btn { width: 44px; height: 44px; border-radius: 50%; background: #6366f1; color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 4px 12px rgba(99,102,241,0.2); flex-shrink: 0; }
    .send-btn:hover:not(:disabled) { background: #4f46e5; transform: scale(1.05); }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; background: #94a3b8; transform: none; }
    .send-btn svg { width: 18px; height: 18px; margin-left: -2px; }

    .loader-sm { width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 9999; cursor: zoom-out; }
    .lightbox img { max-width: 90vw; max-height: 90vh; border-radius: 12px; object-fit: contain; }

    /* Call buttons & security badge */
    .header-actions { display: flex; align-items: center; gap: 8px; }
    .call-btn { width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
    .call-btn.audio { background: #dcfce7; color: #16a34a; }
    .call-btn.audio:hover { background: #16a34a; color: #fff; transform: scale(1.08); }
    .call-btn.video { background: #eff6ff; color: #2563eb; }
    .call-btn.video:hover { background: #2563eb; color: #fff; transform: scale(1.08); }
    .call-btn svg { width: 18px; height: 18px; }
    .enc-badge { font-size: 11px; font-weight: 700; color: #16a34a; background: #dcfce7; padding: 3px 8px; border-radius: 10px; white-space: nowrap; }
  `]
})
export class PatientDoctorChatComponent implements AfterViewChecked, OnChanges {
  @Input() otherUserId!: string;
  @Input() otherUserName!: string;
  @Input() isMini: boolean = false;
  @Output() close = new EventEmitter<void>();

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private config = inject(ConfigService);
  private signalR = inject(SignalRService);

  newMessage = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  lightboxUrl: string | null = null;
  isUploading = signal(false);
  showCall = signal(false);
  callType = signal<'video' | 'audio'>('video');
  callInitiator = signal(false);

  private crypto = inject(CryptoService);

  activeMessages = computed(() => {
    const targetId = this.otherUserId;
    const currentUserId = String(this.auth.currentUser()?.id);
    if (!targetId) return [];

    return this.signalR.chatMessages().filter(m =>
      (String(m.fromUserId) === String(targetId) && String(m.toUserId) === currentUserId) ||
      (String(m.fromUserId) === currentUserId && String(m.toUserId) === String(targetId))
    ).sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  });

  constructor() {
    effect(() => { this.activeMessages(); this.scrollToBottom(); });
    // Listen for incoming calls from this specific user
    this.signalR.onWebRtcEvent('IncomingCall', (from: string, type: string) => {
      if (String(from) === String(this.otherUserId)) {
        this.callType.set(type as 'video' | 'audio');
        this.callInitiator.set(false);
        this.showCall.set(true);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['otherUserId'] && this.otherUserId) {
      this.loadHistory();
      this.signalR.activeChatPartner.set(this.otherUserId);
    }
  }

  ngAfterViewChecked() { this.scrollToBottom(); }

  loadHistory() {
    this.http.get<any>(`${this.config.baseApiUrl}/api/chat/recent?withUserId=${this.otherUserId}`, {
      headers: { Authorization: `Bearer ${this.auth.getAccessToken()}` }
    }).subscribe(res => {
      if (res.success && res.data?.length) {
        const existing = this.signalR.chatMessages();
        const existingIds = new Set(existing.map((e: any) => e.id));
        const newOnes = res.data.filter((m: any) => m.id && !existingIds.has(m.id));
        this.signalR.chatMessages.set([...existing, ...newOnes]);
      }
    });
  }

  startCall(type: 'video' | 'audio') {
    this.callType.set(type);
    this.callInitiator.set(true);
    this.showCall.set(true);
    this.signalR.sendCallRequest(this.otherUserId, type);
  }

  async sendMessage() {
    if ((!this.newMessage.trim() && !this.selectedFile) || !this.otherUserId) return;

    let imageUrl: string | undefined = undefined;
    if (this.selectedFile) {
      imageUrl = await this.fileToDataUrl(this.selectedFile);
      this.selectedFile = null;
      this.previewUrl = null;
    }

    const msg = this.newMessage;
    const myId = String(this.auth.currentUser()?.id);
    // Encrypt before sending — server only sees ciphertext
    const encrypted = await this.crypto.encrypt(msg, myId, String(this.otherUserId));
    this.isUploading.set(true);
    try {
      await this.signalR.sendChatMessage(this.otherUserId, encrypted, imageUrl);

      // Show plaintext in local UI (optimistic)
      this.signalR.chatMessages.update(msgs => [...msgs, {
        id: Date.now(),
        fromUserId: myId,
        toUserId: String(this.otherUserId),
        message: msg,
        imageUrl,
        sentAt: new Date()
      }]);

      this.newMessage = '';
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      this.isUploading.set(false);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => { this.previewUrl = reader.result as string; };
      reader.readAsDataURL(file);
    }
  }

  clearFile() { this.selectedFile = null; this.previewUrl = null; }

  isSentByMe(msg: ChatMessage) {
    return String(msg.fromUserId) === String(this.auth.currentUser()?.id);
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private scrollToBottom(): void {
    try { this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight; }
    catch(err) { }
  }
}
