import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../../../core/services/config.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="register-root" [@pageAnimation]>

      <!-- Left Branding Panel -->
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
              <span class="medi">Medi</span><span class="core">Core</span>
            </div>
          </div>

          <div class="brand-tagline" [@itemFade]>
            <h1>Your Health,<br/>Our Priority</h1>
            <p>Join MediCore and get access to world-class healthcare services, digital prescriptions, lab reports and appointment management — all in one place.</p>
          </div>

          <div class="feature-list" [@itemFade]>
            <div class="feature-item" *ngFor="let f of features">
              <div class="feature-icon">
                <span [innerHTML]="f.icon"></span>
              </div>
              <div class="feature-text">
                <div class="feature-title">{{ f.title }}</div>
                <div class="feature-desc">{{ f.desc }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-shapes">
          <div class="shape s1"></div>
          <div class="shape s2"></div>
        </div>
      </div>

      <!-- Right Form Panel -->
      <div class="form-panel" [@formSlide]>
        <div class="form-container">

          <!-- Mobile Logo -->
          <div class="mobile-logo" [@itemFade]>
            <svg viewBox="0 0 48 48" fill="none" width="36" height="36">
              <rect width="48" height="48" rx="12" fill="#0f4c81"/>
              <path d="M24 10v28M10 24h28" stroke="white" stroke-width="4" stroke-linecap="round"/>
            </svg>
            <span class="mobile-brand"><span>Medi</span>Core</span>
          </div>

          <!-- Step Indicator -->
          <div class="step-indicator" [@itemFade]>
            <div class="step" [class.active]="currentStep() === 1" [class.done]="currentStep() > 1">
              <div class="step-circle">
                <span *ngIf="currentStep() <= 1">1</span>
                <svg *ngIf="currentStep() > 1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span class="step-label">Personal Info</span>
            </div>
            <div class="step-line" [class.done]="currentStep() > 1"></div>
            <div class="step" [class.active]="currentStep() === 2">
              <div class="step-circle">2</div>
              <span class="step-label">Account Setup</span>
            </div>
          </div>

          <div class="form-header" [@itemFade]>
            <h2>{{ currentStep() === 1 ? 'Create your account' : 'Set up your login' }}</h2>
            <p>{{ currentStep() === 1 ? 'Enter your personal information to get started' : 'Choose a secure password for your account' }}</p>
          </div>

          <!-- Step 1 Form -->
          <form *ngIf="currentStep() === 1"
            [formGroup]="step1Form"
            (ngSubmit)="goToStep2()"
            class="register-form">

            <div class="field-row">
              <div class="field-group">
                <label>Full Name</label>
                <div class="input-wrap" [class.focused]="focuses['fullName']" [class.error]="hasError(step1Form, 'fullName')">
                  <div class="input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <input type="text" formControlName="fullName" placeholder="Jaswanth Kumar"
                    (focus)="focuses['fullName']=true" (blur)="focuses['fullName']=false"/>
                </div>
                <span class="ferr" *ngIf="hasError(step1Form, 'fullName')">Full name is required</span>
              </div>

              <div class="field-group">
                <label>Phone Number</label>
                <div class="input-wrap" [class.focused]="focuses['phone']" [class.error]="hasError(step1Form, 'phoneNumber')">
                  <div class="input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z"/>
                    </svg>
                  </div>
                  <input type="tel" formControlName="phoneNumber" placeholder="9876543210"
                    (focus)="focuses['phone']=true" (blur)="focuses['phone']=false"/>
                </div>
                <span class="ferr" *ngIf="hasError(step1Form, 'phoneNumber')">Valid phone number required</span>
              </div>
            </div>

            <div class="field-group">
              <label>Date of Birth</label>
              <div class="input-wrap" [class.focused]="focuses['dob']">
                <div class="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <input type="date" formControlName="dateOfBirth"
                  (focus)="focuses['dob']=true" (blur)="focuses['dob']=false"/>
              </div>
            </div>

            <div class="field-group">
              <label>Gender</label>
              <div class="gender-options">
                <label class="gender-option" *ngFor="let g of genders"
                  [class.selected]="step1Form.get('gender')?.value === g.value">
                  <input type="radio" formControlName="gender" [value]="g.value"/>
                  <span [innerHTML]="g.icon"></span>
                  {{ g.label }}
                </label>
              </div>
            </div>

            <div class="field-group">
              <label>Address</label>
              <div class="input-wrap" [class.focused]="focuses['address']">
                <div class="input-icon" style="align-self:flex-start;padding-top:13px">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <textarea formControlName="address" placeholder="Enter your full address" rows="2"
                  (focus)="focuses['address']=true" (blur)="focuses['address']=false"></textarea>
              </div>
            </div>

            <button type="submit" class="btn-primary">
              Continue to Account Setup
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </form>

          <!-- Step 2 Form -->
          <form *ngIf="currentStep() === 2"
            [formGroup]="step2Form"
            (ngSubmit)="onRegister()"
            class="register-form">

            <div class="field-group">
              <label>Email Address</label>
              <div class="input-wrap" [class.focused]="focuses['email']" [class.error]="hasError(step2Form, 'email')">
                <div class="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <input type="email" formControlName="email" placeholder="patient@email.com"
                  (focus)="focuses['email']=true" (blur)="focuses['email']=false"/>
              </div>
              <span class="ferr" *ngIf="hasError(step2Form, 'email')">Valid email is required</span>
            </div>

            <div class="field-group">
              <label>Password</label>
              <div class="input-wrap" [class.focused]="focuses['pass']" [class.error]="hasError(step2Form, 'password')">
                <div class="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input [type]="showPass() ? 'text' : 'password'" formControlName="password"
                  placeholder="Min 8 characters"
                  (focus)="focuses['pass']=true" (blur)="focuses['pass']=false"/>
                <button type="button" class="toggle-pass" (click)="showPass.set(!showPass())">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
              <span class="ferr" *ngIf="hasError(step2Form, 'password')">Password must be at least 8 characters</span>
            </div>

            <!-- Password Strength -->
            <div class="strength-bar" *ngIf="step2Form.get('password')?.value">
              <div class="strength-track">
                <div class="strength-fill" [style.width]="passwordStrength() + '%'"
                  [style.background]="strengthColor()"></div>
              </div>
              <span class="strength-label" [style.color]="strengthColor()">{{ strengthLabel() }}</span>
            </div>

            <div class="field-group">
              <label>Confirm Password</label>
              <div class="input-wrap" [class.focused]="focuses['cpass']" [class.error]="passwordMismatch()">
                <div class="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input [type]="showPass() ? 'text' : 'password'" formControlName="confirmPassword"
                  placeholder="Repeat your password"
                  (focus)="focuses['cpass']=true" (blur)="focuses['cpass']=false"/>
              </div>
              <span class="ferr" *ngIf="passwordMismatch()">Passwords do not match</span>
            </div>

            <div class="field-group">
              <label>Emergency Contact</label>
              <div class="input-wrap" [class.focused]="focuses['emergency']">
                <div class="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z"/>
                  </svg>
                </div>
                <input type="tel" formControlName="emergencyContact" placeholder="Emergency contact number"
                  (focus)="focuses['emergency']=true" (blur)="focuses['emergency']=false"/>
              </div>
            </div>

            <div class="terms-check">
              <label class="checkbox-label">
                <input type="checkbox" formControlName="agreeTerms"/>
                <span class="checkmark"></span>
                I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
              </label>
            </div>

            <div class="error-alert" *ngIf="errorMsg()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {{ errorMsg() }}
            </div>

            <div class="form-actions">
              <button type="button" class="btn-secondary" (click)="currentStep.set(1)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Back
              </button>
              <button type="submit" class="btn-primary flex-1"
                [disabled]="isLoading() || !step2Form.get('agreeTerms')?.value">
                <span *ngIf="!isLoading()">Create Account</span>
                <span *ngIf="isLoading()" class="loading-content">
                  <span class="spinner"></span> Creating account...
                </span>
              </button>
            </div>
          </form>

          <div class="signin-link">
            Already have an account? <a routerLink="/auth/login">Sign in</a>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .register-root {
      display: flex; min-height: 100vh;
      font-family: 'DM Sans', sans-serif; background: #f0f4f8;
    }

    /* Brand Panel */
    .brand-panel {
      flex: 1;
      background: linear-gradient(145deg, #0a2744 0%, #0f4c81 50%, #1565a8 100%);
      display: flex; align-items: center; justify-content: center;
      padding: 48px; position: relative; overflow: hidden;
    }
    @media (max-width: 900px) { .brand-panel { display: none; } }

    .brand-content { position: relative; z-index: 2; color: white; max-width: 400px; }

    .brand-logo { display: flex; align-items: center; gap: 14px; margin-bottom: 48px; }
    .logo-icon svg { width: 48px; height: 48px; }
    .brand-name { font-size: 26px; font-weight: 700; }
    .medi { color: white; }
    .core { color: #7dd3fc; }

    .brand-tagline h1 {
      font-family: 'DM Serif Display', serif;
      font-size: 38px; line-height: 1.2;
      margin-bottom: 14px; color: white;
    }
    .brand-tagline p { font-size: 14px; color: rgba(255,255,255,0.7); line-height: 1.7; margin-bottom: 40px; }

    .feature-list { display: flex; flex-direction: column; gap: 20px; }

    .feature-item { display: flex; align-items: flex-start; gap: 14px; }

    .feature-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .feature-icon :deep(svg) { width: 18px; height: 18px; color: #7dd3fc; }

    .feature-title { font-size: 14px; font-weight: 600; color: white; margin-bottom: 3px; }
    .feature-desc { font-size: 12px; color: rgba(255,255,255,0.6); }

    .bg-shapes { position: absolute; inset: 0; z-index: 1; }
    .shape { position: absolute; border-radius: 50%; }
    .s1 { width: 350px; height: 350px; top: -80px; right: -80px; background: rgba(255,255,255,0.04); }
    .s2 { width: 200px; height: 200px; bottom: 40px; left: -60px; background: rgba(125,211,252,0.06); }

    /* Form Panel */
    .form-panel {
      width: 520px; display: flex; align-items: center;
      justify-content: center; background: white; padding: 40px 32px;
      overflow-y: auto;
    }
    @media (max-width: 900px) { .form-panel { width: 100%; min-height: 100vh; align-items: flex-start; background: #f8fafc; } }

    .form-container { width: 100%; max-width: 420px; }

    .mobile-logo { display: none; align-items: center; gap: 10px; margin-bottom: 28px; }
    @media (max-width: 900px) { .mobile-logo { display: flex; } }
    .mobile-brand { font-size: 20px; font-weight: 700; color: #0a2744; }
    .mobile-brand span { color: #0f4c81; }

    /* Step Indicator */
    .step-indicator {
      display: flex; align-items: center; gap: 0;
      margin-bottom: 28px;
    }

    .step { display: flex; align-items: center; gap: 8px; }

    .step-circle {
      width: 32px; height: 32px; border-radius: 50%;
      border: 2px solid #e2e8f0;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 600; color: #94a3b8;
      transition: all 0.3s;
    }
    .step-circle svg { width: 14px; height: 14px; }

    .step.active .step-circle { border-color: #0f4c81; color: #0f4c81; background: #eff6ff; }
    .step.done .step-circle { border-color: #10b981; background: #10b981; color: white; }

    .step-label { font-size: 12px; font-weight: 500; color: #94a3b8; }
    .step.active .step-label { color: #0f4c81; font-weight: 600; }
    .step.done .step-label { color: #10b981; }

    .step-line { flex: 1; height: 2px; background: #e2e8f0; margin: 0 12px; transition: background 0.3s; }
    .step-line.done { background: #10b981; }

    /* Form Header */
    .form-header { margin-bottom: 24px; }
    .form-header h2 { font-size: 22px; font-weight: 700; color: #0a2744; margin-bottom: 4px; }
    .form-header p { font-size: 13px; color: #64748b; }

    /* Form */
    .register-form { display: flex; flex-direction: column; gap: 16px; }

    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 480px) { .field-row { grid-template-columns: 1fr; } }

    .field-group { display: flex; flex-direction: column; gap: 6px; }

    .field-group label { font-size: 12px; font-weight: 600; color: #374151; }

    .input-wrap {
      display: flex; align-items: center;
      border: 1.5px solid #e2e8f0; border-radius: 10px;
      background: #f8fafc; transition: all 0.2s; overflow: hidden;
    }
    .input-wrap.focused { border-color: #0f4c81; background: white; box-shadow: 0 0 0 3px rgba(15,76,129,0.08); }
    .input-wrap.error { border-color: #ef4444; background: #fff5f5; }

    .input-icon { padding: 0 10px; display: flex; align-items: center; color: #94a3b8; flex-shrink: 0; }
    .input-icon svg { width: 15px; height: 15px; }

    .input-wrap input, .input-wrap textarea {
      flex: 1; padding: 11px 0; border: none; background: transparent;
      font-size: 13px; color: #0f172a; font-family: 'DM Sans', sans-serif;
      outline: none; resize: none;
    }
    .input-wrap input::placeholder, .input-wrap textarea::placeholder { color: #cbd5e1; }

    .toggle-pass {
      padding: 0 10px; background: none; border: none;
      cursor: pointer; color: #94a3b8; display: flex; align-items: center;
    }
    .toggle-pass svg { width: 15px; height: 15px; }

    .ferr { font-size: 11px; color: #ef4444; font-weight: 500; }

    /* Gender Options */
    .gender-options { display: flex; gap: 8px; }

    .gender-option {
      flex: 1; display: flex; align-items: center; justify-content: center;
      gap: 6px; padding: 10px; border: 1.5px solid #e2e8f0;
      border-radius: 8px; cursor: pointer; font-size: 13px;
      color: #64748b; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
    }
    .gender-option input { display: none; }
    .gender-option :deep(svg) { width: 15px; height: 15px; }
    .gender-option.selected { border-color: #0f4c81; background: #eff6ff; color: #0f4c81; font-weight: 600; }

    /* Password Strength */
    .strength-bar { display: flex; align-items: center; gap: 10px; margin-top: -8px; }
    .strength-track { flex: 1; height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden; }
    .strength-fill { height: 100%; border-radius: 2px; transition: all 0.3s; }
    .strength-label { font-size: 11px; font-weight: 600; white-space: nowrap; }

    /* Terms */
    .terms-check { margin-top: 4px; }

    .checkbox-label {
      display: flex; align-items: flex-start; gap: 10px;
      font-size: 12px; color: #64748b; cursor: pointer; line-height: 1.5;
    }
    .checkbox-label input { margin-top: 2px; accent-color: #0f4c81; width: 14px; height: 14px; }
    .checkbox-label a { color: #0f4c81; text-decoration: none; font-weight: 500; }
    .checkbox-label a:hover { text-decoration: underline; }

    /* Error Alert */
    .error-alert {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 14px; background: #fef2f2;
      border: 1px solid #fecaca; border-radius: 8px;
      color: #dc2626; font-size: 12px; font-weight: 500;
    }
    .error-alert svg { width: 15px; height: 15px; flex-shrink: 0; }

    /* Buttons */
    .btn-primary {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 13px 20px; background: linear-gradient(135deg, #0a2744 0%, #0f4c81 100%);
      color: white; border: none; border-radius: 10px;
      font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-primary svg { width: 16px; height: 16px; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(15,76,129,0.3); }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
    .btn-primary.flex-1 { flex: 1; }

    .btn-secondary {
      display: flex; align-items: center; gap: 6px;
      padding: 13px 16px; background: white;
      color: #64748b; border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: 14px; font-weight: 500; font-family: 'DM Sans', sans-serif;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-secondary svg { width: 16px; height: 16px; }
    .btn-secondary:hover { border-color: #94a3b8; color: #0f172a; }

    .form-actions { display: flex; gap: 10px; }

    .loading-content { display: flex; align-items: center; gap: 8px; }
    .spinner {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Sign in link */
    .signin-link {
      margin-top: 24px; text-align: center;
      font-size: 13px; color: #64748b;
    }
    .signin-link a { color: #0f4c81; font-weight: 600; text-decoration: none; }
    .signin-link a:hover { text-decoration: underline; }

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

    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-10px);
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

    .feature-list {
      animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s forwards;
      opacity: 0;
    }

    .mobile-logo {
      animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.15s forwards;
      opacity: 0;
    }

    .step-indicator {
      animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.25s forwards;
      opacity: 0;
    }

    .form-header {
      animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.35s forwards;
      opacity: 0;
    }

    .register-form {
      animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.45s forwards;
      opacity: 0;
    }

    .signin-link {
      animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.55s forwards;
      opacity: 0;
    }

    .feature-item {
      animation: float 2s ease-in-out infinite;
    }

    .btn-primary {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn-primary:hover:not(:disabled) {
      animation: none;
      transform: translateY(-2px);
      box-shadow: 0 12px 35px rgba(15,76,129,0.4);
    }

    @media (max-width: 900px) {
      .brand-panel {
        animation: none;
      }

      .form-panel {
        animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }
    }
  `]
})
export class RegisterComponent implements OnInit {
  private readonly config = inject(ConfigService);
  private readonly API_URL = this.config.apiUrl;

  currentStep = signal(1);
  isLoading = signal(false);
  errorMsg = signal('');
  showPass = signal(false);
  focuses: Record<string, boolean> = {};
  
  features = [
    {
      title: 'Digital Health Records',
      desc: 'All your prescriptions, lab reports in one secure place',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`
    },
    {
      title: 'Appointment Booking',
      desc: 'Book appointments with specialists instantly',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
    },
    {
      title: 'Medicine Reminders',
      desc: 'Never miss a dose with smart notifications',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`
    },
  ];

  genders = [
    { label: 'Male', value: 'Male', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M8 20h8"/><path d="M12 16v4"/></svg>` },
    { label: 'Female', value: 'Female', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M8 20h8"/><path d="M12 12v8"/></svg>` },
    { label: 'Other', value: 'Other', icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/></svg>` },
  ];

  step1Form: any;
  step2Form: any;

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.step1Form = this.fb.group({
      fullName: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      dateOfBirth: [''],
      gender: ['Male'],
      address: [''],
    });

    this.step2Form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      emergencyContact: [''],
      agreeTerms: [false],
    });
  }

  ngOnInit(): void {
    // Animation initialization
  }

  hasError(form: any, field: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  passwordMismatch(): boolean {
    const pass = this.step2Form.get('password')?.value;
    const confirm = this.step2Form.get('confirmPassword')?.value;
    return !!(confirm && pass !== confirm);
  }

  passwordStrength(): number {
    const pass = this.step2Form.get('password')?.value ?? '';
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  }

  strengthColor(): string {
    const s = this.passwordStrength();
    if (s <= 25) return '#ef4444';
    if (s <= 50) return '#f59e0b';
    if (s <= 75) return '#3b82f6';
    return '#10b981';
  }

  strengthLabel(): string {
    const s = this.passwordStrength();
    if (s <= 25) return 'Weak';
    if (s <= 50) return 'Fair';
    if (s <= 75) return 'Good';
    return 'Strong';
  }

  goToStep2(): void {
    if (this.step1Form.invalid) {
      this.step1Form.markAllAsTouched();
      return;
    }
    this.currentStep.set(2);
  }

  onRegister(): void {
    if (this.step2Form.invalid || this.passwordMismatch()) {
      this.step2Form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMsg.set('');

    const payload = {
      fullName: this.step1Form.get('fullName')?.value,
      phoneNumber: this.step1Form.get('phoneNumber')?.value,
      email: this.step2Form.get('email')?.value,
      password: this.step2Form.get('password')?.value,
      roleId: 10, // Patient role
    };

    this.http.post<any>(`${this.API_URL}/auth/register`, payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.router.navigate(['/auth/login']);
        } else {
          this.errorMsg.set(res.message);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Registration failed. Please try again.');
      }
    });
  }
}