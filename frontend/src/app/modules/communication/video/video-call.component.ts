import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

declare var JitsiMeetExternalAPI: any;

@Component({
  selector: 'app-video-call',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="video-container fade-in">
      <div class="video-header">
        <div class="title">
          <span class="pulse-icon">🔴</span>
          LIVE CONSULTATION — {{ roomName }}
        </div>
        <button class="end-call-btn" (click)="endCall()">
          📴 Leave Meeting
        </button>
      </div>
      <div *ngIf="loadingJitsi" class="loading-state">
        <div class="spinner"></div>
        <p>Connecting to video room...</p>
      </div>
      <div #jitsiContainer class="jitsi-iframe-wrapper"></div>
    </div>
  `,
  styles: [`
    .video-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      background: #0f172a;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
    }
    .video-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px;
      background: linear-gradient(90deg, #1e293b, #0f172a);
      color: #fff;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .title {
      font-weight: 700;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 10px;
      letter-spacing: 1px;
      color: #e2e8f0;
    }
    .pulse-icon { font-size: 10px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
    .end-call-btn {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: #fff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
    .end-call-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(239,68,68,0.4); }
    .jitsi-iframe-wrapper { flex: 1; width: 100%; background: #000; min-height: 400px; }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      color: #94a3b8;
      gap: 16px;
      padding: 40px;
      position: absolute;
      inset: 64px 0 0 0;
    }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(99,102,241,0.2);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class VideoCallComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() roomName: string = '';
  @Input() userName: string = '';
  @Input() isDoctor: boolean = false;
  @Output() onEndCall = new EventEmitter<void>();

  @ViewChild('jitsiContainer') jitsiContainer!: ElementRef;

  private api: any = null;
  private disposed = false;
  loadingJitsi = true;
  private readonly jitsiScriptId = 'jitsi-script';

  ngOnInit() {
    this.loadJitsiScript();
  }

  ngAfterViewInit() {
    // Handles case where script was already loaded (e.g., second call in same session)
    if (typeof JitsiMeetExternalAPI !== 'undefined') {
      this.initializeJitsi();
    }
  }

  ngOnDestroy() {
    this.disposed = true;
    if (this.api) {
      try { this.api.dispose(); } catch { /* ignore */ }
      this.api = null;
    }
  }

  private loadJitsiScript() {
    if (document.getElementById(this.jitsiScriptId)) {
      // Script tag exists — poll until API becomes available
      this.pollUntilReady();
      return;
    }
    const script = document.createElement('script');
    script.id = this.jitsiScriptId;
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      if (!this.disposed) this.initializeJitsi();
    };
    script.onerror = () => console.error('[Jitsi] Failed to load external API script');
    document.body.appendChild(script);
  }

  private pollUntilReady(attempts = 0) {
    if (this.disposed || this.api) return;
    if (typeof JitsiMeetExternalAPI !== 'undefined' && this.jitsiContainer?.nativeElement) {
      this.initializeJitsi();
    } else if (attempts < 30) {
      setTimeout(() => this.pollUntilReady(attempts + 1), 300);
    } else {
      console.error('[Jitsi] Timed out waiting for API');
    }
  }

  private initializeJitsi() {
    if (this.api || this.disposed || !this.jitsiContainer?.nativeElement || !this.roomName) return;

    this.loadingJitsi = false;

    try {
      this.api = new JitsiMeetExternalAPI('meet.jit.si', {
        roomName: this.roomName,
        width: '100%',
        height: '100%',
        parentNode: this.jitsiContainer.nativeElement,
        userInfo: {
          displayName: this.userName || (this.isDoctor ? 'Doctor' : 'Patient')
        },
        configOverwrite: {
          startWithAudioMuted: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_ALWAYS_VISIBLE: true,
        }
      });

      this.api.addEventListeners({
        videoConferenceJoined: () => console.log('[Jitsi] Joined:', this.roomName),
        videoConferenceLeft: () => { if (!this.disposed) this.endCall(); },
        readyToClose: () => { if (!this.disposed) this.endCall(); },
      });
    } catch (e) {
      console.error('[Jitsi] Init error:', e);
    }
  }

  endCall() {
    this.disposed = true;
    if (this.api) {
      try { this.api.dispose(); } catch { /* ignore */ }
      this.api = null;
    }
    this.onEndCall.emit();
  }
}
