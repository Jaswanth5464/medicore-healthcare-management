import { Component, signal, computed, inject, effect, ElementRef, ViewChild, AfterViewChecked, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { SignalRService, ChatMessage } from '../../../core/services/signalr.service';
import { ConfigService } from '../../../core/services/config.service';

@Component({
  selector: 'app-patient-doctor-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-wrapper" [class.mini]="isMini">
      <div class="chat-header">
        <div class="user-info">
          <div class="avatar">{{ otherUserName[0] }}</div>
          <div>
            <h4>{{ otherUserName }}</h4>
            <span class="status">Online</span>
          </div>
        </div>
        <button class="close-btn" (click)="close.emit()">✕</button>
      </div>

      <div class="messages-area" #scrollMe>
        <div *ngFor="let msg of activeMessages()" 
             class="message-wrapper" 
             [class.sent]="isSentByMe(msg)">
          <div class="message-bubble">
            <img *ngIf="msg.imageUrl" [src]="msg.imageUrl" class="chat-img" />
            <p *ngIf="msg.message">{{ msg.message }}</p>
            <span class="message-time">{{ msg.sentAt | date:'shortTime' }}</span>
          </div>
        </div>
        <div *ngIf="activeMessages().length === 0" class="no-messages">
          <p>No messages yet. Say hello!</p>
        </div>
      </div>

      <div class="chat-input-area">
        <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/*" style="display:none">
        <button class="icon-btn" (click)="fileInput.click()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2.12 2.12 0 1 1-3-3l9.19-9.19"/>
          </svg>
        </button>
        <input type="text" 
               [(ngModel)]="newMessage" 
               (keyup.enter)="sendMessage()"
               placeholder="Type a message...">
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
  `,
  styles: [`
    .chat-wrapper {
      display: flex;
      flex-direction: column;
      height: 500px;
      width: 100%;
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }

    .chat-header {
      padding: 16px 20px;
      background: #fff;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }

    .chat-header h4 { font-size: 15px; margin: 0; color: #1e293b; }
    .status { font-size: 11px; color: #10b981; font-weight: 600; }

    .close-btn { background: none; border: none; font-size: 18px; color: #64748b; cursor: pointer; }

    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f8fafc;
    }

    .message-wrapper { display: flex; flex-direction: column; max-width: 80%; }
    .message-wrapper.sent { align-self: flex-end; }

    .message-bubble { padding: 10px 14px; border-radius: 14px; background: #fff; border: 1px solid #e2e8f0; color: #334155; position: relative; }
    .sent .message-bubble { background: #6366f1; color: #fff; border-color: #6366f1; border-bottom-right-radius: 4px; }
    .message-wrapper:not(.sent) .message-bubble { border-bottom-left-radius: 4px; }

    .chat-img { max-width: 100%; border-radius: 8px; margin-bottom: 6px; display: block; border: 1px solid rgba(0,0,0,0.05); }

    .message-time { font-size: 9px; opacity: 0.7; margin-top: 4px; display: block; text-align: right; }

    .no-messages { display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8; font-size: 14px; }

    .chat-input-area { padding: 16px; border-top: 1px solid #f1f5f9; display: flex; gap: 10px; align-items: center; background: #fff; }
    .chat-input-area input[type="text"] { flex: 1; padding: 10px 16px; border: 1px solid #e2e8f0; border-radius: 10px; outline: none; font-size: 14px; }
    
    .icon-btn { background: none; border: none; color: #64748b; cursor: pointer; padding: 5px; }
    .icon-btn svg { width: 20px; height: 20px; }

    .send-btn { width: 40px; height: 40px; border-radius: 10px; background: #6366f1; color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .send-btn:hover:not(:disabled) { background: #4f46e5; }
    .send-btn:disabled { opacity: 0.5; }

    .loader-sm { width: 18px; height: 18px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
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
  isUploading = signal(false);

  activeMessages = computed(() => {
    const targetId = this.otherUserId;
    const currentUserId = this.auth.currentUser()?.id;
    if (!targetId) return [];
    
    return this.signalR.chatMessages().filter(m => 
      (String(m.fromUserId) === String(targetId) && String(m.toUserId) === String(currentUserId)) ||
      (String(m.fromUserId) === String(currentUserId) && String(m.toUserId) === String(targetId))
    );
  });

  constructor() {
    effect(() => {
      this.activeMessages();
      this.scrollToBottom();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['otherUserId'] && this.otherUserId) {
      this.loadHistory();
      this.signalR.activeChatPartner.set(this.otherUserId);
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  loadHistory() {
    this.http.get<any>(`${this.config.baseApiUrl}/api/chat/recent?withUserId=${this.otherUserId}`, {
      headers: { Authorization: `Bearer ${this.auth.getAccessToken()}` }
    }).subscribe(res => {
      if (res.success) {
        const existing = this.signalR.chatMessages();
        const newOnes = res.data.filter((m: any) => !existing.some(e => e.id === m.id));
        this.signalR.chatMessages.set([...existing, ...newOnes]);
      }
    });
  }

  async sendMessage() {
    if ((!this.newMessage.trim() && !this.selectedFile) || !this.otherUserId) return;

    let imageUrl: string | undefined = undefined;
    if (this.selectedFile) {
      imageUrl = await this.fileToDataUrl(this.selectedFile);
      this.selectedFile = null;
    }

    const msg = this.newMessage;
    this.isUploading.set(true);
    try {
      await this.signalR.sendChatMessage(this.otherUserId, msg, imageUrl);
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
      this.sendMessage();
    }
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  isSentByMe(msg: ChatMessage) {
    return String(msg.fromUserId) === String(this.auth.currentUser()?.id);
  }

  private scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
}
