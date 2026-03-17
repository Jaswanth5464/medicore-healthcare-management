import { Component, OnInit, AfterViewChecked, signal, inject, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfigService } from '../../../core/services/config.service';
import { PatientDoctorChatComponent } from '../../communication/chat/patient-doctor-chat.component';
import { SignalRService } from '../../../core/services/signalr.service';
import { VideoCallComponent } from '../../communication/video/video-call.component';

// const BASE_URL = 'https://localhost:7113';

declare var Razorpay: any;
declare var QRCode: any;

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, PatientDoctorChatComponent, VideoCallComponent],
  template: `
    <div class="patient-dash">
      <!-- Video Consultation Overlay -->
      <div class="video-overlay" *ngIf="activeVideoRoom()">
        <div class="video-modal-content">
          <app-video-call 
            [roomName]="activeVideoRoom().roomName" 
            [userName]="auth.currentUser()?.fullName || 'Patient'"
            [isDoctor]="false"
            (onEndCall)="activeVideoRoom.set(null)">
          </app-video-call>
        </div>
      </div>
      <div class="header">
        <div class="header-left">
          <div class="avatar">{{ auth.currentUser()?.fullName?.[0] || 'P' }}</div>
          <div>
            <h1>Hello, {{ auth.currentUser()?.fullName }}</h1>
            <p>Welcome to your Patient Portal</p>
          </div>
        </div>
        <button class="primary-btn pulse" (click)="activeTab.set('book')">
          + Book Appointment
        </button>
      </div>

      <!-- PATIENT VISIT STREAK -->
      <div class="streak-banner" *ngIf="activeTab() === 'upcoming' || activeTab() === 'past'">
        <div class="streak-item">
          <div class="streak-icon">🔥</div>
          <div>
            <div class="streak-val">{{ streakData().count }}</div>
            <div class="streak-lbl">Visits This Year</div>
          </div>
        </div>
        <div class="streak-item">
          <div class="streak-icon">📅</div>
          <div>
            <div class="streak-val">{{ streakData().daysAgo === 'No past visits' ? '--' : streakData().daysAgo }}</div>
            <div class="streak-lbl">Days Since Last Visit</div>
          </div>
        </div>
        <div class="streak-item recommendation">
          <div class="streak-icon">💡</div>
          <div>
            <div class="streak-val">Next Step</div>
            <div class="streak-lbl">{{ streakData().recommendation }}</div>
          </div>
        </div>
      </div>

      <div class="tabs">
        <button [class.active]="activeTab() === 'upcoming'" (click)="activeTab.set('upcoming')">Upcoming Appointments</button>
        <button [class.active]="activeTab() === 'past'" (click)="activeTab.set('past')">Past Visits</button>
        <button [class.active]="activeTab() === 'bills'" (click)="activeTab.set('bills')">My Bills</button>
        <button [class.active]="activeTab() === 'profile'" (click)="activeTab.set('profile')">My Profile</button>
        <button [class.active]="activeTab() === 'book'" (click)="activeTab.set('book')">Book Doctor</button>
      </div>

      <div class="tab-content" [ngSwitch]="activeTab()">
        
        <!-- UPCOMING -->
        <div *ngSwitchCase="'upcoming'" class="fade-in">
          <div *ngIf="loading()" class="skeleton">Loading appointments...</div>
          <div *ngIf="!loading() && upcoming().length === 0" class="empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <p>You have no upcoming appointments.</p>
            <button class="text-btn" (click)="activeTab.set('book')">Book one now</button>
          </div>
          <div class="cards-grid" *ngIf="!loading() && upcoming().length > 0">
            <div class="appt-card" *ngFor="let a of upcoming()" [class.video-card]="a.isVideoConsultation">
              <div class="card-head">
                <span class="status-badge" [class]="a.status.toLowerCase()">{{ a.status }}</span>
                <span class="token">Token: #{{ a.tokenNumber }}</span>
              </div>
              <h3 style="display:flex; align-items:center; gap:8px;">
                Dr. {{ a.doctorName }}
                <span *ngIf="a.isVideoConsultation" class="video-icon" title="Video Consultation">📹</span>
              </h3>
              <p class="dept">{{ a.departmentName }}</p>
              <div class="card-details">
                <div><label>Date</label><span>{{ formatDate(a.appointmentDate) }}</span></div>
                <div><label>Time</label><span>{{ a.timeSlot }}</span></div>
                <div><label>Fee</label><span>₹{{ a.consultationFee }}</span></div>
              </div>
              <div class="appt-actions" style="margin-top:16px; display:flex; gap:8px; flex-wrap:wrap;">
                <button class="pay-btn text-sm" *ngIf="a.paymentStatus !== 'Paid' && a.paymentStatus !== 'PendingOffline'" (click)="payForAppointment(a)">Pay Online</button>
                <button class="action-btn-sm" *ngIf="a.paymentStatus !== 'Paid' && a.paymentStatus !== 'PendingOffline'" (click)="requestOfflinePayment(a)">Pay at Reception</button>

                <div *ngIf="a.paymentStatus === 'PendingOffline'" style="color:#b45309; font-weight:700; font-size:13px; margin:auto 0; display:flex; align-items:center; gap:4px; background:#fff7ed; padding:4px 8px; border-radius:8px; border:1px solid #fed7aa;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Awaiting Reception
                </div>

                <div *ngIf="a.paymentStatus === 'Paid'" style="color:#16a34a; font-weight:700; font-size:13px; margin:auto 0; display:flex; align-items:center; gap:4px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  Paid
                </div>

                <!-- Video Join Button -->
                <button *ngIf="a.isVideoConsultation" 
                        class="primary-btn pulse" 
                        style="padding: 6px 12px; font-size: 12px;"
                        (click)="joinVideoCall(a.id)">
                  Join Video Call
                </button>

                <button class="action-btn-sm" (click)="sendReminder(a)" title="Send Reminder Email">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"/></svg>
                  Remind Me
                </button>

                <button class="action-btn-sm qr" (click)="showQrToken(a)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><path d="M7 7h.01M17 7h.01M7 17h.01"/></svg>
                  QR Slip
                </button>

                <button class="action-btn-sm" (click)="selectedChatDoctor.set({id: a.doctorUserId, name: a.doctorName})" title="Chat with Doctor">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Chat
                </button>

                <button class="text-btn danger" style="margin-left:auto; color:#ef4444; background:none; border:none; cursor:pointer;" (click)="cancelAppt(a)">Cancel</button>
              </div>
            </div>
          </div>
        </div>

        <!-- CHAT OVERLAY -->
        <div class="chat-overlay" *ngIf="selectedChatDoctor()" style="position:fixed; bottom:20px; right:20px; width:350px; z-index:1000;">
          <app-patient-doctor-chat 
            [otherUserId]="selectedChatDoctor().id" 
            [otherUserName]="selectedChatDoctor().name"
            [isMini]="true"
            (close)="selectedChatDoctor.set(null)">
          </app-patient-doctor-chat>
        </div>

        <!-- PAST -->
        <div *ngSwitchCase="'past'" class="fade-in">
          <div *ngIf="loading()" class="skeleton">Loading history...</div>
          <div *ngIf="!loading() && past().length === 0" class="empty">
            <p>No past visits found.</p>
          </div>
          <div class="cards-grid" *ngIf="!loading() && past().length > 0">
            <div class="appt-card past" *ngFor="let a of past()">
              <div class="card-head">
                <span class="status-badge" [class]="a.status.toLowerCase()">{{ a.status }}</span>
              </div>
              <h3>
                Dr. {{ a.doctorName }}
                <span *ngIf="a.isVideoConsultation" title="Video Consultation">📹</span>
              </h3>
              <p class="dept">{{ a.departmentName }}</p>
              <div class="card-details">
                <div><label>Date</label><span>{{ formatDate(a.appointmentDate) }}</span></div>
                <div><span class="link" (click)="viewPrescription(a.id, a.doctorName, a.appointmentDate)">📄 View Report</span></div>
              </div>
              <div style="margin-top: 12px; text-align: right;" *ngIf="a.status === 'Completed'">
                <button class="secondary-btn text-sm" (click)="openFeedback(a)">
                  {{ a.feedbackSubmitted ? '⭐ View Feedback' : '⭐ Leave Feedback' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- PRESCRIPTION MODAL -->
        <div class="modal-overlay" *ngIf="viewingApptId()">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Medical Report</h2>
              <div style="display:flex; gap:12px;">
                <button class="secondary-btn text-sm" (click)="printReport()">🖨️ Print as PDF</button>
                <button class="close-btn" (click)="closePrescription()">✕</button>
              </div>
            </div>
            
            <div class="modal-body" *ngIf="consultationData()">
              <p class="subtitle">Consultation with <strong>Dr. {{ viewingDocName() }}</strong> on <strong>{{ formatDate(viewingApptDate()) }}</strong></p>

              <!-- Vitals -->
              <div class="section" *ngIf="consultationData().vitals?.length > 0">
                <h3><span class="icon">❤️</span> Vitals</h3>
                <div class="vitals-grid">
                  <div *ngIf="consultationData().vitals[0].bloodPressure"><span>BP:</span> {{ consultationData().vitals[0].bloodPressure }}</div>
                  <div *ngIf="consultationData().vitals[0].heartRateBpm"><span>Heart Rate:</span> {{ consultationData().vitals[0].heartRateBpm }} bpm</div>
                  <div *ngIf="consultationData().vitals[0].temperatureFahrenheit"><span>Temp:</span> {{ consultationData().vitals[0].temperatureFahrenheit }} °F</div>
                  <div *ngIf="consultationData().vitals[0].weightKg"><span>Weight:</span> {{ consultationData().vitals[0].weightKg }} kg</div>
                  <div *ngIf="consultationData().vitals[0].spO2"><span>SpO2:</span> {{ consultationData().vitals[0].spO2 }}%</div>
                </div>
              </div>

              <!-- Prescription -->
              <div class="section" *ngIf="consultationData().prescriptions?.length > 0">
                <h3><span class="icon">💊</span> Prescription</h3>
                <div class="presc-box">
                  <p class="diagnosis"><strong>Diagnosis:</strong> {{ consultationData().prescriptions[0].diagnosis }}</p>
                  <div class="medicines">
                    <strong>Medicines:</strong>
                    <pre>{{ consultationData().prescriptions[0].medicinesJson }}</pre>
                  </div>
                  <p class="advice" *ngIf="consultationData().prescriptions[0].advice">
                    <strong>Advice:</strong> {{ consultationData().prescriptions[0].advice }}
                  </p>
                </div>
              </div>

              <!-- Lab Orders -->
              <div class="section" *ngIf="consultationData().labOrders?.length > 0">
                <h3><span class="icon">🔬</span> Lab Tests Ordered</h3>
                <ul class="lab-list">
                  <li *ngFor="let lab of consultationData().labOrders" class="lab-list-item">
                    <div class="lab-summary">
                      <strong>{{ lab.testType }}</strong> - {{ lab.notes }}
                      <span class="lab-status" [class]="lab.status.toLowerCase()">{{ lab.status }}</span>
                    </div>

                    <!-- Lab Results for Patient -->
                    <div *ngIf="lab.status === 'Completed' && lab.resultsJson" class="lab-results-box">
                      <table>
                        <thead><tr><th>Test Parameter</th><th>Your Result</th><th>Ref Range</th></tr></thead>
                        <tbody>
                          <tr *ngFor="let res of parseResults(lab.resultsJson)">
                            <td>{{ res.parameter }}</td>
                            <td class="res-val" [class.critical]="lab.criticalAlert">{{ res.value }}</td>
                            <td class="ref-range">{{ res.normalRange }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div *ngIf="lab.status === 'Completed' && lab.reportUrl" class="lab-actions">
                      <a [href]="lab.reportUrl" target="_blank" class="download-link">🔗 Download Official PDF Report</a>
                      <span *ngIf="lab.resultNotes" class="lab-tech-note"><strong>Note:</strong> {{ lab.resultNotes }}</span>
                    </div>
                  </li>
                </ul>
              </div>

              <div *ngIf="!consultationData().vitals?.length && !consultationData().prescriptions?.length && !consultationData().labOrders?.length" class="empty-data">
                The doctor has not uploaded any reports for this visit yet.
              </div>
            </div>
            <div class="modal-body" *ngIf="!consultationData()">
              <div class="skeleton">Loading report...</div>
            </div>
          </div>
        </div>

        <!-- QR TOKEN MODAL -->
        <div class="modal-overlay" *ngIf="viewingQrData()">
          <div class="modal-content qr-modal">
            <div class="modal-header">
              <h2>QR Token Slip</h2>
              <button class="close-btn" (click)="viewingQrData.set(null)">✕</button>
            </div>
            <div class="modal-body qr-body">
              <div class="qr-token">{{ viewingQrData().tokenNumber }}</div>
              <p class="qr-hint">Scan this at the reception desk for instant check-in</p>
              
              <div class="qr-container">
                <canvas id="qrCanvas" #qrCanvas></canvas>
              </div>

              <div class="qr-info">
                <div class="qr-row"><span>Patient</span><strong>{{ viewingQrData().patientName }}</strong></div>
                <div class="qr-row"><span>Doctor</span><strong>Dr. {{ viewingQrData().doctorName }}</strong></div>
                <div class="qr-row"><span>Dept</span><strong>{{ viewingQrData().department }}</strong></div>
                <div class="qr-row"><span>Slot</span><strong>{{ viewingQrData().date }} | {{ viewingQrData().time }}</strong></div>
              </div>

              <button class="primary-btn" (click)="printQr()">Download Slip</button>
            </div>
          </div>
        </div>

        <!-- MY PROFILE -->
        <div *ngSwitchCase="'profile'" class="fade-in profile-panel">
          <div class="profile-grid">
            <!-- ID Card Section -->
            <div class="card-column">
              <div class="medical-id-card">
                <div class="id-header">
                  <div class="brand">MediCore<span>HMS</span></div>
                  <div class="chip">HEALTH ID</div>
                </div>
                <div class="id-body">
                  <div class="pt-photo">{{ auth.currentUser()?.fullName?.[0] }}</div>
                  <div class="pt-details">
                    <h3>{{ auth.currentUser()?.fullName }}</h3>
                    <p class="pt-role">Patient ID: #MC{{ auth.currentUser()?.id }}</p>
                    <div class="mini-vitals-row">
                      <div class="mini-vital">
                        <span>Blood Group</span>
                        <strong>{{ patientProfile().bloodGroup || 'N/A' }}</strong>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="id-footer">
                  <div class="emergency">EMERGENCY: {{ patientProfile().emergencyContactPhone || 'Not Set' }}</div>
                  <div class="qr-mock">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h4v4H3zM17 3h4v4h-4zM3 17h4v4H3zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2v2h-2zM18 14h2v2h-2zM11 11h2v2h-2z"/></svg>
                  </div>
                </div>
              </div>
              <p class="hint">Digital ID card for hospital registry and emergency lookup.</p>
            </div>

            <!-- Profile Data Section -->
            <div class="data-column">
              <div class="panel">
                <div class="panel-head"><h3>Medical Information</h3></div>
                <div class="panel-body form-grid">
                  <div class="input-group">
                    <label>Blood Group</label>
                    <select [(ngModel)]="profileEdit.bloodGroup">
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                  <div class="input-group full"><label>Allergies</label><input [(ngModel)]="profileEdit.allergies" placeholder="e.g. Penicillin, Peanuts"></div>
                  <div class="input-group full"><label>Chronic Conditions</label><textarea [(ngModel)]="profileEdit.chronicConditions" placeholder="e.g. Diabetes, Hypertension" rows="2"></textarea></div>
                </div>
              </div>

              <div class="panel" style="margin-top:20px;">
                <div class="panel-head"><h3>Emergency Contact</h3></div>
                <div class="panel-body form-grid">
                  <div class="input-group"><label>Contact Name</label><input [(ngModel)]="profileEdit.emergencyContactName"></div>
                  <div class="input-group"><label>Contact Phone</label><input [(ngModel)]="profileEdit.emergencyContactPhone"></div>
                </div>
              </div>

              <div style="margin-top:20px; text-align:right;">
                <button class="primary-btn" (click)="updateProfile()">Save Profile Changes</button>
              </div>
            </div>
          </div>
        </div>

        <!-- BOOK APPOINTMENT -->
        <div *ngSwitchCase="'book'" class="fade-in book-panel">
          <h2>Book a New Appointment</h2>
          <div class="stepper">
            <div class="step" [class.active]="bookStep() === 1" [class.completed]="bookStep() > 1" (click)="bookStep() > 1 && bookStep.set(1)">
              <div class="step-icon">1</div>
              <span>Department</span>
            </div>
            <div class="step-line"></div>
            <div class="step" [class.active]="bookStep() === 2" [class.completed]="bookStep() > 2" (click)="bookStep() > 2 && bookStep.set(2)">
              <div class="step-icon">2</div>
              <span>Doctor</span>
            </div>
            <div class="step-line"></div>
            <div class="step" [class.active]="bookStep() === 3">
              <div class="step-icon">3</div>
              <span>Slot</span>
            </div>
          </div>

          <div class="step-content">
            <div *ngIf="bookStep() === 1" class="cards-grid">
              <div class="dept-card" *ngFor="let d of departments()" (click)="selectDepartment(d.id)">
                <span>{{ d.name }}</span>
              </div>
            </div>

            <div *ngIf="bookStep() === 2">
              <button class="back-btn" (click)="bookStep.set(1)">← Back to Departments</button>
              <div class="cards-grid" style="margin-top:16px;">
                <div class="doc-card" *ngFor="let doc of deptDoctors()" (click)="selectDoctor(doc.id)">
                  <div class="doc-avatar">{{ doc.fullName[0] }}</div>
                  <div>
                    <h4>Dr. {{ doc.fullName }}</h4>
                    <p>{{ doc.specialization }}</p>
                    <p class="fee">Fee: ₹{{ doc.consultationFee }}</p>
                  </div>
                </div>
                <div *ngIf="deptDoctors().length === 0">No doctors available in this department.</div>
              </div>
            </div>

            <div *ngIf="bookStep() === 3" class="slot-selection">
              <button class="back-btn" (click)="bookStep.set(2)">← Back to Doctors</button>
              
              <div class="form-group" style="margin-top:20px; max-width:300px;">
                <label>Select Date</label>
                <input type="date" [(ngModel)]="bookDate" (ngModelChange)="loadSlots()" [min]="minDate()">
              </div>

              <div class="slots-grid" *ngIf="slots().length > 0" style="margin-top:20px;">
                <button *ngFor="let s of slots()" class="slot-btn" 
                        [class.booked]="s.isBooked" 
                        [class.selected]="bookTime === s.time"
                        [disabled]="s.isBooked"
                        (click)="bookTime = s.time">
                  {{ s.displayTime }}
                </button>
              </div>
              <div *ngIf="bookDate && slots().length === 0" style="margin-top:20px; color:#64748b;">
                No slots available on this date.
              </div>

              <div class="form-group" style="margin-top:20px;">
                <label>Symptoms / Reason for visit</label>
                <textarea [(ngModel)]="bookSymptoms" rows="3"></textarea>
              </div>

              <div class="form-group" style="margin-top:20px; flex-direction:row; align-items:center; gap:8px;">
                <input type="checkbox" id="videoConsult" [(ngModel)]="bookIsVideo" style="width:20px; height:20px; accent-color:#6366f1;">
                <label for="videoConsult" style="font-size:15px; cursor:pointer;">
                   Is this a video consultation? <span style="font-size:18px;">📹</span>
                </label>
              </div>

              <div style="margin-top:24px; text-align:right;">
                <button class="primary-btn" (click)="confirmBooking()" [disabled]="!bookDate || !bookTime || submitting()">
                  {{ submitting() ? 'Booking...' : 'Confirm Appointment' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- MY BILLS -->
        <div *ngSwitchCase="'bills'" class="fade-in">
          <div *ngIf="loading()" class="skeleton">Loading bills...</div>
          <div *ngIf="!loading() && bills().length === 0" class="empty">
            <p>You have no bills.</p>
          </div>
          
          <div class="bills-list" *ngIf="!loading() && bills().length > 0">
            <div class="bill-card" *ngFor="let b of bills()">
              <div class="bill-header">
                <div>
                  <h3>{{ b.billNumber }}</h3>
                  <span class="bill-date">{{ formatDate(b.createdAt) }}</span>
                </div>
                <div class="bill-status" [class]="b.status.toLowerCase()">{{ b.status }}</div>
              </div>
              
              <div class="bill-doctor">
                <span *ngIf="b.billSource === 'Laboratory'">🧪 Lab Test</span>
                <span *ngIf="b.billSource !== 'Laboratory'">Doctor:</span> 
                <strong>{{ b.billSource === 'Laboratory' ? 'Diagnostics Center' : 'Dr. ' + b.doctorName }}</strong>
              </div>

              <div class="bill-items">
                <div class="bill-item" *ngFor="let item of parseItems(b.items)">
                  <span style="display:flex; align-items:center; gap:8px;">
                    <svg *ngIf="b.billSource === 'Laboratory'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    {{ item.description || item.name || 'Service Item' }}
                  </span>
                  <span>₹{{ item.amount || item.price }}</span>
                </div>
              </div>

              <div class="bill-footer">
                <div class="bill-total">
                  <span>Total Due</span>
                  <strong>₹{{ b.totalAmount }}</strong>
                </div>
                <div class="bill-actions">
                  <button *ngIf="b.status === 'Unpaid'" class="pay-btn pulse" (click)="payBill(b)">Pay Now</button>
                  <button *ngIf="b.status === 'Paid'" class="download-btn" (click)="downloadReceipt(b)">Download Receipt</button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- PRINTABLE RECEIPT (Hidden on screen) -->
    <div id="receiptPrint" class="printable-receipt" *ngIf="selectedBillForPrint()">
      <div class="p-header">
        <div class="p-brand">MediCore<span>HMS</span></div>
        <div class="p-title">PAYMENT RECEIPT</div>
      </div>
      <div class="p-meta">
        <div>
          <label>Bill No:</label> <strong>{{ selectedBillForPrint().billNumber }}</strong>
        </div>
        <div>
          <label>Date:</label> <span>{{ formatDate(selectedBillForPrint().createdAt) }}</span>
        </div>
      </div>
      <div class="p-details">
        <div class="p-row">
          <label>Patient Name:</label> <span>{{ auth.currentUser()?.fullName }}</span>
        </div>
        <div class="p-row">
          <label>Doctor:</label> <span>Dr. {{ selectedBillForPrint().doctorName }}</span>
        </div>
        <div class="p-row">
          <label>Payment Mode:</label> <span>{{ selectedBillForPrint().paymentMode || 'Online' }}</span>
        </div>
        <div class="p-row">
          <label>Status:</label> <span class="p-paid">PAID</span>
        </div>
      </div>
      <table class="p-table">
        <thead>
          <tr><th>Description</th><th class="p-num">Amount</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of parseItems(selectedBillForPrint().items)">
            <td>{{ item.description }}</td>
            <td class="p-num">₹{{ item.amount }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>TOTAL AMOUNT</td>
            <td class="p-num">₹{{ selectedBillForPrint().totalAmount }}</td>
          </tr>
        </tfoot>
      </table>
      <div class="p-footer">
        <p>This is a computer-generated receipt and does not require a physical signature.</p>
        <p>Thank you for choosing MediCore HMS for your healthcare needs.</p>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    :host { display:block; font-family:'Inter',sans-serif; background:#f8fafc; min-height:100vh; padding:24px; }
    * { box-sizing:border-box; margin:0; padding:0; }

    .header { display:flex; justify-content:space-between; align-items:center; background:linear-gradient(135deg,#6366f1,#8b5cf6); padding:24px 30px; border-radius:16px; color:#fff; box-shadow:0 10px 25px rgba(99,102,241,0.2); margin-bottom:24px; }
    .header-left { display:flex; align-items:center; gap:16px; }
    .avatar { width:56px; height:56px; border-radius:14px; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:700; }
    .header h1 { font-size:24px; font-weight:700; margin-bottom:4px; }
    .header p { font-size:14px; opacity:0.8; }
    .primary-btn { background:#fff; color:#6366f1; border:none; padding:12px 24px; border-radius:12px; font-weight:700; cursor:pointer; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.1); transition:all 0.2s; }
    .primary-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 8px 20px rgba(0,0,0,0.15); }
    .primary-btn:disabled { opacity:0.6; cursor:not-allowed; }

    .tabs { display:flex; gap:10px; margin-bottom:20px; }
    .tabs button { padding:10px 20px; background:#fff; border:1px solid #e2e8f0; border-radius:10px; font-size:14px; font-weight:600; color:#64748b; cursor:pointer; transition:all 0.2s; }
    .tabs button.active { background:#6366f1; color:#fff; border-color:#6366f1; box-shadow:0 4px 12px rgba(99,102,241,0.2); }

    .fade-in { animation:fadeIn 0.3s ease; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:none;} }

    .empty { padding:60px; text-align:center; color:#94a3b8; background:#fff; border-radius:16px; border:1px dashed #cbd5e1; }
    .text-btn { background:none; border:none; color:#6366f1; font-weight:600; cursor:pointer; margin-top:8px; }

    .cards-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:20px; }
    .appt-card { background:#fff; padding:20px; border-radius:16px; box-shadow:0 4px 14px rgba(0,0,0,0.03); border:1px solid #f1f5f9; transition:all 0.2s; }
    .appt-card:hover { transform:translateY(-4px); box-shadow:0 12px 24px rgba(0,0,0,0.06); }
    .card-head { display:flex; justify-content:space-between; margin-bottom:12px; }
    .status-badge { font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; text-transform:uppercase; }
    .status-badge.scheduled { background:#e0f2fe; color:#0369a1; }
    .status-badge.completed { background:#dcfce7; color:#166534; }
    .status-badge.checkedin, .status-badge.withdoctor { background:#f3e8ff; color:#6b21a8; }
    .token { font-size:12px; font-weight:700; color:#64748b; font-family:monospace; }
    .appt-card h3 { font-size:18px; color:#0f172a; margin-bottom:2px; }
    .dept { font-size:13px; color:#64748b; margin-bottom:16px; }
    .card-details { display:flex; justify-content:space-between; background:#f8fafc; padding:12px; border-radius:10px; }
    .card-details div { display:flex; flex-direction:column; gap:2px; }
    .card-details label { font-size:10px; text-transform:uppercase; color:#94a3b8; font-weight:700; }
    .card-details span { font-size:13px; font-weight:600; color:#334155; }
    .link { color:#6366f1 !important; cursor:pointer; }
    
    .book-panel { background:#fff; padding:30px; border-radius:16px; box-shadow:0 4px 14px rgba(0,0,0,0.03); }
    .stepper { display:flex; gap:12px; margin:20px 0 30px; border-bottom:2px solid #f1f5f9; padding-bottom:16px; }
    .step { font-size:14px; font-weight:600; color:#94a3b8; }
    .step.active { color:#6366f1; }

    .dept-card { padding:20px; border:2px solid #e2e8f0; border-radius:12px; text-align:center; font-weight:600; color:#334155; cursor:pointer; transition:all 0.2s; }
    .dept-card:hover { border-color:#6366f1; color:#6366f1; background:#e0e7ff; }

    .doc-card { display:flex; gap:16px; padding:20px; border:1px solid #e2e8f0; border-radius:12px; cursor:pointer; transition:all 0.2s; }
    .doc-card:hover { border-color:#6366f1; box-shadow:0 8px 20px rgba(99,102,241,0.1); }
    .doc-avatar { width:48px; height:48px; border-radius:12px; background:#6366f1; color:#fff; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:700; }
    .doc-card h4 { font-size:16px; color:#0f172a; margin-bottom:4px; }
    .doc-card p { font-size:13px; color:#64748b; }
    .doc-card .fee { font-weight:600; color:#10b981; margin-top:6px; }

    .back-btn { background:none; border:none; color:#64748b; font-weight:600; cursor:pointer; font-size:14px; }
    .back-btn:hover { color:#0f172a; }

    .form-group { display:flex; flex-direction:column; gap:6px; }
    .form-group label { font-size:13px; font-weight:600; color:#475569; }
    .form-group input, .form-group textarea { padding:12px; border:1px solid #cbd5e1; border-radius:10px; font-family:inherit; font-size:14px; outline:none; }
    .form-group input:focus, .form-group textarea:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,0.1); }

    .slots-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(100px, 1fr)); gap:12px; }
    .slot-btn { padding:10px; border:1px solid #cbd5e1; border-radius:8px; background:#fff; font-size:13px; font-weight:600; color:#334155; cursor:pointer; transition:all 0.2s; }
    .slot-btn:hover:not(:disabled) { border-color:#6366f1; color:#6366f1; }
    .slot-btn.selected { background:#6366f1; color:#fff; border-color:#6366f1; }
    .slot-btn.booked { background:#f1f5f9; color:#94a3b8; text-decoration:line-through; cursor:not-allowed; }

    /* Modal Styles */
    .modal-overlay { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.6); backdrop-filter:blur(4px); z-index:100; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.2s; }
    .modal-content { background:#fff; width:90%; max-width:600px; border-radius:20px; box-shadow:0 20px 40px rgba(0,0,0,0.2); overflow:hidden; max-height:90vh; display:flex; flex-direction:column; }
    .modal-header { padding:20px 24px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; background:#f8fafc; }
    .modal-header h2 { font-size:20px; color:#0f172a; margin:0; }
    .close-btn { background:none; border:none; font-size:20px; color:#64748b; cursor:pointer; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; transition:background 0.2s; }
    .close-btn:hover { background:#e2e8f0; color:#0f172a; }
    .modal-body { padding:24px; overflow-y:auto; }

    .subtitle { color:#64748b; font-size:14px; margin-bottom:24px; padding-bottom:16px; border-bottom:1px dashed #e2e8f0; }
    .section { margin-bottom:24px; }
    .section h3 { font-size:15px; color:#1e293b; margin-bottom:12px; display:flex; align-items:center; gap:8px; }
    
    .vitals-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:12px; background:#f1f5f9; padding:16px; border-radius:12px; }
    .vitals-grid div { font-size:14px; color:#334155; font-weight:600; }
    .vitals-grid span { color:#64748b; font-weight:500; font-size:12px; text-transform:uppercase; margin-right:4px; }

    .presc-box { border:1px solid #cbd5e1; border-radius:12px; padding:16px; background:#fff; box-shadow:0 2px 4px rgba(0,0,0,0.02); }
    .diagnosis { font-size:15px; color:#0f172a; margin-bottom:12px; }
    .medicines { background:#f8fafc; padding:12px; border-radius:8px; margin-bottom:12px; }
    .medicines pre { font-family:inherit; font-size:14px; color:#334155; white-space:pre-wrap; margin-top:8px; }
    .advice { color:#0369a1; font-size:14px; background:#e0f2fe; padding:12px; border-radius:8px; }

    .lab-list { list-style:none; padding:0; display:flex; flex-direction:column; gap:12px; }
    .lab-list-item { background:#f8fafc; border:1px solid #e2e8f0; padding:16px; border-radius:12px; }
    .lab-summary { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-size:14px; }
    .lab-status { font-size:10px; font-weight:700; background:#fef3c7; color:#b45309; padding:4px 10px; border-radius:12px; text-transform:uppercase; }
    .lab-status.completed { background:#dcfce7; color:#166534; }
    .lab-results-box { background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:12px; margin-bottom:12px; }
    .lab-results-box table { width:100%; border-collapse:collapse; font-size:12px; }
    .lab-results-box th { text-align:left; color:#64748b; padding-bottom:8px; border-bottom:1px solid #f1f5f9; }
    .lab-results-box td { padding:8px 0; border-bottom:1px dashed #f1f5f9; }
    .res-val { font-weight:700; color:#1e1b4b; }
    .res-val.critical { color:#ef4444; }
    .ref-range { color:#94a3b8; font-size:11px; }
    .lab-actions { display:flex; justify-content:space-between; align-items:center; padding-top:8px; border-top:1px solid #f1f5f9; }
    .download-link { font-size:12px; color:#2563eb; font-weight:600; text-decoration:none; }
    .lab-tech-note { font-size:11px; color:#64748b; font-style:italic; }

    .empty-data { text-align:center; padding:40px; color:#94a3b8; font-style:italic; border:1px dashed #cbd5e1; border-radius:12px; }

    /* Bills Styles */
    .bills-list { display:flex; flex-direction:column; gap:20px; max-width:800px; margin:0 auto; }
    .bill-card { background:#fff; border-radius:16px; border:1px solid #e2e8f0; padding:24px; box-shadow:0 4px 14px rgba(0,0,0,0.02); }
    .bill-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid #f1f5f9; }
    .bill-header h3 { font-size:18px; color:#0f172a; margin-bottom:4px; font-family:monospace; }
    .bill-date { font-size:13px; color:#64748b; }
    .bill-status { font-size:12px; font-weight:700; padding:6px 12px; border-radius:20px; text-transform:uppercase; }
    .bill-status.unpaid { background:#fef2f2; color:#ef4444; }
    .bill-status.paid { background:#dcfce7; color:#16a34a; }
    
    .bill-doctor { font-size:14px; color:#334155; margin-bottom:20px; }
    .bill-doctor span { color:#64748b; margin-right:8px; }

    .bill-items { background:#f8fafc; border-radius:12px; padding:16px; margin-bottom:20px; display:flex; flex-direction:column; gap:12px; }
    .bill-item { display:flex; justify-content:space-between; font-size:14px; color:#334155; }
    .bill-item:not(:last-child) { padding-bottom:12px; border-bottom:1px dashed #cbd5e1; }

    .bill-footer { display:flex; justify-content:space-between; align-items:center; margin-top:16px; padding-top:16px; border-top:1px solid #f1f5f9; }
    .bill-total { display:flex; flex-direction:column; }
    .bill-total span { font-size:12px; color:#64748b; text-transform:uppercase; font-weight:700; margin-bottom:4px; }
    .bill-total strong { font-size:24px; color:#0f172a; font-weight:700; }
    
    .pay-btn { background:#6366f1; color:#fff; border:none; padding:12px 24px; border-radius:12px; font-weight:700; font-size:15px; cursor:pointer; box-shadow:0 4px 12px rgba(99,102,241,0.2); transition:all 0.2s; }
    .pay-btn:hover { background:#4f46e5; transform:translateY(-2px); box-shadow:0 8px 16px rgba(99,102,241,0.3); }
    .download-btn { background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; padding:10px 20px; border-radius:10px; font-weight:600; font-size:14px; cursor:pointer; }
    .download-btn:hover { background:#e2e8f0; color:#0f172a; }

    /* Profile & ID Card */
    .profile-grid { display:grid; grid-template-columns:1fr 1.5fr; gap:30px; align-items:flex-start; }
    @media (max-width:900px) { .profile-grid { grid-template-columns:1fr; } }
    
    .medical-id-card { 
      background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); 
      border-radius:20px; padding:24px; color:#fff; position:relative; overflow:hidden;
      box-shadow:0 10px 25px rgba(0,0,0,0.2); aspect-ratio:1.6 / 1;
    }
    .medical-id-card::after { content:''; position:absolute; top:-20%; right:-10%; width:50%; height:120%; background:rgba(59,130,246,0.1); transform:rotate(15deg); }
    
    .id-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
    .brand { font-weight:800; font-size:18px; letter-spacing:-0.5px; }
    .brand span { color:#3b82f6; }
    .id-header .chip { background:rgba(59,130,246,0.2); border:1px solid rgba(59,130,246,0.5); padding:4px 8px; border-radius:6px; font-size:10px; font-weight:700; }
    
    .id-body { display:flex; gap:20px; align-items:center; margin-bottom:20px; }
    .pt-photo { width:70px; height:70px; background:#fff; color:#0f172a; border-radius:15px; display:flex; align-items:center; justify-content:center; font-size:32px; font-weight:800; }
    .pt-details h3 { font-size:18px; margin:0; }
    .pt-role { font-size:12px; opacity:0.6; margin:2px 0 10px 0; }
    .mini-vital { font-size:11px; }
    .mini-vital strong { display:block; font-size:16px; color:#3b82f6; margin-top:2px; }
    
    .id-footer { display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid rgba(255,255,255,0.1); padding-top:15px; }
    .emergency { font-size:10px; opacity:0.7; font-weight:600; }
    .qr-mock { width:40px; height:40px; background:#fff; border-radius:6px; display:flex; align-items:center; justify-content:center; color:#000; font-size:8px; font-weight:900; }
    .hint { color:#64748b; font-size:12px; text-align:center; margin-top:15px; font-style:italic; }
    .panel { border:1px solid #e2e8f0; border-radius:12px; background:#fff; overflow:hidden; }
    .panel-head { background:#f8fafc; padding:12px 16px; border-bottom:1px solid #e2e8f0; }
    .panel-head h3 { font-size:15px; color:#0f172a; }
    .panel-body { padding:24px; }
    
    .form-grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:20px; }
    .input-group { display:flex; flex-direction:column; gap:8px; }
    .input-group.full { grid-column:span 2; }
    .input-group label { font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; }
    .input-group input, .input-group select, .input-group textarea { 
      padding:12px 16px; border:1px solid #e2e8f0; border-radius:10px; font-family:inherit; font-size:14px; color:#1e293b; background:#f8fafc; transition:all 0.2s;
    }
    .input-group input:focus, .input-group select:focus, .input-group textarea:focus { 
      border-color:#6366f1; background:#fff; box-shadow:0 0 0 4px rgba(99,102,241,0.1); outline:none;
    }

    /* Profile & ID Card */
    .profile-grid { display:grid; grid-template-columns:380px 1fr; gap:40px; align-items:flex-start; }
    @media (max-width:1024px) { .profile-grid { grid-template-columns:1fr; } }
    
    .medical-id-card { 
      background:linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      border-radius:24px; padding:28px; color:#fff; position:relative; overflow:hidden;
      box-shadow:0 20px 40px rgba(30,27,75,0.25); border:1px solid rgba(255,255,255,0.1);
      transition:transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .medical-id-card:hover { transform:translateY(-8px) rotate(1deg); }
    
    .id-body { display:flex; gap:24px; align-items:center; margin-bottom:30px; position:relative; z-index:1; }
    .pt-photo { width:80px; height:80px; background:#fff; color:#1e1b4b; border-radius:20px; display:flex; align-items:center; justify-content:center; font-size:36px; font-weight:800; box-shadow:0 8px 16px rgba(0,0,0,0.2); }
    .pt-details h3 { font-size:22px; margin:0 0 4px 0; font-weight:700; }
    .pt-role { font-size:13px; opacity:0.7; margin:0 0 16px 0; font-weight:500; }
    .mini-vitals-row { display:flex; gap:20px; }
    .mini-vital span { font-size:10px; text-transform:uppercase; letter-spacing:1px; opacity:0.6; font-weight:700; }
    .mini-vital strong { display:block; font-size:18px; color:#818cf8; margin-top:2px; font-weight:700; }
    
    .id-footer { display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.1); padding-top:20px; position:relative; z-index:1; }
    .emergency { font-size:11px; font-weight:600; color:rgba(255,255,255,0.8); }
    .qr-mock { width:48px; height:48px; background:#fff; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#1e1b4b; box-shadow:0 4px 8px rgba(0,0,0,0.1); }
    
    .hint { color:#94a3b8; font-size:13px; text-align:center; margin-top:20px; font-weight:500; }

    /* Stepper Enhancement */
    .stepper { display:flex; align-items:center; justify-content:space-between; margin:40px 0; max-width:600px; margin-left:auto; margin-right:auto; }
    .step { display:flex; flex-direction:column; align-items:center; gap:12px; flex:1; position:relative; cursor:default; transition:all 0.3s; }
    .step.completed { cursor:pointer; }
    .step.completed:hover .step-icon { transform:scale(1.1); background:#4f46e5; }
    .step-icon { width:40px; height:40px; border-radius:50%; background:#f1f5f9; color:#94a3b8; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:16px; border:2px solid #e2e8f0; transition:all 0.3s; z-index:2; }
    .step.active .step-icon { background:#6366f1; color:#fff; border-color:#6366f1; box-shadow:0 0 0 4px rgba(99,102,241,0.2); }
    .step.completed .step-icon { background:#10b981; color:#fff; border-color:#10b981; }
    .step span { font-size:14px; font-weight:700; color:#94a3b8; }
    .step.active span { color:#6366f1; }
    .step.completed span { color:#10b981; }
    .step-line { flex:1; height:2px; background:#e2e8f0; margin-bottom:30px; position:relative; overflow:hidden; }
    .step.completed + .step-line { background:#10b981; }

    /* STREAK BANNER */
    .streak-banner { 
      display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; margin-bottom:24px;
      background:#fff; padding:20px; border-radius:16px; border:1px solid #e2e8f0;
      box-shadow:0 4px 12px rgba(0,0,0,0.02);
    }
    .streak-item { display:flex; align-items:center; gap:12px; padding:0 12px; }
    .streak-item:not(:last-child) { border-right:1px solid #f1f5f9; }
    .streak-icon { font-size:24px; background:#f8fafc; width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; }
    .streak-val { font-size:18px; font-weight:800; color:#0f172a; line-height:1.2; }
    .streak-lbl { font-size:11px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.5px; }
    .recommendation { background:linear-gradient(135deg,#f0f9ff,#e0f2fe); border-radius:12px; margin-left:8px; }
    
    .action-btn-sm { display:flex; align-items:center; gap:6px; background:#f8fafc; border:1px solid #e2e8f0; padding:6px 10px; border-radius:8px; font-size:11px; font-weight:700; color:#475569; cursor:pointer; }
    .action-btn-sm:hover { background:#f1f5f9; border-color:#cbd5e1; color:#0f172a; }
    .action-btn-sm.qr { border-color:#6366f1; color:#6366f1; background:#f5f3ff; }
    .action-btn-sm.qr:hover { background: #e0e7ff; }

    /* QR MODAL */
    .qr-modal { max-width:400px; text-align:center; }
    .qr-body { padding:30px; }
    .qr-token { font-size:28px; font-weight:900; color:#6366f1; font-family:monospace; letter-spacing:2px; margin-bottom:8px; }
    .qr-hint { font-size:13px; color:#64748b; margin-bottom:24px; }

    .qr-container { background:#f8fafc; padding:20px; border-radius:16px; border:2px dashed #e2e8f0; display:inline-block; margin-bottom:24px; }
    .qr-container img { display:block; }
    .qr-info { background:#f1f5f9; border-radius:12px; padding:16px; margin-bottom:24px; display:flex; flex-direction:column; gap:10px; }
    .qr-row { display:flex; justify-content:space-between; font-size:13px; }
    .qr-row span { color:#64748b; font-weight:500; }
    .qr-row strong { color:#0f172a; font-weight:700; }

    /* Print Styles */
    .printable-receipt { display:none; }
    @media print {
      body * { visibility: hidden; }
      #receiptPrint, #receiptPrint * { visibility: visible; }
      #receiptPrint { 
        display: block !important; 
        position: fixed; left: 0; top: 0; width: 100%; padding: 40px; background: white; 
        font-family: 'Inter', sans-serif; color: #000;
      }
      .p-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
      .p-brand { font-size: 28px; font-weight: 800; color: #000; }
      .p-brand span { color: #3b82f6; }
      .p-title { font-size: 18px; font-weight: 700; color: #64748b; }
      .p-meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
      .p-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 40px; background: #f8fafc; padding: 20px; border-radius: 12px; }
      .p-row label { font-size: 10px; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 4px; }
      .p-row span { font-size: 14px; font-weight: 600; }
      .p-paid { color: #166534; font-weight: 700; }
      .p-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
      .p-table th { text-align: left; border-bottom: 1px solid #cbd5e1; padding: 12px; font-size: 11px; color: #64748b; text-transform: uppercase; }
      .p-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
      .p-num { text-align: right; font-family: monospace; }
      .p-table tfoot td { font-weight: 800; font-size: 18px; padding-top: 20px; border: none; }
      .p-footer { text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 30px; color: #94a3b8; font-size: 11px; }
    }
  `]
})
export class PatientDashboardComponent implements OnInit, AfterViewChecked {
  private readonly config = inject(ConfigService);
  private readonly BASE_URL = this.config.baseApiUrl;
  activeTab = signal<'upcoming' | 'past' | 'book' | 'bills' | 'profile'>('upcoming');
  loading = signal(true);
  selectedBillForPrint = signal<any>(null);
  selectedChatDoctor = signal<any>(null);

  upcoming = signal<any[]>([]);
  past = signal<any[]>([]);
  bills = signal<any[]>([]);
  patientProfile = signal<any>({});
  bookIsVideo = false;
  activeVideoRoom = signal<any>(null);

  // Patient Visit Streak Logic
  streakData = computed(() => {
    const history = this.past();
    if (!history.length) return { count: 0, daysAgo: 'No past visits', recommendation: 'Schedule a checkup' };

    const currentYear = new Date().getFullYear();
    const count = history.filter(a => new Date(a.appointmentDate).getFullYear() === currentYear).length;

    const lastDate = new Date(Math.max(...history.map(a => new Date(a.appointmentDate).getTime())));
    const diffDays = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

    let recommendation = 'Regular checkup recommended';
    if (diffDays > 180) recommendation = 'Overdue for follow-up';
    else if (diffDays < 30) recommendation = 'Ongoing treatment';

    return { count, daysAgo: diffDays, recommendation };
  });

  profileEdit = { bloodGroup: '', allergies: '', chronicConditions: '', emergencyContactName: '', emergencyContactPhone: '' };

  // Booking Flow
  bookStep = signal(1);
  departments = signal<any[]>([]);
  deptDoctors = signal<any[]>([]);
  slots = signal<any[]>([]);

  bookDeptId: number = 0;
  bookDocId: number = 0;
  bookDate: string = '';
  bookTime: string = '';
  bookSymptoms: string = '';
  submitting = signal(false);

  // Modal State
  viewingApptId = signal<number | null>(null);
  viewingDocName = signal('');
  viewingApptDate = signal('');
  consultationData = signal<any>(null);

  viewingQrData = signal<any>(null);
  private qrRendered = false;

  ngAfterViewChecked() {
    // Render QR code into canvas once modal is open and canvas exists
    if (this.viewingQrData() && !this.qrRendered) {
      const canvas = document.getElementById('qrCanvas') as HTMLCanvasElement;
      if (canvas && typeof QRCode !== 'undefined') {
        const data = this.viewingQrData();
        QRCode.toCanvas(canvas, `MediCore|${data.tokenNumber}|${data.id}|${data.patientName}|${data.date}`, {
          width: 200,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' }
        }, (err: any) => {
          if (!err) this.qrRendered = true;
        });
      }
    }
    if (!this.viewingQrData()) {
      this.qrRendered = false;
    }
  }

  sendReminder(appt: any) {
    this.http.post<any>(`${this.BASE_URL}/api/appointments/${appt.id}/send-reminder`, {}, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => this.notify.success('Check your email! Appointment reminder sent.'),
        error: () => this.notify.error('Failed to send reminder.')
      });
  }

  showQrToken(appt: any) {
    this.qrRendered = false;
    this.http.get<any>(`${this.BASE_URL}/api/appointments/${appt.id}/qr-data`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          if (res.success) this.viewingQrData.set(res.data);
          else this.notify.error('Could not load QR data.');
        },
        error: () => this.notify.error('Failed to load QR. Please try again.')
      });
  }

  joinVideoCall(apptId: number) {
    this.http.get<any>(`${this.BASE_URL}/api/appointments/${apptId}/video-status`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          if (res.success && res.data.hasVideoRoom) {
            const roomName = res.data.videoUrl.split('/').pop();
            this.activeVideoRoom.set({ roomName });
          } else {
            this.notify.warning('The doctor has not started the video call yet. Please check back at the appointment time.');
          }
        },
        error: () => this.notify.error('Failed to check video status.')
      });
  }

  printQr() {
    window.print();
  }

  constructor(
    public auth: AuthService,
    private http: HttpClient,
    private notify: NotificationService,
    private signalR: SignalRService
  ) { }

  ngOnInit() {
    this.loadMyData();
    this.loadDepartments();

    // Auto load bills when switching to bills tab
    // (Or we can just load them upfront)
    this.loadBills();
    this.loadProfile();
    this.setupVideoListener();
  }

  private setupVideoListener() {
    this.signalR.onWebRtcEvent('videoCallStarted', (data: any) => {
      console.log('SignalR: Video Call Notification', data);
      const roomName = data.videoUrl.split('/').pop();
      
      this.notify.info(`Dr. ${data.doctorName} is ready for your video consultation. Click the Join button on your appointment card.`);

      // Also auto-update the relevant appointment in the list if it matches
      this.upcoming.update(list => list.map(a => a.id === data.appointmentId ? { ...a, videoRoomUrl: data.videoUrl } : a));
    });
  }

  getHeaders() {
    return { Authorization: `Bearer ${this.auth.getAccessToken()}` };
  }

  loadBills() {
    this.http.get<any>(`${this.BASE_URL}/api/finance/my-bills`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        if (res.success) {
          this.bills.set(res.data);
        }
      },
      error: () => { } // Silently ignore if endpoint unavailable
    });
  }

  downloadReceipt(bill: any) {
    this.selectedBillForPrint.set(bill);
    setTimeout(() => {
      window.print();
      // Reset after print dialog closes
      setTimeout(() => this.selectedBillForPrint.set(null), 1000);
    }, 100);
  }

  parseItems(itemsJson: string) {
    try {
      if (!itemsJson || itemsJson === '[]') return [];
      const decoded = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
      // The API currently returns a nested JSON string for the array sometimes, so double parse if needed
      return typeof decoded === 'string' ? JSON.parse(decoded) : decoded;
    } catch {
      return [];
    }
  }

  payBill(bill: any) {
    this.notify.info('Online Payments are Launching Soon! 🚀');
    this.notify.warning('Currently, only payment at reception is available. Please pay at the hospital counter.');
  }

  payForAppointment(appt: any) {
    this.notify.info('Online Payments are Launching Soon! 🚀');
    this.notify.warning('Please visit the hospital reception to pay your consultation fee.');
  }

  cancelAppt(appt: any) {
    const apptDate = new Date(appt.appointmentDate);
    const now = new Date();

    // Calculate difference in milliseconds
    const diffMs = apptDate.getTime() - now.getTime();

    // Check if difference is less than 24 hours (24 * 60 * 60 * 1000)
    if (diffMs < 86400000) {
      this.notify.error("Appointments cannot be cancelled within 24 hours of the scheduled time. Please contact the reception.");
      return;
    }

    if (confirm(`Are you sure you want to cancel this appointment?`)) {
      this.http.patch<any>(`${this.BASE_URL}/api/appointments/${appt.id}/status`, { status: 'Cancelled' }, { headers: this.getHeaders() })
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.notify.success('Appointment cancelled successfully.');
              this.loadMyData();
            } else {
              this.notify.error(res.message);
            }
          },
          error: () => this.notify.error('Failed to cancel appointment.')
        });
    }
  }

  parseResults(json: string) {
    try {
      return JSON.parse(json || '[]');
    } catch {
      return [];
    }
  }

  loadProfile() {
    this.http.get<any>(`${this.BASE_URL}/api/patient/profiles/my`, { headers: this.getHeaders() }).subscribe(res => {
      if (res.success) {
        this.patientProfile.set(res.data);
        this.profileEdit = { ...res.data };
      }
    });
  }

  requestOfflinePayment(appt: any) {
    this.http.post<any>(`${this.BASE_URL}/api/appointments/${appt.id}/request-offline-payment`, {}, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.notify.success('Cash payment request sent. Please pay at the reception desk.');
            this.loadMyData(); // Refresh list to show badge
          }
        },
        error: () => this.notify.error('Failed to request offline payment.')
      });
  }

  updateProfile() {
    this.http.put<any>(`${this.BASE_URL}/api/patient/profiles`, this.profileEdit, { headers: this.getHeaders() }).subscribe(res => {
      if (res.success) {
        this.notify.success('Profile updated successfully');
        this.loadProfile();
      }
    });
  }

  loadMyData() {
    this.loading.set(true);
    this.http.get<any>(`${this.BASE_URL}/api/appointments/my`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        if (res.success) {
          this.upcoming.set(res.data.upcoming);
          this.past.set(res.data.past);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  viewPrescription(id: number, docName: string, date: string) {
    this.viewingApptId.set(id);
    this.viewingDocName.set(docName);
    this.viewingApptDate.set(date);
    this.consultationData.set(null); // Show loading state

    this.http.get<any>(`${this.BASE_URL}/api/consultation/${id}`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.consultationData.set(res.data);
        }
      },
      error: () => {
        this.notify.error('Failed to load consultation report.');
        this.closePrescription();
      }
    });
  }

  closePrescription() {
    this.viewingApptId.set(null);
    this.consultationData.set(null);
  }

  printReport() {
    const data = this.consultationData();
    if (!data) return;

    const docName = this.viewingDocName();
    const date = new Date(this.viewingApptDate()).toLocaleDateString('en-GB');
    const ptName = this.auth.currentUser()?.fullName;

    let content = `
      <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; border: 1px solid #ccc;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #1d4ed8; margin: 0;">MediCore Hospital</h1>
          <p style="margin: 5px 0 0 0; color: #666;">Medical Consultation Report</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <h3 style="margin: 0;">Patient: ${ptName}</h3>
            <p style="margin: 5px 0; color: #666;">Appt ID: #${this.viewingApptId()}</p>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0;">Dr. ${docName}</h3>
            <p style="margin: 5px 0; color: #666;">Date: ${date}</p>
          </div>
        </div>
    `;

    // Add Vitals
    if (data.vitals?.length > 0) {
      const v = data.vitals[0];
      content += `
        <div style="margin-bottom: 30px;">
          <h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Vitals</h3>
          <ul style="list-style: none; padding: 0;">
            ${v.bloodPressure ? `<li><strong>BP:</strong> ${v.bloodPressure}</li>` : ''}
            ${v.heartRateBpm ? `<li><strong>Heart Rate:</strong> ${v.heartRateBpm} bpm</li>` : ''}
            ${v.temperatureFahrenheit ? `<li><strong>Temp:</strong> ${v.temperatureFahrenheit} °F</li>` : ''}
            ${v.weightKg ? `<li><strong>Weight:</strong> ${v.weightKg} kg</li>` : ''}
          </ul>
        </div>
      `;
    }

    // Add Prescription
    if (data.prescriptions?.length > 0) {
      const p = data.prescriptions[0];
      content += `
        <div style="margin-bottom: 30px;">
          <h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Prescription</h3>
          <p><strong>Diagnosis:</strong> ${p.diagnosis}</p>
          <div style="margin-top: 10px;">
            <strong>Medicines:</strong>
            <pre style="font-family: inherit; white-space: pre-wrap; margin-top: 5px;">${p.medicinesJson}</pre>
          </div>
          ${p.advice ? `<p style="margin-top: 10px;"><strong>Advice:</strong> ${p.advice}</p>` : ''}
        </div>
      `;
    }

    // Add Lab Orders
    if (data.labOrders?.length > 0) {
      content += `
        <div style="margin-bottom: 30px;">
          <h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Lab Tests Ordered</h3>
          <ul style="padding-left: 20px;">
      `;
      data.labOrders.forEach((lab: any) => {
        content += `<li><strong>${lab.testType}</strong> - ${lab.notes} (${lab.status})</li>`;
      });
      content += `</ul></div>`;
    }

    content += `
        <div style="margin-top: 50px; text-align: center; color: #64748b; font-size: 12px;">
          <p>This is a computer generated report and does not require a physical signature.</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '', 'width=900,height=700');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Medical Report PDF</title></head><body>');
      printWindow.document.write(content);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      // Delay slightly so layout can render
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }

  minDate() {
    return new Date().toISOString().split('T')[0];
  }

  loadDepartments() {
    this.http.get<any>(`${this.BASE_URL}/api/departments`).subscribe(res => {
      if (res.success) this.departments.set(res.data);
    });
  }

  selectDepartment(id: number) {
    this.bookDeptId = id;
    this.http.get<any>(`${this.BASE_URL}/api/doctors?departmentId=${id}`).subscribe(res => {
      if (res.success) {
        this.deptDoctors.set(res.data);
        this.bookStep.set(2);
      }
    });
  }

  selectDoctor(id: number) {
    this.bookDocId = id;
    this.bookDate = '';
    this.bookTime = '';
    this.slots.set([]);
    this.bookStep.set(3);
  }

  loadSlots() {
    if (!this.bookDate || !this.bookDocId) return;
    this.http.get<any>(`${this.BASE_URL}/api/appointments/slots?doctorProfileId=${this.bookDocId}&date=${this.bookDate}`).subscribe(res => {
      if (res.success) this.slots.set(res.data);
    });
  }

  confirmBooking() {
    const currentUserId = this.auth.currentUser()?.id;

    if (!currentUserId) {
      this.notify.error('Authentication error. Please log out and log back in.');
      return;
    }

    const payload = {
      patientUserId: currentUserId,
      doctorProfileId: this.bookDocId,
      departmentId: this.bookDeptId,
      appointmentDate: this.bookDate,
      timeSlot: this.bookTime,
      visitType: 'Consultation',
      symptoms: this.bookSymptoms,
      isVideoConsultation: this.bookIsVideo // Feature 4 tracking
    };

    console.log('Sending Appointment Payload:', payload);

    this.submitting.set(true);
    this.http.post<any>(`${this.BASE_URL}/api/appointments`, payload, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success) {
          this.notify.success(`Appointment Booked successfully! Token: ${res.data.tokenNumber}`);
          this.loadMyData();
          this.activeTab.set('upcoming');
          // Reset booking flow
          this.bookStep.set(1);
          this.bookDeptId = 0;
          this.bookDocId = 0;
          this.bookDate = '';
          this.bookTime = '';
          this.bookSymptoms = '';
          this.bookIsVideo = false;
        }
      },
      error: () => this.submitting.set(false)
    });
  }

  openFeedback(appt: any) {
    this.notify.info('Feedback system is currently under maintenance.');
  }
}
