import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfigService } from '../../../core/services/config.service';
import { HospitalChatComponent } from '../../communication/chat/hospital-chat.component';

// const BASE_URL = 'https://localhost:7113';

@Component({
  selector: 'app-pharmacist-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HospitalChatComponent],
  templateUrl: './pharmacist-dashboard.component.html',
  styleUrls: ['./pharmacist-dashboard.component.css']
})
export class PharmacistDashboardComponent implements OnInit {
  private readonly config = inject(ConfigService);
  private readonly BASE_URL = this.config.baseApiUrl;
  private http = inject(HttpClient);
  private ns = inject(NotificationService);

  activeTab = signal<'queue' | 'inventory' | 'chat'>('queue');
  
  // Data
  queueStr = signal<any[]>([]);
  inventoryData = signal<any[]>([]);

  // UI State
  isLoading = signal<boolean>(false);
  isDispensing = signal<boolean>(false);
  selectedPrescription = signal<any>(null);

  // New Medicine Form
  showAddMedicine = signal<boolean>(false);
  newMedicine = {
    medicineName: '',
    genericName: '',
    category: '',
    manufacturer: '',
    price: 0,
    stockQuantity: 0,
    lowStockThreshold: 10,
    expiryDate: ''
  };

  ngOnInit() {
    this.loadQueue();
    this.loadInventory();
  }

  loadQueue() {
    this.isLoading.set(true);
    this.http.get<{success: boolean, data: any[]}>(`${this.BASE_URL}/api/pharmacy/queue`)
      .subscribe({
        next: (res) => {
          this.queueStr.set(res.data);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.ns.error('Failed to load pharmacy queue');
          this.isLoading.set(false);
        }
      });
  }

  loadInventory() {
    this.http.get<{success: boolean, data: any[]}>(`${this.BASE_URL}/api/pharmacy/inventory`)
      .subscribe({
        next: (res) => {
          this.inventoryData.set(res.data);
        },
        error: (err) => {
          this.ns.error('Failed to load inventory');
        }
      });
  }

  viewPrescription(rx: any) {
    this.selectedPrescription.set(rx);
  }

  closePrescription() {
    this.selectedPrescription.set(null);
  }

  parseMedicines(medicinesJson: string): any[] {
    if (!medicinesJson) return [];
    try {
      return JSON.parse(medicinesJson);
    } catch {
      return [];
    }
  }

  dispenseMedicines(rxId: number) {
    if (!confirm('Are you sure you want to dispense these medicines? Stock will be deducted.')) return;
    
    this.isDispensing.set(true);
    this.http.post<{success: boolean, message: string}>(`${this.BASE_URL}/api/pharmacy/dispense/${rxId}`, {})
      .subscribe({
        next: (res) => {
          this.ns.success(res.message);
          this.isDispensing.set(false);
          this.closePrescription();
          this.loadQueue(); // Refresh queue
          this.loadInventory(); // Refresh stock
        },
        error: (err) => {
          this.ns.error(err.error?.message || 'Failed to dispense medicines');
          this.isDispensing.set(false);
        }
      });
  }

  toggleAddMedicine() {
    this.showAddMedicine.update(v => !v);
  }

  addMedicine() {
    if (!this.newMedicine.medicineName || !this.newMedicine.category || this.newMedicine.price <= 0) {
      this.ns.error('Please fill all required fields');
      return;
    }

    this.http.post<{success: boolean, data: any}>(`${this.BASE_URL}/api/pharmacy/inventory`, this.newMedicine)
      .subscribe({
        next: (res) => {
          this.ns.success('Medicine added successfully');
          this.toggleAddMedicine();
          this.loadInventory();
          // Reset form
          this.newMedicine = {
            medicineName: '',
            genericName: '',
            category: '',
            manufacturer: '',
            price: 0,
            stockQuantity: 0,
            lowStockThreshold: 10,
            expiryDate: ''
          };
        },
        error: (err) => {
          this.ns.error('Failed to add medicine');
        }
      });
  }

  isLowStock(med: any): boolean {
    return med.stockQuantity <= med.lowStockThreshold;
  }
}