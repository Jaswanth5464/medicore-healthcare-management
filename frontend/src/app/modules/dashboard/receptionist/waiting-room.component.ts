import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AppointmentStateService } from '../../../core/services/appointment-state.service';

@Component({
  selector: 'app-waiting-room',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="waiting-room">
      <div class="tv-header">
        <div class="logo">MEDICORE <span>HMS</span></div>
        <div class="title">OUTPATIENT QUEUE DISPLAY</div>
        <div class="clock">{{ currentTime() }}</div>
      </div>

      <div class="content">
        <!-- Currently With Doctor -->
        <div class="main-display">
          <div class="section-title">CONSULTATION IN PROGRESS</div>
          <div class="cards-grid">
            <div class="active-card" *ngFor="let a of state.withDoctorPatients()">
              <div class="token">{{ a.tokenNumber }}</div>
              <div class="room-info">
                <span class="room-lbl">ROOM</span>
                <span class="room-val">{{ a.id % 10 + 1 }}</span>
              </div>
              <div class="doc-info">
                <strong>Dr. {{ a.doctor.fullName }}</strong>
                <span>{{ a.department.name }}</span>
              </div>
              <div class="status-pulse">WITH DOCTOR</div>
            </div>
          </div>
          <div *ngIf="state.withDoctorPatients().length === 0" class="empty-main">
            PLEASE WAIT FOR YOUR TOKEN NUMBER
          </div>
        </div>

        <!-- Waiting List -->
        <div class="sidebar">
          <div class="section-title">NEXT IN QUEUE</div>
          <div class="waiting-list">
            <div class="waiting-item" *ngFor="let a of state.pendingQueue().slice(0, 10)">
              <span class="w-token">#{{ a.tokenNumber }}</span>
              <span class="w-name">{{ a.patient.fullName }}</span>
              <span class="w-status">{{ a.status === 'CheckedIn' ? 'ARRIVED' : 'SCHEDULED' }}</span>
            </div>
          </div>
          <div class="footer-note">
            Please keep your physical tokens ready and proceed when your number appears in the main display.
          </div>
        </div>
      </div>

      <div class="ticker">
        <marquee>Welcome to MediCore HMS. For emergency services, proceed to the Ground Floor triage. Our doctors are committed to your health and safety. Please maintain silence in the waiting area.</marquee>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; height:100vh; background:#0f172a; color:#fff; font-family:'Inter', sans-serif; overflow:hidden; }
    
    .tv-header { height:100px; background:#1e293b; display:flex; justify-content:space-between; align-items:center; padding:0 50px; border-bottom:4px solid #3b82f6; }
    .logo { font-size:32px; font-weight:900; color:#3b82f6; letter-spacing:-1px; }
    .logo span { color:#fff; opacity:0.7; }
    .title { font-size:24px; font-weight:700; color:#cbd5e1; }
    .clock { font-size:32px; font-weight:700; font-family:monospace; color:#3b82f6; }

    .content { display:grid; grid-template-columns:1fr 450px; height:calc(100vh - 160px); }
    
    .main-display { padding:40px; border-right:2px solid #334155; }
    .section-title { font-size:20px; font-weight:800; color:#94a3b8; margin-bottom:30px; letter-spacing:2px; text-transform:uppercase; border-left:6px solid #3b82f6; padding-left:15px; }

    .cards-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(400px, 1fr)); gap:30px; }
    .active-card { background:linear-gradient(135deg, #1e293b, #0f172a); border:2px solid #3b82f6; border-radius:24px; padding:30px; position:relative; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.5); }
    
    .token { font-size:80px; font-weight:900; color:#3b82f6; line-height:1; margin-bottom:10px; }
    .room-info { position:absolute; top:30px; right:30px; text-align:right; }
    .room-lbl { display:block; font-size:14px; color:#94a3b8; font-weight:700; }
    .room-val { font-size:48px; font-weight:900; color:#fff; }

    .doc-info { margin-top:20px; }
    .doc-info strong { display:block; font-size:24px; margin-bottom:4px; color:#fff; }
    .doc-info span { font-size:16px; color:#94a3b8; }

    .status-pulse { margin-top:30px; font-size:14px; font-weight:800; color:#10b981; animation:pulse 2s infinite; }
    @keyframes pulse { 0%{opacity:1;} 50%{opacity:0.4;} 100%{opacity:1;} }

    .empty-main { height:100%; display:flex; align-items:center; justify-content:center; font-size:40px; font-weight:900; color:#334155; opacity:0.5; }

    .sidebar { background:#1e293b; padding:40px; display:flex; flex-direction:column; }
    .waiting-list { flex:1; }
    .waiting-item { display:flex; justify-content:space-between; align-items:center; padding:15px 20px; background:rgba(255,255,255,0.03); border-radius:12px; margin-bottom:12px; border-left:4px solid #475569; }
    .w-token { font-size:24px; font-weight:800; color:#3b82f6; font-family:monospace; }
    .w-name { font-size:18px; font-weight:600; color:#e2e8f0; }
    .w-status { font-size:12px; font-weight:800; background:#334155; color:#94a3b8; padding:4px 10px; border-radius:6px; }

    .footer-note { background:rgba(59,130,246,0.1); padding:20px; border-radius:12px; color:#94a3b8; font-size:14px; line-height:1.5; }

    .ticker { height:60px; background:#3b82f6; display:flex; align-items:center; overflow:hidden; font-size:22px; font-weight:700; color:#fff; }
  `]
})
export class WaitingRoomComponent implements OnInit {
  currentTime = signal('');

  constructor(public state: AppointmentStateService, private http: HttpClient) {}

  ngOnInit() {
    this.updateTime();
    setInterval(() => this.updateTime(), 1000);
    
    // Auto refresh queue every 15 seconds
    this.state.loadToday({}); // No headers for public view if allowed, normally would need token but for TV display we might have a dedicated restricted token
    setInterval(() => this.state.loadToday({}), 15000);
  }

  updateTime() {
    this.currentTime.set(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }
}
