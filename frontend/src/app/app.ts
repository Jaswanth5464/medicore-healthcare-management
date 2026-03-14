import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastComponent } from './core/components/toast/toast.component';
import { SignalRService } from './core/services/signalr.service';
import { CallOverlayComponent } from './modules/communication/chat/call-overlay.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, CallOverlayComponent, CommonModule],
  template: `
    <router-outlet />
    <app-toast />

    <!-- Global WebRTC Call Overlay -->
    <app-call-overlay
      *ngIf="signalR.currentCall()"
      [callerId]="signalR.currentCall()!.userId"
      [callerName]="signalR.currentCall()!.userName"
      [callType]="signalR.currentCall()!.type"
      [isInitiator]="signalR.currentCall()!.isInitiator"
      (callEnded)="signalR.currentCall.set(null)">
    </app-call-overlay>
  `,
})
export class AppComponent {
  public signalR = inject(SignalRService);
}