import {
  Component, signal, inject, OnDestroy, Input, Output, EventEmitter, OnInit, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignalRService } from '../../../core/services/signalr.service';

/**
 * WebRTC Video/Audio Call Overlay for MediCore HMS
 * - Uses STUN servers for NAT traversal
 * - Signals via SignalR hub (offer/answer/ICE candidate)
 * - Supports both video and audio-only calls
 * - Fully destroyed on hang-up
 *
 * FIXES APPLIED:
 * 1. All SignalR event handlers (including CallResponse) are registered in
 *    ngOnInit — not inside startCall() — so they're never stacked on repeat calls.
 * 2. Handlers are stored as named arrow functions so offWebRtcEvent() can remove
 *    them by reference in ngOnDestroy, preventing leaks across overlay instances.
 * 3. startTimer() is only called once, from onconnectionstatechange, with a guard
 *    to prevent double-firing. The previous unconditional call in createPeerConnection()
 *    was removed (it caused double-speed timer + a leaked interval).
 * 4. accept() now calls createPeerConnection() before handleRemoteOffer() so that
 *    the RTCPeerConnection always exists when the offer is processed.
 */
@Component({
  selector: 'app-call-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="call-overlay" [class.minimized]="minimized()">
      <!-- Incoming call screen -->
      <div *ngIf="state() === 'incoming'" class="call-screen incoming">
        <div class="caller-avatar">{{ callerName[0] | uppercase }}</div>
        <h3>{{ callerName }}</h3>
        <p class="call-type-tag">{{ callType === 'video' ? '📹 Incoming Video Call' : '📞 Incoming Audio Call' }}</p>
        <div class="call-actions">
          <button class="accept-btn" (click)="accept()">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
          </button>
          <button class="reject-btn" (click)="reject()">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.4 13.2l-2.2 2.2c-2.8-1.5-5.1-3.8-6.6-6.6l2.2-2.2c.6-.6.8-1.4.5-2.1L9.8 1.4C9.4.5 8.4 0 7.4 0H3C1.3 0 0 1.3 0 3c0 11 9 20 20 20 1.7 0 3-1.3 3-3v-4.4c0-1-.6-2-1.5-2.3l-3.1-1.5c-.7-.3-1.5-.1-2 .4z" transform="rotate(135 12 12)"/></svg>
          </button>
        </div>
      </div>

      <!-- Active call screen -->
      <div *ngIf="state() === 'active'" class="call-screen active">
        <div class="video-area">
          <video #remoteVideo autoplay playsinline class="remote-video" [class.audio-only]="callType !== 'video'"></video>
          <video #localVideo autoplay playsinline muted class="local-video" [class.hidden]="callType !== 'video'"></video>
          <div *ngIf="callType !== 'video'" class="audio-avatar">
            <div class="big-avatar">{{ callerName[0] | uppercase }}</div>
            <p>{{ callerName }}</p>
            <p class="call-timer">{{ formattedDuration() }}</p>
          </div>
          <div *ngIf="callType === 'video'" class="duration-chip">{{ formattedDuration() }}</div>
        </div>
        <div class="controls">
          <button class="ctrl-btn" (click)="toggleMic()" [class.off]="micMuted()" title="Mute">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path *ngIf="!micMuted()" d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm-1 16.93A8 8 0 0 1 4 10H2a10 10 0 0 0 9 9.93V22h2v-2.07A10 10 0 0 0 22 10h-2a8 8 0 0 1-7 7.93V17z"/>
              <path *ngIf="micMuted()" d="M19 11h-1.7A5.009 5.009 0 0 1 8.1 13.8L6.7 12.4A7 7 0 0 0 17 11h2zm-7 7.93A8 8 0 0 1 4 11H2a10 10 0 0 0 9 9.93V23h2v-4.07zM4.27 3L3 4.27l4 4V11a5 5 0 0 0 5 5 4.89 4.89 0 0 0 2-.43l1.48 1.48A7 7 0 0 1 5 11H3a9 9 0 0 0 10.44 8.9L17 23.17l1.27-1.27L4.27 3z"/>
            </svg>
          </button>
          <button class="ctrl-btn" (click)="toggleCam()" [class.off]="camOff()" title="Camera" *ngIf="callType === 'video'">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path *ngIf="!camOff()" d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              <path *ngIf="camOff()" d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
            </svg>
          </button>
          <button class="ctrl-btn minimize-btn" (click)="minimized.update(v => !v)" title="Minimize">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h12v2H6z"/></svg>
          </button>
          <button class="end-btn" (click)="hangUp()" title="End call">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.4 13.2l-2.2 2.2c-2.8-1.5-5.1-3.8-6.6-6.6l2.2-2.2c.6-.6.8-1.4.5-2.1L9.8 1.4C9.4.5 8.4 0 7.4 0H3C1.3 0 0 1.3 0 3c0 11 9 20 20 20 1.7 0 3-1.3 3-3v-4.4c0-1-.6-2-1.5-2.3l-3.1-1.5c-.7-.3-1.5-.1-2 .4z" transform="rotate(135 12 12)"/></svg>
          </button>
        </div>
      </div>

      <!-- Calling/connecting -->
      <div *ngIf="state() === 'calling'" class="call-screen calling">
        <div class="caller-avatar pulse">{{ callerName[0] | uppercase }}</div>
        <h3>{{ callerName }}</h3>
        <p class="call-type-tag">{{ callType === 'video' ? '📹 Video Calling...' : '📞 Audio Calling...' }}</p>
        <button class="reject-btn" (click)="hangUp()">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.4 13.2l-2.2 2.2c-2.8-1.5-5.1-3.8-6.6-6.6l2.2-2.2c.6-.6.8-1.4.5-2.1L9.8 1.4C9.4.5 8.4 0 7.4 0H3C1.3 0 0 1.3 0 3c0 11 9 20 20 20 1.7 0 3-1.3 3-3v-4.4c0-1-.6-2-1.5-2.3l-3.1-1.5c-.7-.3-1.5-.1-2 .4z" transform="rotate(135 12 12)"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    .call-overlay {
      position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,0.92);
      display: flex; align-items: center; justify-content: center; font-family: 'Inter', sans-serif;
      transition: all 0.3s;
    }
    .call-overlay.minimized {
      inset: auto; bottom: 20px; right: 20px; width: 220px; height: 140px; border-radius: 16px;
      background: #0f172a; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    }
    .call-overlay.minimized .call-screen { transform: scale(0.7); transform-origin: bottom right; }
    .call-overlay.minimized .controls { display: none !important; }

    .call-screen { display: flex; flex-direction: column; align-items: center; gap: 20px; color: #fff; width: 100%; height: 100%; position: relative; }
    .call-screen.active { justify-content: flex-end; padding-bottom: 32px; }
    .call-screen.incoming, .call-screen.calling { justify-content: center; }

    .caller-avatar {
      width: 100px; height: 100px; border-radius: 50%; font-size: 40px; font-weight: 700;
      background: linear-gradient(135deg,#2563eb,#6366f1); display: flex; align-items: center; justify-content: center;
    }
    .caller-avatar.pulse { animation: pulse 1.5s ease-in-out infinite; }
    @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.4)} 50%{box-shadow:0 0 0 20px rgba(99,102,241,0)} }

    .call-screen h3 { font-size: 24px; font-weight: 700; margin: 0; }
    .call-type-tag { font-size: 14px; color: #94a3b8; margin: 0; }

    .call-actions { display: flex; gap: 24px; }
    .accept-btn, .reject-btn, .ctrl-btn, .end-btn {
      width: 64px; height: 64px; border-radius: 50%; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: all 0.2s;
    }
    .accept-btn { background: #22c55e; color: #fff; }
    .accept-btn:hover { background: #16a34a; transform: scale(1.08); }
    .reject-btn, .end-btn { background: #ef4444; color: #fff; }
    .reject-btn:hover, .end-btn:hover { background: #dc2626; transform: scale(1.08); }
    .accept-btn svg, .reject-btn svg, .ctrl-btn svg, .end-btn svg { width: 28px; height: 28px; }

    .video-area { position: relative; flex: 1; width: 100%; background: #0f172a; overflow: hidden; }
    .remote-video { width: 100%; height: 100%; object-fit: cover; }
    .local-video { position: absolute; bottom: 16px; right: 16px; width: 160px; height: 120px; border-radius: 12px; object-fit: cover; border: 2px solid #fff; }
    .local-video.hidden, .remote-video.audio-only { display: none; }

    .audio-avatar { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; height: 100%; }
    .big-avatar { width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg,#2563eb,#6366f1); font-size: 50px; font-weight: 700; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 40px rgba(37,99,235,0.3); }
    .audio-avatar p { margin: 0; color: #e2e8f0; }
    .call-timer { font-size: 20px; font-weight: 700; color: #94a3b8; }
    .duration-chip { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.5); color: #fff; padding: 4px 14px; border-radius: 20px; font-size: 13px; }

    .controls { display: flex; gap: 16px; align-items: center; z-index: 5; }
    .ctrl-btn { width: 54px; height: 54px; background: rgba(255,255,255,0.1); color: #fff; }
    .ctrl-btn:hover { background: rgba(255,255,255,0.2); }
    .ctrl-btn.off { background: #ef4444; }
    .minimize-btn { width: 44px; height: 44px; background: rgba(255,255,255,0.08); }
  `]
})
export class CallOverlayComponent implements OnInit, OnDestroy {
  @Input() callerName = 'Unknown';
  @Input() callType: 'video' | 'audio' = 'video';
  @Input() callerId = '';
  @Input() isInitiator = false;
  @Output() callEnded = new EventEmitter<void>();

  @ViewChild('localVideo') localVideoEl?: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoEl?: ElementRef<HTMLVideoElement>;

  private signalR = inject(SignalRService);

  state = signal<'incoming' | 'calling' | 'active'>('calling');
  micMuted = signal(false);
  camOff = signal(false);
  minimized = signal(false);

  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private timerInterval: any = null;
  private callStart = 0;
  private offerPending: string | null = null;
  secondsElapsed = signal(0);

  readonly formattedDuration = () => {
    const s = this.secondsElapsed();
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  private readonly ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  // FIX: Store handlers as named arrow functions so they can be removed by
  // reference in ngOnDestroy via offWebRtcEvent(). Anonymous functions cannot
  // be removed — this was causing listeners to leak across overlay instances.
  private readonly onReceiveOffer = async (from: string, offer: string) => {
    this.offerPending = offer;
    // The offer will be processed when accept() is called (or immediately if
    // already active, e.g. for mid-call renegotiation).
    if (this.state() === 'active' && this.pc) {
      await this.handleRemoteOffer(offer);
    }
  };

  private readonly onReceiveAnswer = async (_from: string, answer: string) => {
    if (this.pc) await this.pc.setRemoteDescription(JSON.parse(answer));
  };

  private readonly onReceiveIceCandidate = async (_from: string, candidate: string) => {
    if (this.pc) {
      try { await this.pc.addIceCandidate(JSON.parse(candidate)); } catch {}
    }
  };

  private readonly onCallEnded = () => this.cleanup();

  // FIX: CallResponse is now registered in ngOnInit alongside all other handlers,
  // not inside startCall(). Previously it was added fresh on every call attempt,
  // causing the handler to stack up and fire multiple times.
  private readonly onCallResponse = async (_from: string, accepted: boolean) => {
    if (!accepted) {
      this.cleanup();
    } else {
      this.state.set('active');
    }
  };

  ngOnInit() {
    // Register all WebRTC signaling events once here.
    this.signalR.onWebRtcEvent('ReceiveOffer', this.onReceiveOffer);
    this.signalR.onWebRtcEvent('ReceiveAnswer', this.onReceiveAnswer);
    this.signalR.onWebRtcEvent('ReceiveIceCandidate', this.onReceiveIceCandidate);
    this.signalR.onWebRtcEvent('CallEnded', this.onCallEnded);
    this.signalR.onWebRtcEvent('CallResponse', this.onCallResponse);

    if (this.isInitiator) {
      this.state.set('calling');
      this.startCall();
    } else {
      this.state.set('incoming');
    }
  }

  async accept() {
    this.state.set('active');
    await this.setupMedia();

    // FIX: Create the peer connection AFTER media is ready so local tracks are
    // attached before the offer is processed. Previously createPeerConnection()
    // was called inside handleRemoteOffer(), which ran before setupMedia() had
    // a chance to attach tracks — resulting in audio/video never being sent.
    this.createPeerConnection();

    if (this.offerPending) {
      await this.handleRemoteOffer(this.offerPending);
    }
  }

  reject() {
    this.signalR.sendCallResponse(this.callerId, false);
    this.cleanup();
  }

  async startCall() {
    await this.setupMedia();
    this.createPeerConnection();
    const offer = await this.pc!.createOffer();
    await this.pc!.setLocalDescription(offer);
    this.signalR.sendOffer(this.callerId, JSON.stringify(offer));
    // NOTE: CallResponse is handled by onCallResponse registered in ngOnInit.
  }

  // FIX: handleRemoteOffer no longer calls createPeerConnection() — that is
  // now the responsibility of accept() (for receiver) and startCall() (for
  // initiator), both of which guarantee media is set up first.
  private async handleRemoteOffer(offerJson: string) {
    if (!this.pc) {
      console.error('[WebRTC] handleRemoteOffer called before RTCPeerConnection was created');
      return;
    }
    await this.pc.setRemoteDescription(JSON.parse(offerJson));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    this.signalR.sendAnswer(this.callerId, JSON.stringify(answer));
    this.offerPending = null;
  }

  private async setupMedia() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: this.callType === 'video',
        audio: true
      });
      setTimeout(() => {
        if (this.localVideoEl?.nativeElement)
          this.localVideoEl.nativeElement.srcObject = this.localStream;
      }, 100);
    } catch (e) {
      console.warn('[WebRTC] Media access denied, continuing audio-only', e);
      this.callType = 'audio';
    }
  }

  private createPeerConnection() {
    this.pc = new RTCPeerConnection({ iceServers: this.ICE_SERVERS });
    this.localStream?.getTracks().forEach(t => this.pc!.addTrack(t, this.localStream!));

    this.pc.onicecandidate = e => {
      if (e.candidate) this.signalR.sendIceCandidate(this.callerId, JSON.stringify(e.candidate));
    };

    this.pc.ontrack = e => {
      setTimeout(() => {
        if (this.remoteVideoEl?.nativeElement)
          this.remoteVideoEl.nativeElement.srcObject = e.streams[0];
      }, 100);
    };

    // FIX: startTimer() is only called here, guarded so it fires at most once.
    // The previous code called startTimer() both inside onconnectionstatechange
    // AND unconditionally right after creating the PC, causing a double-speed
    // timer and a leaked interval reference.
    this.pc.onconnectionstatechange = () => {
      if (this.pc?.connectionState === 'connected') {
        if (this.state() !== 'active') this.state.set('active');
        if (!this.timerInterval) this.startTimer();
      }
      if (this.pc?.connectionState === 'failed' || this.pc?.connectionState === 'disconnected') {
        console.warn('[WebRTC] Connection state:', this.pc.connectionState);
      }
    };
  }

  private startTimer() {
    this.callStart = Date.now();
    this.timerInterval = setInterval(() => {
      this.secondsElapsed.set(Math.floor((Date.now() - this.callStart) / 1000));
    }, 1000);
  }

  toggleMic() {
    this.localStream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    this.micMuted.update(v => !v);
  }

  toggleCam() {
    this.localStream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    this.camOff.update(v => !v);
  }

  hangUp() {
    this.signalR.endCall(this.callerId);
    this.cleanup();
  }

  private cleanup() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.localStream?.getTracks().forEach(t => t.stop());
    this.localStream = null;
    this.pc?.close();
    this.pc = null;
    this.offerPending = null;
    this.callEnded.emit();
  }

  ngOnDestroy() {
    // FIX: Remove all named handlers so they don't outlive this overlay instance.
    // Without this, handlers accumulate in SignalRService.webRtcHandlers and fire
    // for every subsequent call even after this component is destroyed.
    this.signalR.offWebRtcEvent('ReceiveOffer', this.onReceiveOffer);
    this.signalR.offWebRtcEvent('ReceiveAnswer', this.onReceiveAnswer);
    this.signalR.offWebRtcEvent('ReceiveIceCandidate', this.onReceiveIceCandidate);
    this.signalR.offWebRtcEvent('CallEnded', this.onCallEnded);
    this.signalR.offWebRtcEvent('CallResponse', this.onCallResponse);
    this.cleanup();
  }
}