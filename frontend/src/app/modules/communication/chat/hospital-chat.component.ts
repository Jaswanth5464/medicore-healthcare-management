import { Component, signal, computed, inject, effect, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { SignalRService, ChatMessage } from '../../../core/services/signalr.service';
import { ConfigService } from '../../../core/services/config.service';

@Component({
  selector: 'app-hospital-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>Messages</h3>
        </div>
        <div class="user-list">
          <div *ngFor="let user of availableUsers()" 
               class="user-item" 
               [class.active]="selectedUserId() === user.id"
               (click)="selectUser(user)">
            <div class="user-avatar">{{ user.fullName[0] }}</div>
            <div class="user-info">
              <div class="user-name">{{ user.fullName }}</div>
              <div class="user-role">{{ user.role }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-main">
        <div class="chat-header" *ngIf="selectedUser()">
          <div class="user-avatar">{{ selectedUser()?.fullName?.[0] }}</div>
          <div>
            <h4>{{ selectedUser()?.fullName }}</h4>
            <span class="status-online">Online</span>
          </div>
        </div>

        <div class="messages-area" #scrollMe>
          <div *ngIf="!selectedUserId()" class="no-chat">
            <div class="empty-icon">💬</div>
            <p>Select a person to start chatting</p>
          </div>
          
          <div *ngFor="let msg of activeMessages()" 
               class="message-wrapper" 
               [class.sent]="isSentByMe(msg)">
            <div class="message-bubble">
              <img *ngIf="msg.imageUrl" [src]="msg.imageUrl" class="chat-img" />
              <p *ngIf="msg.message">{{ msg.message }}</p>
              <span class="message-time">{{ msg.sentAt | date:'shortTime' }}</span>
            </div>
          </div>
        </div>

        <div class="chat-input" *ngIf="selectedUserId()">
          <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/*" style="display:none">
          <button class="attach-btn" (click)="fileInput.click()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2.12 2.12 0 1 1-3-3l9.19-9.19"/>
            </svg>
          </button>
          <input type="text" 
                 [(ngModel)]="newMessage" 
                 (keyup.enter)="sendMessage()"
                 placeholder="Type your message...">
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
    </div>
  `,
  styles: [`
    .chat-container { display: flex; height: 100%; height: calc(100vh - 120px); background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    
    .sidebar { width: 300px; border-right: 1px solid #f1f5f9; display: flex; flex-direction: column; background: #f8fafc; }
    .sidebar-header { padding: 20px; border-bottom: 1px solid #f1f5f9; }
    .sidebar-header h3 { font-size: 18px; font-weight: 700; color: #1e293b; }
    
    .user-list { flex: 1; overflow-y: auto; }
    .user-item { display: flex; align-items: center; gap: 12px; padding: 15px 20px; cursor: pointer; transition: background 0.2s; }
    .user-item:hover { background: #f1f5f9; }
    .user-item.active { background: #e0f2fe; border-right: 3px solid #0ea5e9; }
    
    .user-avatar { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #0ea5e9, #6366f1); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; }
    .user-name { font-size: 14px; font-weight: 600; color: #1e293b; }
    .user-role { font-size: 12px; color: #64748b; }

    .chat-main { flex: 1; display: flex; flex-direction: column; position: relative; }
    .chat-header { padding: 15px 25px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 12px; }
    .chat-header h4 { font-size: 16px; font-weight: 700; color: #1e293b; }
    .status-online { font-size: 11px; color: #10b981; font-weight: 600; }

    .messages-area { flex: 1; overflow-y: auto; padding: 25px; display: flex; flex-direction: column; gap: 16px; background: #fff; }
    .message-wrapper { display: flex; flex-direction: column; max-width: 70%; }
    .message-wrapper.sent { align-self: flex-end; }
    
    .message-bubble { padding: 12px 16px; border-radius: 16px; background: #f1f5f9; color: #334155; position: relative; }
    .sent .message-bubble { background: #0ea5e9; color: #fff; border-bottom-right-radius: 4px; }
    .message-bubble:not(.sent) { border-bottom-left-radius: 4px; }
    
    .message-time { font-size: 10px; opacity: 0.7; margin-top: 4px; display: block; text-align: right; }

    .chat-input { padding: 20px 25px; border-top: 1px solid #f1f5f9; display: flex; gap: 12px; align-items: center; }
    .chat-input input[type="text"] { flex: 1; padding: 12px 20px; border: 1px solid #e2e8f0; border-radius: 12px; outline: none; font-size: 14px; }
    .chat-input input[type="text"]:focus { border-color: #0ea5e9; box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1); }
    
    .attach-btn { background: none; border: none; color: #64748b; cursor: pointer; padding: 5px; }
    .attach-btn:hover { color: #0ea5e9; }
    .attach-btn svg { width: 20px; height: 20px; }

    .send-btn { width: 45px; height: 45px; border-radius: 12px; background: #0ea5e9; color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
    .send-btn:hover:not(:disabled) { background: #0284c7; }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .chat-img { max-width: 100%; border-radius: 8px; margin-bottom: 8px; display: block; border: 1px solid rgba(0,0,0,0.05); cursor: pointer; transition: transform 0.2s; }
    .chat-img:hover { transform: scale(1.02); }

    .loader-sm { width: 20px; height: 20px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .no-chat { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #94a3b8; }
    .empty-icon { font-size: 64px; margin-bottom: 20px; opacity: 0.2; }
  `]
})
export class HospitalChatComponent implements AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private config = inject(ConfigService);
  private signalR = inject(SignalRService);

  availableUsers = signal<any[]>([]);
  selectedUserId = signal<string | null>(null);
  selectedUser = signal<any | null>(null);
  newMessage = '';
  selectedFile: File | null = null;
  isUploading = signal(false);

  activeMessages = computed(() => {
    const selectedId = this.selectedUserId();
    const currentUserId = this.auth.currentUser()?.id;
    if (!selectedId) return [];
    
    return this.signalR.chatMessages().filter(m => 
      (m.fromUserId === selectedId && String(m.toUserId) === String(currentUserId)) ||
      (String(m.fromUserId) === String(currentUserId) && m.toUserId === selectedId) ||
      (m.fromUserId === selectedId && !m.toUserId)
    );
  });

  constructor() {
    this.loadStaff();
    
    // Auto scroll on new messages
    effect(() => {
      this.activeMessages();
      this.scrollToBottom();
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  loadStaff() {
    this.http.get<any>(`${this.config.baseApiUrl}/api/chat/users`, {
      headers: { Authorization: `Bearer ${this.auth.getAccessToken()}` }
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.availableUsers.set(res.data);
        }
      },
      error: (err) => console.error('Failed to load chat users', err)
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
    }).subscribe(res => {
      if (res.success) {
        const existing = this.signalR.chatMessages();
        // Filter out duplicates
        const newOnes = res.data.filter((m: any) => !existing.some(e => e.id === m.id));
        this.signalR.chatMessages.set([...existing, ...newOnes]);
      }
    });
  }

  async sendMessage() {
    if ((!this.newMessage.trim() && !this.selectedFile) || !this.selectedUserId()) return;

    let imageUrl: string | undefined = undefined;
    
    if (this.selectedFile) {
      // Logic for real upload would go here. For now, simulate with a data URL for instant UX.
      imageUrl = await this.fileToDataUrl(this.selectedFile);
      this.selectedFile = null;
    }

    const msg = this.newMessage;
    this.isUploading.set(true);
    try {
      await this.signalR.sendChatMessage(this.selectedUserId()!, msg, imageUrl);
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
      this.sendMessage(); // Auto-send image on selection like modern apps
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
