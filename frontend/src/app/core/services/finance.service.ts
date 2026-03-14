import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigService } from './config.service';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);
  private readonly auth = inject(AuthService);
  private readonly API_URL = this.config.apiUrl;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.auth.getAccessToken()}`
    });
  }

  getPaymentLogs(): Observable<any> {
    return this.http.get(`${this.API_URL}/finance/payment-logs`, { headers: this.getHeaders() });
  }

  getPendingPayments(): Observable<any> {
    return this.http.get(`${this.API_URL}/appointments/pending-payments`, { headers: this.getHeaders() });
  }

  confirmPayment(appointmentId: number, paymentMode: string): Observable<any> {
    return this.http.patch(`${this.API_URL}/appointments/${appointmentId}/payment`, { paymentMode }, { headers: this.getHeaders() });
  }

  getRevenueAnalytics(): Observable<any> {
    return this.http.get(`${this.API_URL}/reports/revenue-summary`, { headers: this.getHeaders() });
  }
}
