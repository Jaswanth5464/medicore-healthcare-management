import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ConfigService } from '../../../core/services/config.service';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule, HttpClientModule],
    template: `
  <div class="landing">

    <!-- NAVBAR -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-brand">
          <div class="nav-logo">
            <svg viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="white"/>
              <path d="M20 8v24M8 20h24" stroke="#0a2744" stroke-width="4" stroke-linecap="round"/>
              <circle cx="20" cy="20" r="8" stroke="#0f4c81" stroke-width="2.5" fill="none"/>
            </svg>
          </div>
          <div>
            <div class="nav-name">MediCore</div>
            <div class="nav-sub">Hospitals</div>
          </div>
        </div>
        <div class="nav-links">
          <a href="#departments">Departments</a>
          <a href="#doctors">Doctors</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>
        <div class="nav-actions">
          <a routerLink="/auth/login" class="btn-outline">Patient Login</a>
          <a href="#book" class="btn-nav">Book Appointment</a>
        </div>
        <button class="mobile-menu-btn" (click)="mobileMenu.set(!mobileMenu())">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
      <!-- Mobile Menu -->
      <div class="mobile-menu" *ngIf="mobileMenu()">
        <a href="#departments" (click)="mobileMenu.set(false)">Departments</a>
        <a href="#doctors" (click)="mobileMenu.set(false)">Doctors</a>
        <a href="#about" (click)="mobileMenu.set(false)">About</a>
        <a href="#contact" (click)="mobileMenu.set(false)">Contact</a>
        <a routerLink="/auth/login" class="mobile-login">Patient Login</a>
        <a href="#book" class="mobile-book" (click)="mobileMenu.set(false)">Book Appointment</a>
      </div>
    </nav>

    <!-- HERO -->
    <section class="hero">
      <div class="hero-bg">
        <div class="hero-circle c1"></div>
        <div class="hero-circle c2"></div>
        <div class="hero-circle c3"></div>
      </div>
      <div class="hero-container">
        <div class="hero-content">
          <div class="hero-badge">
            <span class="badge-dot"></span>
            Trusted Healthcare in Hyderabad
          </div>
          <h1 class="hero-title">
            Caring for Life,<br/>
            <span class="hero-highlight">Every Step</span><br/>
            of the Way
          </h1>
          <p class="hero-desc">
            MediCore Hospitals provides world-class medical care with
            experienced doctors, advanced technology and compassionate service.
            Your health is our priority.
          </p>
          <div class="hero-actions">
            <a href="#book" class="btn-hero-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Book Appointment
            </a>
            <a href="tel:108" class="btn-hero-secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              Emergency: 108
            </a>
          </div>
          <div class="hero-stats">
            <div class="stat">
              <div class="stat-num">15+</div>
              <div class="stat-label">Years Experience</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat">
              <div class="stat-num">50+</div>
              <div class="stat-label">Expert Doctors</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat">
              <div class="stat-num">10k+</div>
              <div class="stat-label">Happy Patients</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat">
              <div class="stat-num">24/7</div>
              <div class="stat-label">Emergency Care</div>
            </div>
          </div>
        </div>
        <div class="hero-card-modern">
          <div class="hc-header">
            <div class="hc-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" class="hc-svg">
                <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" stroke-width="2"/>
                <path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="hc-header-text">
              <div class="hc-title">Quick Appointment</div>
              <div class="hc-sub">Get callback within 2 hours</div>
            </div>
          </div>
          
          <div class="hc-divider"></div>

          <div class="hc-features-list">
            <div class="hc-feature-item">
              <div class="hc-check-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span class="hc-feature-text">Expert Doctors Available</span>
            </div>
            <div class="hc-feature-item">
              <div class="hc-check-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span class="hc-feature-text">10 Speciality Departments</span>
            </div>
            <div class="hc-feature-item">
              <div class="hc-check-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span class="hc-feature-text">24/7 Emergency Services</span>
            </div>
            <div class="hc-feature-item">
              <div class="hc-check-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span class="hc-feature-text">Online & Offline Payment</span>
            </div>
          </div>
          <div class="hc-actions">
            <a href="#book" class="hc-btn-primary">
              <span>Request Appointment</span>
              <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- DEPARTMENTS -->
    <section class="departments" id="departments">
      <div class="section-container">
        <div class="section-header">
          <div class="section-tag">Our Specialities</div>
          <h2>World-Class Departments</h2>
          <p>Expert care across all major medical specialities</p>
        </div>
        <div class="dept-grid" *ngIf="!deptsLoading()">
          <div class="dept-card" *ngFor="let dept of departments()">
            <div class="dept-icon">{{ dept.icon }}</div>
            <div class="dept-name">{{ dept.name }}</div>
            <div class="dept-desc">{{ dept.description }}</div>
            <div class="dept-footer">
              <span class="dept-doctors">{{ dept.doctorCount }} Doctors</span>
              <span class="dept-floor">Floor {{ dept.floorNumber }}</span>
            </div>
          </div>
        </div>
        <div class="dept-grid" *ngIf="deptsLoading()">
          <div class="dept-card skeleton" *ngFor="let i of [1,2,3,4,5,6,7,8,9,10]">
            <div class="sk sk-icon"></div>
            <div class="sk sk-line-md" style="margin:12px 0 8px"></div>
            <div class="sk sk-line-sm"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- DOCTORS -->
    <section class="doctors-section" id="doctors">
      <div class="section-container">
        <div class="section-header">
          <div class="section-tag">Expert Team</div>
          <h2>Our Specialists</h2>
          <p>Meet our highly qualified and experienced medical professionals</p>
        </div>
        <div class="doctor-grid" *ngIf="!doctorsLoading()">
          <div class="doctor-card" *ngFor="let doc of doctors()">
            <div class="doc-avatar">
              <div class="doc-initial">{{ getInitials(doc.fullName) }}</div>
            </div>
            <div class="doc-info">
              <div class="doc-name">Dr. {{ doc.fullName }}</div>
              <div class="doc-spec">{{ doc.specialization }}</div>
              <div class="doc-meta">
                <span class="doc-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  {{ doc.departmentName }}
                </span>
                <span class="doc-meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  ₹{{ doc.consultationFee }}
                </span>
              </div>
              <div class="doc-exp">
                <span>{{ doc.experienceYears }} Years Exp.</span>
                <span class="doc-dot">•</span>
                <span>{{ doc.qualification }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="doctor-grid" *ngIf="doctorsLoading()">
          <div class="doctor-card skeleton" *ngFor="let i of [1,2,3,4,5,6]">
            <div class="sk-avatar sk"></div>
            <div class="sk-doc-info">
              <div class="sk sk-line-md" style="margin-bottom:8px"></div>
              <div class="sk sk-line-sm" style="margin-bottom:12px"></div>
              <div class="sk sk-line-sm" style="width:60%"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- WHY US -->
    <section class="why-us">
      <div class="section-container">
        <div class="section-header light">
          <div class="section-tag light">Why MediCore</div>
          <h2>Why Choose Us</h2>
          <p>We combine expertise with compassion to deliver exceptional care</p>
        </div>
        <div class="why-grid">
          <div class="why-card">
            <div class="why-icon">🏆</div>
            <h3>Expert Doctors</h3>
            <p>Our team of experienced specialists brings decades of combined expertise to every consultation.</p>
          </div>
          <div class="why-card">
            <div class="why-icon">⚡</div>
            <h3>Fast Appointments</h3>
            <p>Book online and get confirmed within 2 hours. No long waits, no hassle.</p>
          </div>
          <div class="why-card">
            <div class="why-icon">🔬</div>
            <h3>Advanced Technology</h3>
            <p>State-of-the-art equipment and modern diagnostic tools for accurate results.</p>
          </div>
          <div class="why-card">
            <div class="why-icon">💊</div>
            <h3>In-House Pharmacy</h3>
            <p>Full service pharmacy on premises so you can collect medicines immediately after consultation.</p>
          </div>
          <div class="why-card">
            <div class="why-icon">🧪</div>
            <h3>Integrated Lab</h3>
            <p>Complete pathology and radiology services under one roof with same-day results.</p>
          </div>
          <div class="why-card">
            <div class="why-icon">🛡️</div>
            <h3>Insurance Support</h3>
            <p>We accept all major insurance providers and help you process claims smoothly.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- BOOK APPOINTMENT FORM -->
    <section class="book-section" id="book">
      <div class="section-container">
        <div class="book-layout">
          <div class="book-info">
            <div class="section-tag">Easy Booking</div>
            <h2>Schedule Your Visit in Minutes</h2>
            <p>Our streamlined process ensures you get the care you need without the hassle. Fill out the form and our specialist team takes care of the rest.</p>
            
            <div class="book-features">
              <div class="bf-item">
                <div class="bf-icon-wrap">
                  <div class="bf-icon-inner">⚡</div>
                </div>
                <div class="bf-text">
                  <h4>Quick Response</h4>
                  <p>Confirmation call within 2 hours</p>
                </div>
              </div>
              
              <div class="bf-item">
                <div class="bf-icon-wrap">
                  <div class="bf-icon-inner">🩺</div>
                </div>
                <div class="bf-text">
                  <h4>Expert Triage</h4>
                  <p>Matched with the right specialist</p>
                </div>
              </div>
              
              <div class="bf-item">
                <div class="bf-icon-wrap">
                  <div class="bf-icon-inner">🏥</div>
                </div>
                <div class="bf-text">
                  <h4>Zero Waiting</h4>
                  <p>Token system ensures zero queues</p>
                </div>
              </div>
            </div>

            <!-- Decorative floating card -->
            <div class="premium-floating-card">
              <div class="pfc-header">
                <div class="pfc-pulse"></div>
                <span>Live Status</span>
              </div>
              <p class="pfc-title">Doctors Available</p>
              <div class="pfc-stats">
                <div class="pfc-avatars">
                  <img src="https://i.pravatar.cc/100?img=33" alt="Doctor" />
                  <img src="https://i.pravatar.cc/100?img=47" alt="Doctor" />
                  <img src="https://i.pravatar.cc/100?img=12" alt="Doctor" />
                  <div class="pfc-avatar-more">+12</div>
                </div>
                <div class="pfc-text">Currently accepting appointments</div>
              </div>
            </div>
            
            <div class="book-contact-alt">
              <span class="bca-label">Need immediate help?</span>
              <a href="tel:108" class="bca-link">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12"/>
                </svg>
                Call Emergency: 108
              </a>
            </div>
          </div>

          <!-- The Form -->
          <div class="book-form-card">
            <!-- Success State -->
            <div class="success-state" *ngIf="submitted()">
              <div class="success-icon">✅</div>
              <h3>Request Submitted!</h3>
              <p>Thank you {{ appointmentForm.get('fullName')?.value }}. We have received your request.</p>
              <div class="ref-box">
                <div class="ref-label">Your Reference Number</div>
                <div class="ref-number">{{ referenceNumber() }}</div>
              </div>
              <p class="success-note">Our team will call you within 2 hours. Check your email for confirmation.</p>
              <button class="btn-new" (click)="resetForm()">Submit Another Request</button>
            </div>

            <!-- Form -->
            <form [formGroup]="appointmentForm" (ngSubmit)="submitRequest()" *ngIf="!submitted()">
              <h3 class="form-title">Book Appointment</h3>
              <p class="form-sub">Fill your details below</p>

              <div class="form-row">
                <div class="field-group">
                  <label>Full Name *</label>
                  <input type="text" formControlName="fullName" placeholder="Your full name"
                    [class.error]="isInvalid('fullName')"/>
                  <span class="field-error" *ngIf="isInvalid('fullName')">Name is required</span>
                </div>
                <div class="field-group phone-group">
                  <label>Phone Number *</label>
                  <input type="tel" formControlName="phone" placeholder="+91 98765 43210"
                    [class.error]="isInvalid('phone')"/>
                  <span class="field-error" *ngIf="isInvalid('phone')">Valid phone required</span>
                </div>
              </div>

              <div class="form-row otp-row" *ngIf="otpSent() && !otpVerified()">
                <div class="field-group" style="grid-column: 1 / -1;">
                  <label>Enter OTP *</label>
                  <div class="otp-input-wrap">
                    <input type="text" formControlName="otp" placeholder="Enter 6-digit OTP"
                      maxlength="6" [class.error]="isInvalid('otp')"/>
                    <button type="button" class="btn-verify" 
                            [disabled]="appointmentForm.get('otp')?.invalid || otpVerifying()"
                            (click)="verifyOtp()">
                      <span *ngIf="!otpVerifying()">Verify</span>
                      <span *ngIf="otpVerifying()">Verifying...</span>
                    </button>
                  </div>
                  <span class="field-error" *ngIf="isInvalid('otp')">Valid 6-digit OTP required</span>
                </div>
              </div>

              <div class="form-row">
                <div class="field-group phone-group">
                  <label>Email Address *</label>
                  <div class="phone-input-wrap">
                    <input type="email" formControlName="email" placeholder="your@email.com"
                      [class.error]="isInvalid('email')" [readonly]="otpVerified()"/>
                    <button type="button" class="btn-otp" 
                            [disabled]="isInvalid('email') || otpSending() || otpVerified()"
                            (click)="sendOtp()">
                      <span *ngIf="!otpSending() && !otpSent() && !otpVerified()">Send OTP</span>
                      <span *ngIf="otpSending()">Sending...</span>
                      <span *ngIf="otpSent() && !otpVerified()">Resend</span>
                      <span *ngIf="otpVerified()">Verified</span>
                    </button>
                  </div>
                  <span class="field-error" *ngIf="isInvalid('email')">Valid email required</span>
                </div>
                <div class="field-group">
                  <label>Age *</label>
                  <input type="number" formControlName="age" placeholder="25"
                    [class.error]="isInvalid('age')"/>
                  <span class="field-error" *ngIf="isInvalid('age')">Age is required</span>
                </div>
              </div>

              <div class="form-row">
                <div class="field-group">
                  <label>Gender *</label>
                  <select formControlName="gender" [class.error]="isInvalid('gender')">
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div class="field-group">
                  <label>Visit Type</label>
                  <select formControlName="visitType">
                    <option value="Consultation">Consultation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Check-up">General Check-up</option>
                  </select>
                </div>
              </div>

              <div class="field-group">
                <label>Preferred Department</label>
                <div class="dept-chips" *ngIf="!deptsLoading()">
                  <div class="dept-chip"
                    [class.selected]="appointmentForm.get('preferredDepartmentId')?.value === dept.id"
                    *ngFor="let dept of departments()"
                    (click)="selectDept(dept.id)">
                    {{ dept.icon }} {{ dept.name }}
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="field-group">
                  <label>Preferred Date</label>
                  <input type="date" formControlName="preferredDate" [min]="minDate"/>
                </div>
                <div class="field-group">
                  <label>First Visit?</label>
                  <select formControlName="isFirstVisit">
                    <option [value]="true">Yes, this is my first visit</option>
                    <option [value]="false">No, I have visited before</option>
                  </select>
                </div>
              </div>

              <div class="field-group">
                <label>Describe Your Symptoms *</label>
                <textarea formControlName="symptoms" rows="3"
                  placeholder="Please describe your symptoms or reason for visit..."
                  [class.error]="isInvalid('symptoms')"></textarea>
                <span class="field-error" *ngIf="isInvalid('symptoms')">Please describe your symptoms</span>
              </div>

              <div class="form-error" *ngIf="formError()">{{ formError() }}</div>

              <button type="submit" class="btn-submit" [disabled]="submitting() || !otpVerified()">
                <span *ngIf="!submitting()" class="submit-content">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Request Appointment
                </span>
                <span *ngIf="submitting()" class="loading-content">
                  <span class="spinner"></span> Submitting...
                </span>
              </button>
              <p class="form-note">
                By submitting you agree to be contacted by our team.
                No spam. We respect your privacy.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- TRACK REQUEST -->
    <section class="track-section" id="track">
      <div class="section-container">
        <div class="track-card">
          <div class="track-icon">🔍</div>
          <h3>Track Your Request</h3>
          <p>Already submitted a request? Check the status using your reference number.</p>
          <div class="track-form">
            <input type="text" [(ngModel)]="trackRef" [ngModelOptions]="{standalone: true}"
              placeholder="Enter reference number e.g. REQ20260308001"/>
            <button (click)="trackRequest()" [disabled]="tracking()">
              <span *ngIf="!tracking()">Track</span>
              <span *ngIf="tracking()">...</span>
            </button>
          </div>
          <div class="track-result" *ngIf="trackResult()">
            <div class="track-status" [ngClass]="getStatusClass(trackResult().status)">
              {{ trackResult().status }}
            </div>
            <p>{{ trackResult().statusMessage }}</p>
          </div>
          <div class="track-error" *ngIf="trackError()">{{ trackError() }}</div>
        </div>
      </div>
    </section>

    <!-- ABOUT -->
    <section class="about-section" id="about">
      <div class="section-container">
        <div class="about-layout">
          <div class="about-images">
            <div class="ai-main">
              <div class="ai-overlay"></div>
              <img src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2000&auto=format&fit=crop" alt="Hospital Building" />
            </div>
            <div class="ai-sub">
              <img src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=800&auto=format&fit=crop" alt="Medical Team" />
            </div>
          </div>
          <div class="about-content">
            <div class="section-tag">About MediCore</div>
            <h2>Pioneering Healthcare Excellence Since 2010</h2>
            <p class="about-lead">
              At MediCore Hospitals, we believe that world-class healthcare should be accessible, compassionate, and transparent. For over a decade, we have been at the forefront of medical innovation in Hyderabad.
            </p>
            <p class="about-text">
              Our state-of-the-art facility is equipped with the latest diagnostic and therapeutic technologies. But what truly sets us apart is our team — a dedicated group of specialists, nurses, and support staff who treat every patient with the dignity and care they would expect for their own family.
            </p>
            <div class="about-highlights">
              <div class="ah-item">
                <div class="ah-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <h4>NABH Accredited</h4>
                  <p>Highest standard of care</p>
                </div>
              </div>
              <div class="ah-item">
                <div class="ah-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                </div>
                <div>
                  <h4>Patient-First Approach</h4>
                  <p>Compassionate healing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CONTACT -->
    <section class="contact-section" id="contact">
      <div class="section-container">
        <div class="contact-layout">
          <div class="contact-info">
            <div class="section-tag">Visit Us</div>
            <h2 class="contact-heading">We're conveniently located in the heart of Hyderabad. Reach out to us for any medical assistance.</h2>
            <h3 class="contact-subheading">Contact Information</h3>
            
            <div class="contact-methods">
              <div class="contact-method">
                <div class="cm-icon">📍</div>
                <div class="cm-details">
                  <h4>Address</h4>
                  <p>Banjara Hills, Hyderabad, Telangana</p>
                </div>
              </div>
              <div class="contact-method">
                <div class="cm-icon">📞</div>
                <div class="cm-details">
                  <h4>Phone</h4>
                  <p>108 (Emergency) | +91 98765 43210 (General)</p>
                </div>
              </div>
              <div class="contact-method">
                <div class="cm-icon">✉️</div>
                <div class="cm-details">
                  <h4>Email</h4>
                  <p>info&#64;medicore.com</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="contact-map">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15228.694600293306!2d78.43477134372557!3d17.41508!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb973e6da80501%3A0xc3b5eddc5eb572!2sBanjara%20Hills%2C%20Hyderabad%2C%20Telangana!5e0!3m2!1sen!2sin!4v1709893240000!5m2!1sen!2sin" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-brand">
          <div class="footer-logo">
            <svg viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="white" fill-opacity="0.1"/>
              <path d="M20 8v24M8 20h24" stroke="white" stroke-width="4" stroke-linecap="round"/>
            </svg>
            <div>
              <div class="footer-name">MediCore Hospitals</div>
              <div class="footer-tagline">Caring for life, every step of the way</div>
            </div>
          </div>
          <p class="footer-desc">
            Providing world-class healthcare to the people of Hyderabad since 2010.
          </p>
        </div>
        <div class="footer-links">
          <div class="footer-col">
            <h5>Services</h5>
            <a href="#departments">Departments</a>
            <a href="#book">Book Appointment</a>
            <a href="#track">Track Request</a>
          </div>
          <div class="footer-col">
            <h5>Patient</h5>
            <a routerLink="/auth/login">Patient Login</a>
            <a routerLink="/auth/register">Register</a>
          </div>
          <div class="footer-col">
            <h5>Contact</h5>
            <a href="tel:108">Emergency: 108</a>
            <a href="#contact">Location</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2026 MediCore Hospitals, Hyderabad. All rights reserved.</p>
        <a routerLink="/auth/login" class="footer-login">Staff Login →</a>
      </div>
    </footer>

  </div>
  `,
    styles: [`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Serif+Display&display=swap');

    html {
      scroll-behavior: smooth;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .landing {
      font-family: 'DM Sans', sans-serif;
      color: #0f172a;
      overflow-x: hidden;
    }

    /* ── NAVBAR ── */
    .navbar {
      position: sticky; top: 0; z-index: 100;
      background: rgba(10, 39, 68, 0.97);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .nav-container {
      max-width: 1200px; margin: 0 auto;
      padding: 0 24px;
      display: flex; align-items: center;
      gap: 32px; height: 68px;
    }
    .nav-brand {
      display: flex; align-items: center; gap: 10px;
      flex-shrink: 0;
    }
    .nav-logo svg { width: 36px; height: 36px; }
    .nav-name { font-size: 18px; font-weight: 800; color: white; line-height: 1; }
    .nav-sub { font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; }
    .nav-links {
      display: flex; gap: 24px; flex: 1;
    }
    .nav-links a {
      color: rgba(255,255,255,0.7); text-decoration: none;
      font-size: 14px; font-weight: 500;
      transition: color 0.2s;
    }
    .nav-links a:hover { color: white; }
    .nav-actions { display: flex; gap: 10px; align-items: center; }
    .btn-outline {
      padding: 8px 18px; border: 1.5px solid rgba(255,255,255,0.3);
      color: white; border-radius: 8px; text-decoration: none;
      font-size: 13px; font-weight: 500; transition: all 0.2s;
    }
    .btn-outline:hover { border-color: white; background: rgba(255,255,255,0.05); }
    .btn-nav {
      padding: 8px 18px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white; border-radius: 8px; text-decoration: none;
      font-size: 13px; font-weight: 600; transition: all 0.2s;
    }
    .btn-nav:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(34,197,94,0.3); }
    .mobile-menu-btn {
      display: none; background: none; border: none;
      color: white; cursor: pointer; padding: 4px;
      margin-left: auto;
    }
    .mobile-menu-btn svg { width: 24px; height: 24px; }
    .mobile-menu {
      background: #0a2744; padding: 16px 24px;
      display: flex; flex-direction: column; gap: 12px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }
    .mobile-menu a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 15px; }
    .mobile-login {
      padding: 10px; text-align: center;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px;
    }
    .mobile-book {
      padding: 10px; text-align: center;
      background: #22c55e; border-radius: 8px;
      color: white !important; font-weight: 600;
    }

    /* ── HERO ── */
    .hero {
      background: linear-gradient(135deg, #0a2744 0%, #0f4c81 60%, #1a6bb5 100%);
      min-height: 90vh;
      display: flex; align-items: center;
      position: relative; overflow: hidden;
      padding: 60px 0;
    }
    .hero-bg { position: absolute; inset: 0; pointer-events: none; }
    .hero-circle {
      position: absolute; border-radius: 50%;
      background: rgba(255,255,255,0.03);
    }
    .c1 { width: 600px; height: 600px; top: -200px; right: -100px; }
    .c2 { width: 400px; height: 400px; bottom: -150px; left: -100px; }
    .c3 { width: 200px; height: 200px; top: 50%; right: 30%; background: rgba(34,197,94,0.05); }
    .hero-container {
      max-width: 1200px; margin: 0 auto; padding: 0 24px;
      display: grid; grid-template-columns: 1fr 380px;
      gap: 60px; align-items: center;
      position: relative; z-index: 1;
    }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 8px;
      background: rgba(34,197,94,0.15);
      border: 1px solid rgba(34,197,94,0.3);
      color: #4ade80; padding: 6px 14px;
      border-radius: 100px; font-size: 13px; font-weight: 500;
      margin-bottom: 20px;
    }
    .badge-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: #22c55e; animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    .hero-title {
      font-family: 'DM Serif Display', serif;
      font-size: 56px; color: white; line-height: 1.1;
      margin-bottom: 20px; letter-spacing: -1px;
    }
    .hero-highlight { color: #4ade80; }
    .hero-desc {
      font-size: 16px; color: rgba(255,255,255,0.7);
      line-height: 1.7; margin-bottom: 32px; max-width: 520px;
    }
    .hero-actions { display: flex; gap: 14px; margin-bottom: 48px; flex-wrap: wrap; }
    .btn-hero-primary {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 28px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white; border-radius: 12px; text-decoration: none;
      font-size: 15px; font-weight: 600; transition: all 0.2s;
    }
    .btn-hero-primary svg { width: 22px; height: 22px; }
    .btn-hero-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(34,197,94,0.4); }
    .btn-hero-secondary {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 28px;
      background: rgba(255,255,255,0.1);
      border: 1.5px solid rgba(255,255,255,0.2);
      color: white; border-radius: 12px; text-decoration: none;
      font-size: 15px; font-weight: 600; transition: all 0.2s;
    }
    .btn-hero-secondary svg { width: 22px; height: 22px; }
    .btn-hero-secondary:hover { background: rgba(255,255,255,0.15); }
    .hero-stats {
      display: flex; align-items: center; gap: 24px;
    }
    .stat { text-align: center; }
    .stat-num { font-size: 28px; font-weight: 800; color: white; }
    .stat-label { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 2px; }
    .stat-divider { width: 1px; height: 40px; background: rgba(255,255,255,0.15); }

    /* Hero Card Modernized */
    .hero-card-modern {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.6) inset;
      position: relative;
      overflow: hidden;
    }
    .hero-card-modern::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 5px;
      background: linear-gradient(90deg, #3b82f6, #22c55e);
    }
    .hc-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .hc-icon-wrapper { 
      width: 48px; height: 48px; border-radius: 12px;
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      color: #3b82f6; display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      flex-shrink: 0;
    }
    .hc-svg { width: 24px; height: 24px; }
    .hc-header-text { display: flex; flex-direction: column; gap: 4px; }
    .hc-title { font-size: 18px; font-weight: 800; color: #0a2744; letter-spacing: -0.3px; }
    .hc-sub { font-size: 13px; color: #64748b; font-weight: 500;}
    
    .hc-divider { height: 1px; background: #e2e8f0; margin-bottom: 24px; }

    .hc-features-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 32px; }
    .hc-feature-item { display: flex; align-items: center; gap: 12px; }
    .hc-check-icon { 
      width: 20px; height: 20px; border-radius: 50%;
      background: #dcfce7; color: #22c55e;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .hc-check-icon svg { width: 12px; height: 12px; }
    .hc-feature-text { font-size: 14px; font-weight: 500; color: #334155; }
    
    .hc-actions { display: flex; }
    .hc-btn-primary {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 16px;
      background: #0a2744;
      color: white; border-radius: 12px; text-decoration: none;
      font-size: 15px; font-weight: 600; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(10, 39, 68, 0.15);
    }
    .hc-btn-primary svg { width: 20px; height: 20px; transition: transform 0.3s; }
    .hc-btn-primary:hover { 
      background: #0f4c81; 
      transform: translateY(-2px); 
      box-shadow: 0 8px 20px rgba(15, 76, 129, 0.25); 
    }
    .hc-btn-primary:hover svg { transform: translateX(4px); }

    /* ── SECTIONS ── */
    .section-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .section-header { text-align: center; margin-bottom: 48px; }
    .section-header h2 {
      font-family: 'DM Serif Display', serif;
      font-size: 36px; color: #0a2744;
      margin-bottom: 12px;
    }
    .section-header p { font-size: 15px; color: #64748b; }
    .section-tag {
      display: inline-block;
      background: #eff6ff; color: #0f4c81;
      padding: 4px 14px; border-radius: 100px;
      font-size: 12px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 1px;
      margin-bottom: 12px;
    }

    /* ── DEPARTMENTS ── */
    .departments { padding: 80px 0; background: #f8fafc; }
    .dept-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    .dept-card {
      background: white; border-radius: 16px;
      padding: 24px 20px; border: 1.5px solid #e2e8f0;
      transition: all 0.2s; cursor: default;
    }
    .dept-card:hover {
      border-color: #0f4c81;
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(15,76,129,0.1);
    }
    .dept-card.skeleton { background: #f1f5f9; animation: shimmer 1.5s infinite; }
    @keyframes shimmer {
      0%, 100% { opacity: 1; } 50% { opacity: 0.5; }
    }
    .dept-icon { font-size: 36px; margin-bottom: 12px; }
    .dept-name { font-size: 14px; font-weight: 700; color: #0a2744; margin-bottom: 6px; }
    .dept-desc { font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 12px; }
    .dept-footer { display: flex; justify-content: space-between; font-size: 11px; }
    .dept-doctors { color: #0f4c81; font-weight: 600; }
    .dept-floor { color: #94a3b8; }

    /* skeleton */
    .sk { background: #e2e8f0; border-radius: 6px; }
    .sk-icon { width: 40px; height: 40px; border-radius: 8px; margin-bottom: 12px; }
    .sk-line-md { height: 14px; width: 70%; }
    .sk-line-sm { height: 12px; width: 90%; }
    .sk-avatar { width: 56px; height: 56px; border-radius: 12px; flex-shrink: 0; }
    .sk-doc-info { flex: 1; }

    /* ── DOCTORS ── */
    .doctors-section { padding: 80px 0; background: white; }
    .doctor-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    .doctor-card {
      display: flex; gap: 16px; padding: 20px;
      background: white; border: 1.5px solid #e2e8f0;
      border-radius: 16px; transition: all 0.2s;
    }
    .doctor-card:hover { border-color: #0f4c81; transform: translateY(-3px); box-shadow: 0 12px 30px rgba(0,0,0,0.06); }
    .doctor-card.skeleton { background: #f8fafc; animation: shimmer 1.5s infinite; border-color: transparent; }
    
    .doc-avatar {
      width: 56px; height: 56px; border-radius: 12px;
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; color: #3b82f6;
    }
    .doc-initial { font-size: 20px; font-weight: 800; }
    
    .doc-info { flex: 1; display: flex; flex-direction: column; }
    .doc-name { font-size: 16px; font-weight: 700; color: #0a2744; margin-bottom: 4px; }
    .doc-spec { font-size: 13px; color: #3b82f6; font-weight: 600; margin-bottom: 10px; }
    
    .doc-meta { display: flex; gap: 16px; margin-bottom: 10px; flex-wrap: wrap; }
    .doc-meta-item {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; color: #64748b; font-weight: 500;
    }
    .doc-meta-item svg { width: 14px; height: 14px; color: #94a3b8; }
    
    .doc-exp {
      display: flex; align-items: center; gap: 8px;
      font-size: 12px; color: #475569;
      background: #f8fafc; padding: 6px 10px; border-radius: 6px;
      width: fit-content; margin-top: auto;
    }
    .doc-dot { color: #cbd5e1; font-weight: 800; font-size: 10px; }

    /* ── WHY US ── */
    .why-us {
      padding: 80px 0;
      background: linear-gradient(135deg, #0a2744, #0f4c81);
    }
    .section-header.light h2 { color: white; }
    .section-header.light p { color: rgba(255,255,255,0.6); }
    .section-tag.light { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }
    .why-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .why-card {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px; padding: 28px;
      transition: all 0.2s;
    }
    .why-card:hover {
      background: rgba(255,255,255,0.1);
      transform: translateY(-2px);
    }
    .why-icon { font-size: 32px; margin-bottom: 16px; }
    .why-card h3 { font-size: 16px; font-weight: 700; color: white; margin-bottom: 10px; }
    .why-card p { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.6; }

    /* ── BOOK SECTION ── */
    .book-section { padding: 80px 0; background: white; }
    .book-layout {
      display: grid; grid-template-columns: 1fr 560px;
      gap: 30px; align-items: start;
    }
    .book-info .section-tag { margin-bottom: 12px; }
    .book-info h2 {
      font-family: 'DM Serif Display', serif;
      font-size: 36px; color: #0a2744;
      margin-bottom: 16px;
    }
    .book-info > p { font-size: 16px; color: #64748b; line-height: 1.7; margin-bottom: 32px; max-width: 480px; }
    
    .book-features { display: flex; flex-direction: column; gap: 24px; margin-bottom: 40px; }
    .bf-item { display: flex; align-items: center; gap: 16px; }
    .bf-icon-wrap {
      width: 52px; height: 52px; border-radius: 16px;
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      display: flex; align-items: center; justify-content: center;
      position: relative; box-shadow: 0 4px 12px rgba(59,130,246,0.1);
    }
    .bf-icon-inner { font-size: 24px; }
    .bf-text h4 { font-size: 16px; font-weight: 700; color: #0a2744; margin-bottom: 4px; }
    .bf-text p { font-size: 13px; color: #64748b; margin: 0; }

    .premium-floating-card {
      background: white; border-radius: 16px; padding: 24px;
      margin-bottom: 32px; border: 1px solid #e2e8f0;
      box-shadow: 0 12px 32px rgba(0,0,0,0.06);
      position: relative; overflow: hidden; max-width: 400px;
    }
    .premium-floating-card::before {
      content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
      background: #22c55e;
    }
    .pfc-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .pfc-pulse {
      width: 8px; height: 8px; border-radius: 50%; background: #22c55e;
      position: relative;
    }
    .pfc-pulse::after {
      content: ''; position: absolute; inset: -4px; border-radius: 50%;
      border: 2px solid #22c55e; animation: pulseRing 1.5s infinite var(--anim-cubic); opacity: 0;
    }
    @keyframes pulseRing {
      0% { transform: scale(0.8); opacity: 0.8; }
      100% { transform: scale(2); opacity: 0; }
    }
    .pfc-header span { font-size: 12px; font-weight: 700; color: #22c55e; text-transform: uppercase; letter-spacing: 1px; }
    .pfc-title { font-size: 18px; font-weight: 800; color: #0a2744; margin-bottom: 16px; }
    .pfc-stats { display: flex; align-items: center; gap: 16px; }
    .pfc-avatars { display: flex; align-items: center; }
    .pfc-avatars img {
      width: 36px; height: 36px; border-radius: 50%; border: 2px solid white;
      margin-left: -10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .pfc-avatars img:first-child { margin-left: 0; }
    .pfc-avatar-more {
      width: 36px; height: 36px; border-radius: 50%; border: 2px solid white;
      margin-left: -10px; background: #f1f5f9; color: #64748b;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; z-index: 10;
    }
    .pfc-text { font-size: 13px; font-weight: 500; color: #64748b; line-height: 1.4; }

    .book-contact-alt { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .bca-label { font-size: 14px; font-weight: 500; color: #64748b; }
    .bca-link {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 100px;
      background: #fef2f2; color: #ef4444; text-decoration: none;
      font-size: 14px; font-weight: 700; transition: all 0.2s;
    }
    .bca-link svg { width: 16px; height: 16px; }
    .bca-link:hover { background: #fee2e2; transform: translateY(-1px); }

    /* Form Card */
    .book-form-card {
      background: white; border-radius: 20px;
      padding: 36px;
      border: 1.5px solid #e2e8f0;
      box-shadow: 0 8px 32px rgba(0,0,0,0.06);
    }
    .form-title { font-size: 22px; font-weight: 700; color: #0a2744; margin-bottom: 4px; }
    .form-sub { font-size: 13px; color: #64748b; margin-bottom: 24px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .field-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .field-group label { font-size: 13px; font-weight: 600; color: #374151; }
    .field-group input,
    .field-group select,
    .field-group textarea {
      padding: 10px 14px;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px; font-size: 14px;
      font-family: 'DM Sans', sans-serif;
      color: #0f172a; transition: border-color 0.2s;
      background: white; outline: none;
    }
    .field-group input:focus,
    .field-group select:focus,
    .field-group textarea:focus { border-color: #0f4c81; }
    .field-group input.error,
    .field-group select.error,
    .field-group textarea.error { border-color: #ef4444; }
    .field-error { font-size: 11px; color: #ef4444; }

    /* OTP Styles */
    .phone-input-wrap, .otp-input-wrap {
      display: flex; gap: 8px; align-items: stretch;
    }
    .phone-input-wrap input, .otp-input-wrap input { flex: 1; }
    .btn-otp, .btn-verify {
      padding: 0 16px; background: #f1f5f9; color: #0f4c81;
      border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 13px; font-weight: 700; cursor: pointer;
      transition: all 0.2s; white-space: nowrap;
    }
    .btn-otp:hover:not(:disabled), .btn-verify:hover:not(:disabled) {
      background: #e2e8f0; border-color: #cbd5e1;
    }
    .btn-otp:disabled, .btn-verify:disabled {
      opacity: 0.6; cursor: not-allowed;
    }
    .btn-otp span { color: inherit; }
    .otp-row { animation: slideDown 0.3s ease-out forwards; overflow: hidden; }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Department Chips */
    .dept-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .dept-chip {
      padding: 6px 12px;
      border: 1.5px solid #e2e8f0;
      border-radius: 100px; font-size: 12px;
      cursor: pointer; transition: all 0.2s;
      color: #64748b;
    }
    .dept-chip:hover { border-color: #0f4c81; color: #0f4c81; }
    .dept-chip.selected {
      border-color: #0f4c81;
      background: #eff6ff; color: #0f4c81;
      font-weight: 600;
    }

    .form-error {
      background: #fef2f2; color: #dc2626;
      padding: 10px 14px; border-radius: 8px;
      font-size: 13px; margin-bottom: 16px;
    }
    .btn-submit {
      width: 100%; padding: 14px;
      background: linear-gradient(135deg, #0a2744, #0f4c81);
      color: white; border: none; border-radius: 10px;
      font-size: 15px; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center;
      justify-content: center; gap: 8px;
      font-family: 'DM Sans', sans-serif;
      margin-bottom: 12px;
    }
    .submit-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-submit svg { width: 18px; height: 18px; }
    .btn-submit:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(15,76,129,0.3);
    }
    .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
    .form-note { font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5; }

    /* Success State */
    .success-state { text-align: center; padding: 20px 0; }
    .success-icon { font-size: 48px; margin-bottom: 16px; }
    .success-state h3 { font-size: 22px; font-weight: 700; color: #0a2744; margin-bottom: 8px; }
    .success-state p { font-size: 14px; color: #64748b; margin-bottom: 20px; }
    .ref-box {
      background: #f0f9ff; border: 2px dashed #0f4c81;
      border-radius: 12px; padding: 20px; margin-bottom: 16px;
    }
    .ref-label { font-size: 11px; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; }
    .ref-number { font-size: 28px; font-weight: 800; color: #0a2744; letter-spacing: 2px; }
    .success-note { font-size: 13px; color: #64748b; margin-bottom: 20px; }
    .btn-new {
      padding: 12px 24px;
      background: linear-gradient(135deg, #0a2744, #0f4c81);
      color: white; border: none; border-radius: 10px;
      font-size: 14px; font-weight: 600; cursor: pointer;
      font-family: 'DM Sans', sans-serif;
    }

    /* ── TRACK ── */
    .track-section { padding: 60px 0; background: #f8fafc; }
    .track-card {
      max-width: 560px; margin: 0 auto;
      background: white; border-radius: 20px;
      padding: 40px; text-align: center;
      border: 1.5px solid #e2e8f0;
      box-shadow: 0 4px 16px rgba(0,0,0,0.04);
    }
    .track-icon { font-size: 40px; margin-bottom: 16px; }
    .track-card h3 { font-size: 22px; font-weight: 700; color: #0a2744; margin-bottom: 8px; }
    .track-card p { font-size: 14px; color: #64748b; margin-bottom: 24px; }
    .track-form { display: flex; gap: 10px; }
    .track-form input {
      flex: 1; padding: 12px 16px;
      border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: 14px; outline: none;
      font-family: 'DM Sans', sans-serif;
    }
    .track-form input:focus { border-color: #0f4c81; }
    .track-form button {
      padding: 12px 24px;
      background: linear-gradient(135deg, #0a2744, #0f4c81);
      color: white; border: none; border-radius: 10px;
      font-size: 14px; font-weight: 600;
      cursor: pointer; font-family: 'DM Sans', sans-serif;
      transition: all 0.2s;
    }
    .track-form button:disabled { opacity: 0.7; }
    .track-result { margin-top: 20px; }
    .track-status {
      display: inline-block; padding: 6px 16px;
      border-radius: 100px; font-size: 13px; font-weight: 600;
      margin-bottom: 8px;
    }
    .track-status.pending { background: #fef3c7; color: #92400e; }
    .track-status.contacted { background: #dbeafe; color: #1e40af; }
    .track-status.confirmed { background: #dcfce7; color: #166534; }
    .track-status.converted { background: #dcfce7; color: #166534; }
    .track-status.rejected { background: #fee2e2; color: #991b1b; }
    .track-result p { font-size: 13px; color: #64748b; }
    .track-error { margin-top: 16px; font-size: 13px; color: #ef4444; }

    /* ── ABOUT ── */
    .about-section { padding: 80px 0; background: #f8fafc; }
    .about-layout {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 60px; align-items: center;
    }
    .about-images { position: relative; height: 500px; }
    .ai-main {
      position: absolute; top: 0; left: 0;
      width: 80%; height: 85%;
      border-radius: 20px; overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }
    .ai-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top right, rgba(10,39,68,0.4), transparent);
      z-index: 1; pointer-events: none;
    }
    .ai-main img { width: 100%; height: 100%; object-fit: cover; }
    .ai-sub {
      position: absolute; bottom: 0; right: 0;
      width: 50%; height: 45%;
      border-radius: 20px; overflow: hidden;
      border: 8px solid #f8fafc;
      box-shadow: 0 16px 32px rgba(0,0,0,0.15);
      z-index: 2;
    }
    .ai-sub img { width: 100%; height: 100%; object-fit: cover; }
    
    .about-content h2 {
      font-family: 'DM Serif Display', serif;
      font-size: 36px; color: #0a2744;
      margin-bottom: 20px; line-height: 1.2;
    }
    .about-lead { font-size: 16px; color: #0f4c81; font-weight: 500; line-height: 1.6; margin-bottom: 16px; }
    .about-text { font-size: 15px; color: #64748b; line-height: 1.7; margin-bottom: 32px; }
    
    .about-highlights { display: flex; flex-direction: column; gap: 20px; }
    .ah-item { display: flex; align-items: flex-start; gap: 16px; }
    .ah-icon {
      width: 48px; height: 48px; border-radius: 12px;
      background: white; color: #22c55e;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05); flex-shrink: 0;
    }
    .ah-icon svg { width: 24px; height: 24px; }
    .ah-item h4 { font-size: 15px; font-weight: 700; color: #0a2744; margin-bottom: 4px; }
    .ah-item p { font-size: 13px; color: #64748b; margin: 0; }

    /* ── CONTACT ── */
    .contact-section { padding: 80px 0; background: white; }
    .contact-layout {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 60px; align-items: stretch;
    }
    .contact-info { display: flex; flex-direction: column; }
    .contact-info .section-tag { margin-bottom: 16px; }
    .contact-heading {
      font-family: 'DM Serif Display', serif;
      font-size: 32px; color: #0a2744;
      line-height: 1.3; margin-bottom: 32px;
    }
    .contact-subheading {
      font-size: 20px; font-weight: 700; color: #0a2744;
      margin-bottom: 24px; padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .contact-methods { display: flex; flex-direction: column; gap: 24px; }
    .contact-method { display: flex; align-items: flex-start; gap: 16px; }
    .cm-icon {
      font-size: 24px; width: 48px; height: 48px;
      background: #f8fafc; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .cm-details h4 { font-size: 15px; font-weight: 700; color: #0a2744; margin-bottom: 4px; }
    .cm-details p { font-size: 14px; color: #64748b; line-height: 1.5; margin: 0; }
    .contact-map {
      border-radius: 20px; overflow: hidden;
      box-shadow: 0 12px 32px rgba(0,0,0,0.08);
      min-height: 400px;
    }

    /* ── FOOTER ── */
    .footer {
      background: #0a2744;
      padding: 48px 0 0;
    }
    .footer-container {
      max-width: 1200px; margin: 0 auto; padding: 0 24px 48px;
      display: grid; grid-template-columns: 1fr auto;
      gap: 60px;
    }
    .footer-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .footer-logo svg { width: 36px; height: 36px; }
    .footer-name { font-size: 16px; font-weight: 700; color: white; }
    .footer-tagline { font-size: 11px; color: rgba(255,255,255,0.5); }
    .footer-desc { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; max-width: 300px; }
    .footer-links { display: flex; gap: 48px; }
    .footer-col { display: flex; flex-direction: column; gap: 10px; }
    .footer-col h5 { font-size: 13px; font-weight: 700; color: white; margin-bottom: 4px; }
    .footer-col a { font-size: 13px; color: rgba(255,255,255,0.5); text-decoration: none; transition: color 0.2s; }
    .footer-col a:hover { color: white; }
    .footer-bottom {
      border-top: 1px solid rgba(255,255,255,0.08);
      padding: 16px 24px;
      max-width: 1200px; margin: 0 auto;
      display: flex; justify-content: space-between;
      align-items: center;
    }
    .footer-bottom p { font-size: 12px; color: rgba(255,255,255,0.4); }
    .footer-login {
      font-size: 12px; color: rgba(255,255,255,0.5);
      text-decoration: none; transition: color 0.2s;
    }
    .footer-login:hover { color: white; }

    /* ── SPINNER ── */
    .loading-content { display: flex; align-items: center; gap: 8px; }
    .spinner {
      width: 16px; height: 16px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── RESPONSIVE ── */
    @media (max-width: 968px) {
      .hero-container { grid-template-columns: 1fr; }
      .hero-card { display: none; }
      .hero-title { font-size: 40px; }
      .book-layout { grid-template-columns: 1fr; }
      .about-layout { grid-template-columns: 1fr; }
      .about-images { height: 400px; margin-bottom: 40px; }
      .contact-layout { grid-template-columns: 1fr; gap: 40px; }
      .nav-links { display: none; }
      .nav-actions { display: none; }
      .mobile-menu-btn { display: block; }
      .footer-container { grid-template-columns: 1fr; gap: 32px; }
      .footer-links { flex-wrap: wrap; gap: 24px; }
      .hero-stats { flex-wrap: wrap; gap: 16px; }
    }
    @media (max-width: 480px) {
      .form-row { grid-template-columns: 1fr; }
      .track-form { flex-direction: column; }
      .hero-title { font-size: 32px; }
      .about-images { height: 300px; }
      .contact-map { min-height: 300px; }
    }
  `]
})
export class LandingComponent implements OnInit {
    private readonly config = inject(ConfigService);
    private readonly API_URL = this.config.apiUrl;

    appointmentForm: FormGroup;
    departments = signal<any[]>([]);
    deptsLoading = signal(true);
    doctors = signal<any[]>([]);
    doctorsLoading = signal(true);
    submitted = signal(false);
    submitting = signal(false);
    referenceNumber = signal('');
    formError = signal('');
    mobileMenu = signal(false);

    // OTP State
    otpSent = signal(false);
    otpSending = signal(false);
    otpVerified = signal(false);
    otpVerifying = signal(false);

    trackRef = '';
    tracking = signal(false);
    trackResult = signal<any>(null);
    trackError = signal('');
    minDate = new Date().toISOString().split('T')[0];

    constructor(private fb: FormBuilder, private http: HttpClient) {
        this.appointmentForm = this.fb.group({
            fullName: ['', Validators.required],
            phone: ['', [Validators.required, Validators.minLength(10)]],
            otp: ['', [Validators.minLength(6), Validators.maxLength(6)]],
            email: ['', [Validators.required, Validators.email]],
            age: ['', [Validators.required, Validators.min(1)]],
            gender: ['', Validators.required],
            visitType: ['Consultation'],
            preferredDepartmentId: [null],
            preferredDate: [''],
            isFirstVisit: [true],
            symptoms: ['', Validators.required],
        });
    }

    ngOnInit() {
        this.loadDepartments();
        this.loadDoctors();
    }

    loadDoctors() {
        this.http.get<any>(`${this.API_URL}/doctors`).subscribe({
            next: (res) => {
                this.doctorsLoading.set(false);
                if (res.success) this.doctors.set(res.data);
            },
            error: () => this.doctorsLoading.set(false)
        });
    }

    getInitials(name: string): string {
        if (!name) return 'DR';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    loadDepartments() {
        this.http.get<any>(`${this.API_URL}/departments`).subscribe({
            next: (res) => {
                this.deptsLoading.set(false);
                if (res.success) this.departments.set(res.data);
            },
            error: () => this.deptsLoading.set(false)
        });
    }

    selectDept(id: number) {
        const current = this.appointmentForm.get('preferredDepartmentId')?.value;
        this.appointmentForm.patchValue({
            preferredDepartmentId: current === id ? null : id
        });
    }

    isInvalid(field: string): boolean {
        const control = this.appointmentForm.get(field);
        return !!(control?.invalid && control?.touched);
    }

    sendOtp() {
        const email = this.appointmentForm.get('email')?.value;
        if (this.appointmentForm.get('email')?.invalid || !email) {
            this.formError.set('Please provide a valid email address first.');
            return;
        }

        this.otpSending.set(true);
        this.formError.set('');

        this.http.post<any>(`${this.API_URL}/appointment-requests/send-otp`, { email }).subscribe({
            next: (res) => {
                this.otpSending.set(false);
                if (res.success) {
                    this.otpSent.set(true);
                    this.appointmentForm.get('otp')?.setValidators([Validators.required, Validators.minLength(6), Validators.maxLength(6)]);
                    this.appointmentForm.get('otp')?.updateValueAndValidity();
                } else {
                    this.formError.set(res.message || 'Failed to send OTP.');
                }
            },
            error: (err) => {
                this.otpSending.set(false);
                this.formError.set(err?.error?.message ?? 'Failed to send verification code. Please try again.');
            }
        });
    }

    verifyOtp() {
        const email = this.appointmentForm.get('email')?.value;
        const otp = this.appointmentForm.get('otp')?.value;

        if (this.appointmentForm.get('otp')?.invalid || !otp || !email) return;

        this.otpVerifying.set(true);
        this.formError.set('');

        this.http.post<any>(`${this.API_URL}/appointment-requests/verify-otp`, { email, otp }).subscribe({
            next: (res) => {
                this.otpVerifying.set(false);
                if (res.success) {
                    this.otpVerified.set(true);
                    this.formError.set('');
                } else {
                    this.formError.set(res.message || 'Invalid or expired OTP.');
                }
            },
            error: (err) => {
                this.otpVerifying.set(false);
                this.formError.set(err?.error?.message ?? 'Verification failed. Please try again.');
            }
        });
    }

    submitRequest() {
        if (this.appointmentForm.invalid) {
            this.appointmentForm.markAllAsTouched();
            return;
        }

        if (!this.otpVerified()) {
            this.formError.set('Please verify your email address with OTP first.');
            return;
        }

        this.submitting.set(true);
        this.formError.set('');

        const payload = {
            ...this.appointmentForm.value,
            isFirstVisit: this.appointmentForm.value.isFirstVisit === 'true'
                || this.appointmentForm.value.isFirstVisit === true,
        };

        this.http.post<any>(`${this.API_URL}/appointment-requests`, payload).subscribe({
            next: (res) => {
                this.submitting.set(false);
                if (res.success) {
                    this.referenceNumber.set(res.data.referenceNumber);
                    this.submitted.set(true);
                }
            },
            error: (err) => {
                this.submitting.set(false);
                this.formError.set(err?.error?.message ?? 'Something went wrong. Please try again.');
            }
        });
    }

    resetForm() {
        this.appointmentForm.reset({ visitType: 'Consultation', isFirstVisit: true });
        this.otpSent.set(false);
        this.otpVerified.set(false);
        this.appointmentForm.get('otp')?.clearValidators();
        this.appointmentForm.get('otp')?.updateValueAndValidity();
        this.submitted.set(false);
        this.referenceNumber.set('');
    }

    trackRequest() {
        if (!this.trackRef.trim()) return;
        this.tracking.set(true);
        this.trackResult.set(null);
        this.trackError.set('');

        this.http.get<any>(`${this.API_URL}/appointment-requests/track/${this.trackRef}`).subscribe({
            next: (res) => {
                this.tracking.set(false);
                if (res.success) this.trackResult.set(res.data);
            },
            error: () => {
                this.tracking.set(false);
                this.trackError.set('Reference number not found. Please check and try again.');
            }
        });
    }

    getStatusClass(status: string): string {
        return status?.toLowerCase() ?? 'pending';
    }
}