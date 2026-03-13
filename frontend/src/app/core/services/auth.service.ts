import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import {
  LoginRequest,
  AuthResponse,
  ApiResponse,
  UserState
} from '../models/auth.models';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly config = inject(ConfigService);
  private readonly API_URL = this.config.apiUrl;

  private _currentUser = signal<UserState | null>(this.loadFromSession());

  currentUser = this._currentUser.asReadonly();
  isAuthenticated = computed(() => !!this._currentUser());
  userRole = computed(() => this._currentUser()?.role ?? '');
  userRoles = computed(() => this._currentUser()?.roles ?? []);
  userFullName = computed(() => this._currentUser()?.fullName ?? '');

  constructor(private http: HttpClient, private router: Router) { }

  login(request: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.API_URL}/auth/login`, request);
  }

  completeLogin(data: AuthResponse, activeRole: string): void {
    const state: UserState = {
      id: data.id,
      fullName: data.fullName,
      email: data.email,
      roles: data.roles || [],
      role: activeRole,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
    };
    sessionStorage.setItem('medicore_user', JSON.stringify(state));
    this._currentUser.set(state);
  }

  logout(): void {
    const refreshToken = this._currentUser()?.refreshToken;
    if (refreshToken) {
      this.http
        .post(`${this.API_URL}/auth/logout`, { refreshToken })
        .subscribe();
    }
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<ApiResponse<AuthResponse>> {
    const refreshToken = this._currentUser()?.refreshToken ?? '';
    const currentActiveRole = this._currentUser()?.role ?? '';
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.API_URL}/auth/refresh`, {
        refreshToken,
      })
      .pipe(
        tap((response) => {
          if (response.success) {
            this.completeLogin(response.data, currentActiveRole);
          }
        })
      );
  }

  getAccessToken(): string {
    return this._currentUser()?.accessToken ?? '';
  }

  redirectToDashboard(): void {
    const role = this.userRole();
    const routes: Record<string, string> = {
      SuperAdmin: '/dashboard/admin',
      HospitalAdmin: '/dashboard/admin',
      Doctor: '/dashboard/doctor',
      Nurse: '/dashboard/nurse',
      Patient: '/dashboard/patient',
      Pharmacist: '/dashboard/pharmacist',
      LabTechnician: '/dashboard/lab',
      FinanceStaff: '/dashboard/finance',
      Receptionist: '/dashboard/receptionist',
      Mentor: '/dashboard/doctor',
    };
    this.router.navigate([routes[role] ?? '/dashboard/patient']);
  }

  // Helper method removed (replaced by completeLogin)

  private clearSession(): void {
    sessionStorage.removeItem('medicore_user');
    this._currentUser.set(null);
  }

  private loadFromSession(): UserState | null {
    const stored = sessionStorage.getItem('medicore_user');

    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        // Fix for missing ID: extract from JWT token if missing
        if (!parsed.id && parsed.accessToken) {
          try {
            const tokenPayload = JSON.parse(atob(parsed.accessToken.split('.')[1]));
            const userId = tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
            if (userId) {
              parsed.id = parseInt(userId, 10);
              // Update session storage with the fixed data
              sessionStorage.setItem('medicore_user', JSON.stringify(parsed));
            }
          } catch (tokenError) {
            console.error('Error extracting user ID from JWT token:', tokenError);
          }
        }

        return parsed;
      } catch (error) {
        console.error('Error parsing session data:', error);
        return null;
      }
    }

    return null;
  }
}