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
          <h3>💬 Messages</h3>
        </div>
        <div class="search-box">
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search staff...">
        </div>
        <div class="user-list">
          <div *ngFor="let user of filteredUsers()"
               class="user-item"
               [class.active]="selectedUserId() === user.id"
               (click)="selectUser(user)">
            <div class="user-avatar">{{ user.fullName[0] | uppercase }}</div>
            <div class="user-info">
              <div class="user-name">{{ user.fullName }}</div>
              <div class="user-role">{{ user.role }}</div>
            </div>
            <div class="unread-badge" *ngIf="getUnreadCount(user.id) > 0">{{ getUnreadCount(user.id) }}</div>
          </div>
          <div *ngIf="availableUsers().length === 0" class="empty-users">
            <div class="spinner"></div>
            <span>Loading staff...</span>
          </div>
        </div>
      </div>

      <div class="chat-main">
        <!-- No chat selected -->
        <div *ngIf="!selectedUserId()" class="no-chat">
          <div class="no-chat-icon">💬</div>
          <h3>Select a colleague to chat</h3>
          <p>Choose from the list on the left to start messaging</p>
        </div>

        <!-- Active chat -->
        <ng-container *ngIf="selectedUserId()">
          <div class="chat-header">
            <div class="user-avatar header-avatar">{{ selectedUser()?.fullName?.[0] | uppercase }}</div>
            <div>
              <h4>{{ selectedUser()?.fullName }}</h4>
              <span class="status-online">● Online</span>
            </div>
          </div>

          <div class="messages-area" #scrollMe>
            <div *ngIf="activeMessages().length === 0" class="msgs-empty">
              <p>No messages yet. Say hello! 👋</p>
            </div>
            <div *ngFor="let msg of activeMessages()"
                 class="message-wrapper"
                 [class.sent]="isSentByMe(msg)">
              <div class="message-bubble">
                <img *ngIf="msg.imageUrl" [src]="msg.imageUrl" class="chat-img" (click)="openImage(msg.imageUrl!)" />
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

          <div class="chat-input">
            <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/*" style="display:none">
            <button class="attach-btn" (click)="fileInput.click()" title="Attach image">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2.12 2.12 0 1 1-3-3l9.19-9.19"/>
              </svg>
            </button>
            <input type="text"
                   [(ngModel)]="newMessage"
                   (keyup.enter)="sendMessage()"
                   placeholder="Type your message..."
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
        </ng-container>
      </div>
    </div>

    <!-- Lightbox for image viewing -->
    <div class="lightbox" *ngIf="lightboxUrl" (click)="lightboxUrl = null">
      <img [src]="lightboxUrl">
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    :host { display: block; height: 100%; font-family: 'Inter', sans-serif; }

    .chat-container { display: flex; height: calc(100vh - 160px); min-height: 580px; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); border: 1px solid #e2e8f0; }

    /* Sidebar */
    .sidebar { width: 320px; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; background: #f8fafc; flex-shrink: 0; }
    .sidebar-header { padding: 22px 20px 12px; border-bottom: 1px solid #e2e8f0; background: #fff; }
    .sidebar-header h3 { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0; }
    .search-box { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; }
    .search-box input { width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 14px; outline: none; background: #fff; box-sizing: border-box; }
    .search-box input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

    .user-list { flex: 1; overflow-y: auto; }
    .user-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; cursor: pointer; transition: all 0.2s; border-left: 3px solid transparent; position: relative; }
    .user-item:hover { background: #f1f5f9; }
    .user-item.active { background: #eff6ff; border-left-color: #2563eb; }

    .user-avatar { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #6366f1); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; }
    .header-avatar { width: 40px; height: 40px; }
    .user-info { flex: 1; min-width: 0; }
    .user-name { font-size: 14px; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 12px; color: #64748b; margin-top: 2px; }
    .unread-badge { min-width: 20px; height: 20px; background: #ef4444; color: #fff; border-radius: 10px; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; padding: 0 5px; flex-shrink: 0; }

    .empty-users { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px 20px; color: #94a3b8; font-size: 13px; }
    .spinner { width: 24px; height: 24px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Chat main area */
    .chat-main { flex: 1; display: flex; flex-direction: column; min-width: 0; background: #f0f4ff; background-image: radial-gradient(#dbeafe 1px, transparent 1px); background-size: 20px 20px; }

    .no-chat { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #64748b; text-align: center; gap: 12px; }
    .no-chat-icon { font-size: 72px; filter: grayscale(1) opacity(0.3); }
    .no-chat h3 { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0; }
    .no-chat p { font-size: 14px; color: #94a3b8; margin: 0; }

    .chat-header { padding: 16px 24px; background: #fff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.03); z-index: 10; flex-shrink: 0; }
    .chat-header h4 { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; }
    .status-online { font-size: 12px; color: #10b981; font-weight: 600; }

    .messages-area { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 14px; }
    .msgs-empty { display: flex; align-items: center; justify-content: center; height: 100%; }
    .msgs-empty p { background: rgba(255,255,255,0.8); padding: 14px 28px; border-radius: 20px; font-size: 14px; color: #64748b; border: 1px solid #e2e8f0; }

    .message-wrapper { display: flex; flex-direction: column; max-width: 72%; animation: fadeMsg 0.25s ease; }
    @keyframes fadeMsg { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .message-wrapper { align-self: flex-start; }
    .message-wrapper.sent { align-self: flex-end; }

    .message-bubble { padding: 12px 18px; border-radius: 18px; position: relative; font-size: 14px; line-height: 1.55; }
    .message-wrapper:not(.sent) .message-bubble { background: #fff; color: #1e293b; border-bottom-left-radius: 4px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .sent .message-bubble { background: #2563eb; color: #fff; border-bottom-right-radius: 4px; box-shadow: 0 2px 8px rgba(37,99,235,0.2); }

    .message-bubble p { margin: 0; word-break: break-word; }
    .message-time { font-size: 11px; margin-top: 6px; display: block; text-align: right; }
    .message-wrapper:not(.sent) .message-time { color: #94a3b8; }
    .sent .message-time { color: rgba(255,255,255,0.65); }

    .chat-img { max-width: 100%; max-height: 220px; border-radius: 12px; margin-bottom: 8px; display: block; cursor: zoom-in; object-fit: contain; }

    /* Image preview */
    .image-preview { padding: 10px 24px; background: #fff; border-top: 1px solid #e2e8f0; display: flex; align-items: center; gap: 12px; }
    .image-preview img { height: 60px; border-radius: 8px; object-fit: cover; border: 1px solid #e2e8f0; }
    .image-preview button { background: #fee2e2; color: #dc2626; border: none; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; }

    /* Input */
    .chat-input { padding: 16px 24px; background: #fff; border-top: 1px solid #e2e8f0; display: flex; gap: 12px; align-items: center; flex-shrink: 0; z-index: 10; }
    .chat-input input[type="text"] { flex: 1; padding: 13px 18px; border: 1.5px solid #e2e8f0; border-radius: 24px; font-size: 14px; outline: none; background: #f8fafc; transition: all 0.2s; }
    .chat-input input[type="text"]:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 4px rgba(37,99,235,0.1); }
    .chat-input input:disabled { opacity: 0.5; }

    .attach-btn { width: 44px; height: 44px; border-radius: 50%; background: #f1f5f9; border: none; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
    .attach-btn:hover { background: #e2e8f0; color: #2563eb; }
    .attach-btn svg { width: 20px; height: 20px; }

    .send-btn { width: 48px; height: 48px; border-radius: 50%; background: #2563eb; color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 4px 12px rgba(37,99,235,0.25); flex-shrink: 0; }
    .send-btn:hover:not(:disabled) { background: #1d4ed8; transform: scale(1.05); box-shadow: 0 6px 16px rgba(37,99,235,0.3); }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; background: #94a3b8; transform: none; }
    .send-btn svg { width: 20px; height: 20px; margin-left: -2px; }

    .loader-sm { width: 20px; height: 20px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }

    /* Lightbox */
    .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 9999; cursor: zoom-out; }
    .lightbox img { max-width: 90vw; max-height: 90vh; border-radius: 12px; object-fit: contain; }
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
  searchQuery = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  lightboxUrl: string | null = null;
  isUploading = signal(false);

  filteredUsers = computed(() => {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.availableUsers();
    return this.availableUsers().filter(u =>
      u.fullName?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q)
    );
  });

  activeMessages = computed(() => {
    const selectedId = this.selectedUserId();
    const currentUserId = String(this.auth.currentUser()?.id);
    if (!selectedId) return [];

    return this.signalR.chatMessages().filter(m =>
      (String(m.fromUserId) === String(selectedId) && String(m.toUserId) === currentUserId) ||
      (String(m.fromUserId) === currentUserId && String(m.toUserId) === String(selectedId))
    ).sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
  });

  constructor() {
    this.loadStaff();
    effect(() => {
      this.activeMessages();
      this.scrollToBottom();
    });
  }

  ngAfterViewChecked() { this.scrollToBottom(); }

  loadStaff() {
    this.http.get<any>(`${this.config.baseApiUrl}/api/chat/users`, {
      headers: { Authorization: `Bearer ${this.auth.getAccessToken()}` }
    }).subscribe({
      next: (res) => { if (res.success) this.availableUsers.set(res.data); },
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
      if (res.success && res.data?.length) {
        const existing = this.signalR.chatMessages();
        const existingIds = new Set(existing.map((e: any) => e.id));
        const newOnes = res.data.filter((m: any) => m.id && !existingIds.has(m.id));
        this.signalR.chatMessages.set([...existing, ...newOnes]);
      }
    });
  }

  getUnreadCount(userId: string): number {
    const currentUserId = String(this.auth.currentUser()?.id);
    return this.signalR.chatMessages().filter(m =>
      String(m.fromUserId) === String(userId) && String(m.toUserId) === currentUserId && !(m as any).read
    ).length;
  }

  async sendMessage() {
    if ((!this.newMessage.trim() && !this.selectedFile) || !this.selectedUserId()) return;

    let imageUrl: string | undefined = undefined;
    if (this.selectedFile) {
      imageUrl = await this.fileToDataUrl(this.selectedFile);
      this.selectedFile = null;
      this.previewUrl = null;
    }

    const msg = this.newMessage;
    this.isUploading.set(true);
    try {
      await this.signalR.sendChatMessage(this.selectedUserId()!, msg, imageUrl);

      // Optimistic update — show message immediately
      this.signalR.chatMessages.update(msgs => [...msgs, {
        id: Date.now(),
        fromUserId: String(this.auth.currentUser()?.id),
        toUserId: String(this.selectedUserId()!),
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

  openImage(url: string) { this.lightboxUrl = url; }

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
    try { this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight; }
    catch(err) { }
  }
}
