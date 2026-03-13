import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterLink],
  template: `
    <div class="login-root" [@pageAnimation]>

      <!-- Left Panel -->
      <div class="brand-panel" [@brandSlide]>
        <div class="brand-content">
          <div class="brand-logo" [@itemFade]>
            <div class="logo-icon">
              <svg viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="white" fill-opacity="0.15"/>
                <path d="M24 10v28M10 24h28" stroke="white" stroke-width="4" stroke-linecap="round"/>
                <circle cx="24" cy="24" r="8" stroke="white" stroke-width="2.5" fill="none"/>
              </svg>
            </div>
            <div class="brand-name">
              <span class="brand-medi">Medi</span><span class="brand-core">Core</span>
            </div>
          </div>

          <div class="brand-tagline" [@itemFade]>
            <h1>Enterprise Hospital<br/>Management System</h1>
            <p>Delivering precision, efficiency, and compassionate care through intelligent technology.</p>
          </div>

          <div class="brand-stats" [@itemFade]>
            <div class="stat-item">
              <span class="stat-number">10+</span>
              <span class="stat-label">Departments</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-number">Real-time</span>
              <span class="stat-label">Monitoring</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-number">Secure</span>
              <span class="stat-label">HIPAA Ready</span>
            </div>
          </div>

          <div class="brand-modules" [@itemFade]>
            <div class="module-tag" *ngFor="let m of modules">{{ m }}</div>
          </div>
        </div>
        <div class="brand-bg-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
        </div>
      </div>

      <!-- Right Panel -->
      <div class="form-panel" [@formSlide]>
        <div class="form-container">

          <div class="mobile-logo" [@itemFade]>
            <div class="logo-icon-sm">
              <svg viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="12" fill="#0f4c81"/>
                <path d="M24 10v28M10 24h28" stroke="white" stroke-width="4" stroke-linecap="round"/>
                <circle cx="24" cy="24" r="8" stroke="white" stroke-width="2.5" fill="none"/>
              </svg>
            </div>
            <span class="mobile-brand"><span>Medi</span>Core</span>
          </div>

          <div class="form-header" [@itemFade]>
            <h2 *ngIf="!showRoleSelection()">Welcome back</h2>
            <h2 *ngIf="showRoleSelection()">Select Role</h2>
            <p *ngIf="!showRoleSelection()">Sign in to your MediCore account</p>
            <p *ngIf="showRoleSelection()">You have multiple roles. Choose one for this session.</p>
          </div>

          <form *ngIf="!showRoleSelection()" [formGroup]="loginForm" (ngSubmit)="onLogin()" class="login-form" [@formAppear]>

            <div class="field-group">
              <label for="email">Email Address</label>
              <div class="input-wrapper"
                [class.focused]="emailFocused()"
                [class.error]="showEmailError()">
                <div class="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  placeholder="doctor@medicore.com"
                  autocomplete="email"
                  (focus)="emailFocused.set(true)"
                  (blur)="emailFocused.set(false)"
                />
              </div>
              <span class="field-error" *ngIf="showEmailError()">
                Please enter a valid email address
              </span>
            </div>

            <div class="field-group">
              <label for="password">Password</label>
              <div class="input-wrapper"
                [class.focused]="passwordFocused()"
                [class.error]="showPasswordError()">
                <div class="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="Enter your password"
                  autocomplete="current-password"
                  (focus)="passwordFocused.set(true)"
                  (blur)="passwordFocused.set(false)"
                />
                <button type="button" class="toggle-password"
                  (click)="showPassword.set(!showPassword())">
                  <svg *ngIf="!showPassword()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg *ngIf="showPassword()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
              <span class="field-error" *ngIf="showPasswordError()">
                Password is required
              </span>
            </div>

            <div class="error-alert" *ngIf="errorMessage()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {{ errorMessage() }}
            </div>

            <button type="submit" class="submit-btn"
              [class.loading]="isLoading()"
              [disabled]="isLoading()">
              <span *ngIf="!isLoading()">Sign In to MediCore</span>
              <span *ngIf="isLoading()" class="loading-content">
                <span class="spinner"></span>
                Authenticating...
              </span>
            </button>

          </form>

          <div *ngIf="showRoleSelection()" class="role-selection" [@formAppear]>
             <div class="role-grid">
                <button *ngFor="let role of availableRoles()" (click)="selectRole(role)" class="role-btn">
                   {{ role }}
                </button>
             </div>
          </div>

          <div class="test-credentials" *ngIf="!showRoleSelection()" [@itemFade]>
            <div class="test-header">
              <div class="test-line"></div>
              <span>Test Credentials</span>
              <div class="test-line"></div>
            </div>
            <div class="credential-grid">
              <div class="credential-item"
                *ngFor="let cred of testCredentials"
                (click)="fillCredentials(cred)">
                <div class="cred-role">{{ cred.role }}</div>
                <div class="cred-email">{{ cred.email }}</div>
              </div>
            </div>
          </div>

          <div class="form-footer">
  <p>Don't have an account? <a routerLink="/auth/register" style="color:#0f4c81;font-weight:600;text-decoration:none">Register as Patient</a></p>
         </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

  .login-root {
  display: flex;
  min-height: 100vh;
  font-family: 'DM Sans', sans-serif;
  background: #f0f4f8;
  overflow-y: auto;
}

  .brand-panel {
  flex: 1;
  background: linear-gradient(145deg, #0a2744 0%, #0f4c81 50%, #1565a8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  position: relative;
  overflow-y: auto;
  min-height: 100vh;
}

    @media (max-width: 768px) { .brand-panel { display: none; } }

    .brand-content { position: relative; z-index: 2; color: white; max-width: 420px; }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 56px;
    }

    .logo-icon svg { width: 52px; height: 52px; }

    .brand-name { font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .brand-medi { color: white; }
    .brand-core { color: #7dd3fc; }

    .brand-tagline h1 {
      font-family: 'DM Serif Display', serif;
      font-size: 42px;
      line-height: 1.15;
      font-weight: 400;
      margin-bottom: 16px;
      color: white;
    }

    .brand-tagline p {
      font-size: 15px;
      line-height: 1.7;
      color: rgba(255,255,255,0.7);
      margin-bottom: 48px;
    }

    .brand-stats {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 40px;
      padding: 24px;
      background: rgba(255,255,255,0.08);
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.12);
    }

    .stat-item { text-align: center; flex: 1; }
    .stat-number { display: block; font-size: 18px; font-weight: 700; color: #7dd3fc; margin-bottom: 4px; }
    .stat-label { font-size: 11px; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.15); }

    .brand-modules { display: flex; flex-wrap: wrap; gap: 8px; }

    .module-tag {
      padding: 6px 14px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 100px;
      font-size: 12px;
      color: rgba(255,255,255,0.8);
    }

    .brand-bg-shapes { position: absolute; inset: 0; z-index: 1; }

    .shape { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.04); }
    .shape-1 { width: 400px; height: 400px; top: -100px; right: -100px; }
    .shape-2 { width: 250px; height: 250px; bottom: 50px; left: -80px; background: rgba(125,211,252,0.06); }
    .shape-3 { width: 150px; height: 150px; top: 40%; right: 20px; }

    .form-panel {
      width: 480px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      padding: 40px 32px;
    }

    @media (max-width: 768px) {
     .form-panel {
  width: 480px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: #ffffff;
  padding: 40px 32px;
  overflow-y: auto;
  min-height: 100vh;
}  }  

    .form-container { width: 100%; max-width: 360px; }

    .mobile-logo {
      display: none;
      align-items: center;
      gap: 10px;
      margin-bottom: 32px;
    }

    @media (max-width: 768px) { .mobile-logo { display: flex; } }

    .logo-icon-sm svg { width: 36px; height: 36px; }

    .mobile-brand { font-size: 22px; font-weight: 700; color: #0a2744; }
    .mobile-brand span { color: #0f4c81; }

    .form-header { margin-bottom: 32px; }
    .form-header h2 { font-size: 26px; font-weight: 700; color: #0a2744; letter-spacing: -0.5px; margin-bottom: 6px; }
    .form-header p { font-size: 14px; color: #64748b; }

    .login-form { display: flex; flex-direction: column; gap: 20px; }

    .field-group { display: flex; flex-direction: column; gap: 8px; }

    .role-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
    .role-btn {
      padding: 16px;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      color: #0f4c81;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }
    .role-btn:hover {
      border-color: #0f4c81;
      background: #eff6ff;
      transform: translateY(-2px);
    }

    .field-group label { font-size: 13px; font-weight: 600; color: #374151; }

    .input-wrapper {
      display: flex;
      align-items: center;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      background: #f8fafc;
      transition: all 0.2s;
      overflow: hidden;
    }

    .input-wrapper.focused {
      border-color: #0f4c81;
      background: white;
      box-shadow: 0 0 0 3px rgba(15,76,129,0.08);
    }

    .input-wrapper.error { border-color: #ef4444; background: #fff5f5; }

    .input-icon { padding: 0 12px; display: flex; align-items: center; color: #94a3b8; }
    .input-icon svg { width: 16px; height: 16px; }

    .input-wrapper input {
      flex: 1;
      padding: 13px 0;
      border: none;
      background: transparent;
      font-size: 14px;
      color: #0f172a;
      font-family: 'DM Sans', sans-serif;
      outline: none;
    }

    .input-wrapper input::placeholder { color: #cbd5e1; }

    .toggle-password {
      padding: 0 12px;
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      align-items: center;
      transition: color 0.2s;
    }

    .toggle-password:hover { color: #0f4c81; }
    .toggle-password svg { width: 16px; height: 16px; }

    .field-error { font-size: 12px; color: #ef4444; font-weight: 500; }

    .error-alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      color: #dc2626;
      font-size: 13px;
      font-weight: 500;
    }

    .error-alert svg { width: 16px; height: 16px; flex-shrink: 0; }

    .submit-btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #0a2744 0%, #0f4c81 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 4px;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 25px rgba(15,76,129,0.35);
    }

    .submit-btn:disabled { opacity: 0.8; cursor: not-allowed; }

    .loading-content { display: flex; align-items: center; justify-content: center; gap: 10px; }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .test-credentials { margin-top: 28px; }

    .test-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
    .test-line { flex: 1; height: 1px; background: #e2e8f0; }
    .test-header span { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; white-space: nowrap; }

    .credential-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

    .credential-item {
      padding: 10px 12px;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      background: #f8fafc;
    }

    .credential-item:hover { border-color: #0f4c81; background: #eff6ff; }

    .cred-role { font-size: 11px; font-weight: 700; color: #0f4c81; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
    .cred-email { font-size: 11px; color: #64748b; }

    .form-footer { margin-top: 32px; text-align: center; }
    .form-footer p { font-size: 11px; color: #94a3b8; }

    /* ===== ANIMATIONS ===== */
    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-60px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(60px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes gradientShift {
      0%, 100% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }

    .brand-panel {
      animation: slideInLeft 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .form-panel {
      animation: slideInRight 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .brand-logo {
      animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s forwards;
      opacity: 0;
    }

    .brand-tagline {
      animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards;
      opacity: 0;
    }

    .brand-stats {
      animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards;
      opacity: 0;
    }

    .brand-modules {
      animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s forwards;
      opacity: 0;
    }

    .mobile-logo {
      animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.15s forwards;
      opacity: 0;
    }

    .form-header {
      animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.25s forwards;
      opacity: 0;
    }

    .login-form {
      animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.35s forwards;
      opacity: 0;
    }

    .test-credentials {
      animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.5s forwards;
      opacity: 0;
    }

    .field-group {
      animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .module-tag {
      animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .submit-btn {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .submit-btn:hover:not(:disabled) {
      animation: none;
      transform: translateY(-2px);
      box-shadow: 0 12px 35px rgba(15,76,129,0.4);
    }

    .credential-item {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .credential-item:hover {
      animation: float 2s ease-in-out infinite;
    }

    .input-wrapper {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .logo-icon svg {
      animation: float 3s ease-in-out infinite;
    }

    .stat-number {
      animation: pulse 2s ease-in-out infinite;
    }

    @media (max-width: 768px) {
      .brand-panel {
        animation: none;
      }

      .form-panel {
        animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(60px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class LoginComponent {
  loginForm!: FormGroup;

  emailFocused = signal(false);
  passwordFocused = signal(false);
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  showRoleSelection = signal(false);
  availableRoles = signal<string[]>([]);
  tempAuthData = signal<any>(null);

  modules = ['Reception', 'Doctor', 'Pharmacy', 'Laboratory', 'Finance', 'Bed Mgmt', 'Mentor', 'Notifications'];

  testCredentials = [
    { role: 'Super Admin', email: 'jaswanth@medicore.com', password: 'Admin@123' },
    { role: 'Doctor', email: 'doctor@medicore.com', password: 'Admin@123' },
    { role: 'Receptionist', email: 'receptionist@medicore.com', password: '9293405122@Aa' },
    { role: 'Finance', email: 'finance@gmail.com', password: '123456' },
    { role: 'Nurse', email: 'nurse@medicore.com', password: 'Admin@123' },
    { role: 'Patient', email: 'patient@medicore.com', password: 'Admin@123' },
  ];

 constructor(
  private fb: FormBuilder,
  private authService: AuthService,
  private router: Router
) {
  this.loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });
}

  showEmailError(): boolean {
    const ctrl = this.loginForm.get('email');
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  showPasswordError(): boolean {
    const ctrl = this.loginForm.get('password');
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  fillCredentials(cred: any): void {
    this.loginForm.patchValue({ email: cred.email, password: cred.password });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value;

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          const roles = response.data.roles || [];
          if (roles.length > 1) {
            this.availableRoles.set(roles);
            this.tempAuthData.set(response.data);
            this.showRoleSelection.set(true);
          } else {
            const activeRole = roles.length === 1 ? roles[0] : 'Patient';
            this.authService.completeLogin(response.data, activeRole);
            this.authService.redirectToDashboard();
          }
        } else {
          this.errorMessage.set(response.message);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message ?? 'Login failed. Please check your credentials.'
        );
      },
    });
  }

  selectRole(role: string): void {
     const data = this.tempAuthData();
     if(data) {
        this.authService.completeLogin(data, role);
        this.authService.redirectToDashboard();
     }
  }
}