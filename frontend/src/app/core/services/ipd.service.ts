import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class IpdService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  private apiUrl = this.config.apiUrl + '/ipd';

  // Rooms & Layout
  getRoomTypes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/rooms/room-types`);
  }

  getHospitalLayout(): Observable<any> {
    return this.http.get(`${this.apiUrl}/rooms/layout`);
  }

  getAvailableBeds(roomTypeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/rooms/available-beds/${roomTypeId}`);
  }

  // Admissions
  getActiveAdmissions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admission/active`);
  }

  admitPatient(request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admission/admit`, request);
  }

  dischargePatient(request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admission/discharge`, request);
  }

  getAdmissionDetails(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/admission/${id}`);
  }

  getDischargeSummary(admissionId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/admission/${admissionId}/summary`);
  }

  // Global Data / Diagnostics
  getAllPatients(): Observable<any> {
    // Calling the patient profile list endpoint
    return this.http.get(`${this.config.apiUrl}/patient/profiles/list`);
  }

  repairData(): Observable<any> {
    return this.http.post(`${this.apiUrl}/rooms/repair-data`, {});
  }

  // Billing
  getChargesForAdmission(admissionId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/ipdbilling/charges/${admissionId}`);
  }

  addDailyCharge(request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/ipdbilling/add-charge`, request);
  }
}
