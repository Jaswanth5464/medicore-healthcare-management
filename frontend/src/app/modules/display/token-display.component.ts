import { Component, OnInit, signal, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../core/services/config.service';

// const BASE_URL = 'https://localhost:7113';

@Component({
  selector: 'app-token-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './token-display.component.html',
  styleUrls: ['./token-display.component.css']
})
export class TokenDisplayComponent implements OnInit, OnDestroy {
  private readonly config = inject(ConfigService);
  private readonly BASE_URL = this.config.baseApiUrl;
  activeTokens = signal<any[]>([]);
  refreshInterval: any;
  currentTime = signal<Date>(new Date());
  clockInterval: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchTokens();
    // Auto-refresh every 10 seconds
    this.refreshInterval = setInterval(() => {
      this.fetchTokens();
    }, 10000);

    // Update clock every second
    this.clockInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  fetchTokens() {
    this.http.get<{success: boolean, data: any[]}>(`${this.BASE_URL}/api/appointments/live-tokens`)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.activeTokens.set(res.data);
          }
        },
        error: (err) => console.error('Failed to fetch tokens', err)
      });
  }

  get inConsultationTokens() {
    return this.activeTokens().filter(t => t.status === 'WithDoctor');
  }

  get waitingTokens() {
    return this.activeTokens().filter(t => t.status === 'CheckedIn');
  }
}
