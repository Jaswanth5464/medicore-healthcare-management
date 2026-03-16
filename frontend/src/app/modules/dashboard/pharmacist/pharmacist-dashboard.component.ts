import { Component, OnInit, signal, inject } from '@angular/core';
declare var QRCode: { toDataURL: (text: string, opts?: { width?: number; margin?: number }) => Promise<string> };
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

  activeTab = signal<'queue' | 'inventory' | 'counter' | 'chat'>('queue');
  selectedCategory = signal<string>('All');
  inventoryCategories = signal<string[]>(['All']);
  
  // Data
  queueStr = signal<any[]>([]);
  inventoryData = signal<any[]>([]);

  // UI State
  isLoading = signal<boolean>(false);
  isDispensing = signal<boolean>(false);
  selectedPrescription = signal<any>(null);

  // New Medicine / Edit Form
  showAddMedicine = signal<boolean>(false);
  isEditingMedicine = signal<boolean>(false);
  editingMedicineId = signal<number | null>(null);
  
  newMedicine = {
    name: '',
    genericName: '',
    category: 'Tablet',
    manufacturer: '',
    price: 0,
    stockQuantity: 0,
    lowStockThreshold: 10,
    expiryDate: ''
  };

  // Walk-in Counter State
  walkInBasket = signal<any[]>([]);
  walkInCustomer = signal({ name: '', phone: '', email: '', paymentMode: 'Cash', sendBillToEmail: false, patientUserId: null as number | null });
  counterSearch = signal('');
  patientSearch = signal('');
  patientResults = signal<any[]>([]);
  lastBill = signal<{ billNumber: string; subTotal?: number; gstAmount?: number; total: number; items: any[]; customerName: string; customerEmail?: string; paymentMode: string } | null>(null);
  showBillModal = signal(false);
  qrDataUrl = signal<string>('');

  searchPatients() {
    const q = this.patientSearch().trim();
    if (q.length < 3) {
      this.patientResults.set([]);
      return;
    }
    this.http.get<any>(`${this.BASE_URL}/api/receptionist/patients/search?query=${encodeURIComponent(q)}`)
      .subscribe(res => {
        if (Array.isArray(res)) {
          this.patientResults.set(res);
        } else if (res && res.data) {
          this.patientResults.set(res.data);
        }
      });
  }

  selectPatient(p: any) {
    this.walkInCustomer.update(c => ({
      ...c,
      name: p.fullName,
      phone: p.phoneNumber || p.phone || '',
      email: p.email || '',
      patientUserId: p.userId || p.id
    }));
    this.patientResults.set([]);
    this.patientSearch.set('');
  }

  filteredInventory = signal<any[]>([]);

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
          // Extract unique categories
          const cats = ['All', ...new Set(res.data.map(m => m.category).filter(c => !!c))];
          this.inventoryCategories.set(cats);
          this.updateFilteredInventory();
        },
        error: (err) => {
          this.ns.error('Failed to load inventory');
        }
      });
  }

  updateFilteredInventory() {
    const q = this.counterSearch().toLowerCase();
    const cat = this.selectedCategory();
    
    this.filteredInventory.set(
      this.inventoryData().filter(m => {
        const matchesSearch = (m.name?.toLowerCase().includes(q) || m.genericName?.toLowerCase().includes(q));
        const matchesCat = (cat === 'All' || m.category === cat);
        return matchesSearch && matchesCat;
      })
    );
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
      const meds = JSON.parse(medicinesJson);
      // Map with prices from inventory for real-time display
      return meds.map((m: any) => {
        const invMed = this.inventoryData().find(i => i.name === m.name);
        return {
          ...m,
          price: invMed?.price || 0,
          stock: invMed?.stockQuantity || 0
        };
      });
    } catch {
      return [];
    }
  }

  calculateTotal(medicinesJson: string): number {
    const meds = this.parseMedicines(medicinesJson);
    return meds.reduce((acc, m) => acc + (m.price * (m.count || 1)), 0);
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
    if (!this.newMedicine.name || !this.newMedicine.category || this.newMedicine.price <= 0) {
      this.ns.error('Please fill all required fields');
      return;
    }

    if (this.isEditingMedicine()) {
      this.http.put<{success: boolean}>(`${this.BASE_URL}/api/pharmacy/inventory/${this.editingMedicineId()}`, this.newMedicine)
        .subscribe({
          next: () => {
            this.ns.success('Medicine updated successfully');
            this.finishMedicineForm();
          },
          error: () => this.ns.error('Failed to update medicine')
        });
    } else {
      this.http.post<{success: boolean, data: any}>(`${this.BASE_URL}/api/pharmacy/inventory`, this.newMedicine)
        .subscribe({
          next: (res) => {
            this.ns.success('Medicine added successfully');
            this.finishMedicineForm();
          },
          error: (err) => {
            this.ns.error('Failed to add medicine');
          }
        });
    }
  }

  editMedicine(med: any) {
    this.isEditingMedicine.set(true);
    this.editingMedicineId.set(med.id);
    this.newMedicine = { ...med };
    this.showAddMedicine.set(true);
  }

  deleteMedicine(id: number) {
    if (!confirm('Are you sure you want to delete this medicine? This action cannot be undone.')) return;
    this.http.delete(`${this.BASE_URL}/api/pharmacy/inventory/${id}`).subscribe({
      next: () => {
        this.ns.success('Medicine deleted');
        this.loadInventory();
      },
      error: () => this.ns.error('Failed to delete medicine')
    });
  }

  finishMedicineForm() {
    this.showAddMedicine.set(false);
    this.isEditingMedicine.set(false);
    this.editingMedicineId.set(null);
    this.loadInventory();
    // Reset form
    this.newMedicine = {
      name: '',
      genericName: '',
      category: '',
      manufacturer: '',
      price: 0,
      stockQuantity: 0,
      lowStockThreshold: 10,
      expiryDate: ''
    };
  }

  // WALK-IN COUNTER LOGIC
  addToBasket(med: any) {
    if (this.walkInBasket().find(i => i.id === med.id)) {
      this.ns.warning('Medicine already in basket. Update quantity there.');
      return;
    }
    if (med.stockQuantity <= 0) {
      this.ns.error('Out of stock');
      return;
    }
    this.walkInBasket.update(b => [...b, { ...med, quantity: 1 }]);
  }

  removeFromBasket(index: number) {
    this.walkInBasket.update(b => {
      const newB = [...b];
      newB.splice(index, 1);
      return newB;
    });
  }

  updateItemQuantity(index: number, change: number) {
    this.walkInBasket.update(b => {
      const newB = [...b];
      const item = newB[index];
      const newQty = item.quantity + change;
      if (newQty > 0 && newQty <= item.stockQuantity) {
        newB[index] = { ...item, quantity: newQty };
      } else if (newQty > item.stockQuantity) {
        this.ns.error(`Only ${item.stockQuantity} items in stock`);
      }
      return newB;
    });
  }

  get subTotal() {
    return this.walkInBasket().reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  get gstAmount() {
    return Math.round(this.subTotal * 0.18 * 100) / 100;
  }

  get basketTotal() {
    return this.subTotal + this.gstAmount;
  }

  get todayDate() {
    return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  completeWalkInSale() {
    if (this.walkInBasket().length === 0) {
      this.ns.error('Basket is empty');
      return;
    }

    const cust = this.walkInCustomer();
    const payload = {
      customerName: cust.name || 'Walk-in Customer',
      customerPhone: cust.phone,
      customerEmail: cust.sendBillToEmail ? cust.email : undefined,
      sendBillToEmail: cust.sendBillToEmail && !!cust.email,
      paymentMode: cust.paymentMode,
      patientUserId: cust.patientUserId,
      items: this.walkInBasket().map(i => ({ medicineId: i.id, count: i.quantity }))
    };

    this.isLoading.set(true);
    this.http.post<any>(`${this.BASE_URL}/api/pharmacy/walk-in`, payload).subscribe({
      next: (res) => {
        this.ns.success(`Sale completed! Bill: ${res.billNumber}`);
        this.lastBill.set({
          billNumber: res.billNumber,
          subTotal: res.subTotal,
          gstAmount: res.gstAmount,
          total: res.total,
          items: res.items || [],
          customerName: res.customerName || cust.name,
          customerEmail: res.customerEmail,
          paymentMode: res.paymentMode || 'Cash'
        });
        this.generateBillQr(res.billNumber, res.total);
        this.walkInBasket.set([]);
        this.walkInCustomer.update(c => ({ ...c, name: '', phone: '', email: '', sendBillToEmail: false, patientUserId: null }));
        this.patientSearch.set('');
        this.loadInventory();
        this.isLoading.set(false);
        this.showBillModal.set(true);
      },
      error: (err) => {
        this.ns.error(err.error?.message || 'Failed to complete sale');
        this.isLoading.set(false);
      }
    });
  }

  printReceipt() {
    window.print();
  }

  generateBillQr(billNumber: string, total: number) {
    const upiId = 'medicorepharmacy@upi';
    const payStr = `upi://pay?pa=${upiId}&pn=MediCore Pharmacy&am=${total}&tn=Bill ${billNumber}&cu=INR`;
    if (typeof QRCode !== 'undefined') {
      QRCode.toDataURL(payStr, { width: 200, margin: 2 })
        .then((url: string) => this.qrDataUrl.set(url))
        .catch(() => this.qrDataUrl.set(''));
    } else {
      this.qrDataUrl.set('');
    }
  }

  closeBillModal() {
    this.showBillModal.set(false);
    this.lastBill.set(null);
    this.qrDataUrl.set('');
  }

  isLowStock(med: any): boolean {
    return med.stockQuantity <= med.lowStockThreshold;
  }
}
