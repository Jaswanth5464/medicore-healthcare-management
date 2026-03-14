import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfigService } from '../../../core/services/config.service';
import { HospitalChatComponent } from '../../communication/chat/hospital-chat.component';

// const BASE_URL = 'https://localhost:7113';

@Component({
  selector: 'app-lab-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HospitalChatComponent],
  templateUrl: './lab-dashboard.component.html',
  styleUrls: ['./lab-dashboard.component.css']
})
export class LabDashboardComponent implements OnInit {
  private readonly config = inject(ConfigService);
  private readonly BASE_URL = this.config.baseApiUrl;
  private http = inject(HttpClient);
  private ns = inject(NotificationService);

  activeTab = signal<'queue' | 'tests' | 'chat'>('queue');
  
  // Data
  queueStr = signal<any[]>([]);
  testMasters = signal<any[]>([]);

  // UI State
  isLoading = signal<boolean>(false);
  isUploading = signal<boolean>(false);
  selectedOrder = signal<any>(null);

  // Upload Form
  uploadData = {
    reportPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 
    resultNotes: '',
    isCritical: false,
    resultsJson: '[]'
  };

  // Structured Results
  labResults = signal<any[]>([]);

  ngOnInit() {
    this.loadQueue();
    this.loadTestMasters();
  }

  loadQueue() {
    this.isLoading.set(true);
    this.http.get<{success: boolean, data: any[]}>(`${this.BASE_URL}/api/lab/queue`)
      .subscribe({
        next: (res) => {
          this.queueStr.set(res.data);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.ns.error('Failed to load lab queue');
          this.isLoading.set(false);
        }
      });
  }

  loadTestMasters() {
    this.http.get<{success: boolean, data: any[]}>(`${this.BASE_URL}/api/lab/tests`)
      .subscribe({
        next: (res) => {
          this.testMasters.set(res.data);
        },
        error: (err) => {
          this.ns.error('Failed to load lab tests registry');
        }
      });
  }

  openUploadModal(order: any) {
    this.selectedOrder.set(order);
    this.uploadData = {
      reportPdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      resultNotes: '',
      isCritical: false,
      resultsJson: '[]'
    };
    // Initialize structured results if applicable
    this.labResults.set([
      { parameter: 'Result Value', value: '', unit: '', normalRange: '' }
    ]);
  }

  updateOrderStatus(orderId: number, status: string) {
    this.http.patch<any>(`${this.BASE_URL}/api/lab/orders/${orderId}/status`, { status }, { 
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
    }).subscribe(res => {
      if (res.success) {
        this.ns.success(`Status updated to ${status}`);
        this.loadQueue();
      }
    });
  }

  addResultRow() {
    this.labResults.update(r => [...r, { parameter: '', value: '', unit: '', normalRange: '' }]);
  }

  removeResultRow(index: number) {
    this.labResults.update(r => r.filter((_, i) => i !== index));
  }

  closeUploadModal() {
    this.selectedOrder.set(null);
  }

  submitReport() {
    if (!this.selectedOrder()) return;
    
    this.uploadData.resultsJson = JSON.stringify(this.labResults());
    this.isUploading.set(true);
    this.http.post<{success: boolean, message: string}>(`${this.BASE_URL}/api/lab/upload-report/${this.selectedOrder().id}`, this.uploadData)
      .subscribe({
        next: (res) => {
          this.ns.success(res.message);
          this.isUploading.set(false);
          this.closeUploadModal();
          this.loadQueue(); // Refresh queue to reflect Completed status
        },
        error: (err) => {
          this.ns.error(err.error?.message || 'Failed to upload report');
          this.isUploading.set(false);
        }
      });
  }

  viewReport(url: string) {
    if (url) {
      window.open(url, '_blank');
    } else {
      this.ns.error('No report available');
    }
  }
}