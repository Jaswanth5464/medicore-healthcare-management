import '@angular/compiler';
import { AppointmentCalendarComponent } from './appointment-calendar.component';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

describe('AppointmentCalendarComponent', () => {
    let component: AppointmentCalendarComponent;
    let mockHttp: any;
    let mockAuthService: any;
    let mockStateService: any;
    let mockNotifyService: any;

    beforeEach(() => {
        mockHttp = {
            get: vi.fn().mockReturnValue(of({ success: true, data: [] })),
            post: vi.fn()
        };

        mockAuthService = {
            getAccessToken: vi.fn().mockReturnValue('mock-token')
        };

        mockStateService = {
            isCalendarLoading: signal(false),
            calendarData: signal([]),
            loadCalendar: vi.fn()
        };

        mockNotifyService = {
            success: vi.fn(),
            error: vi.fn()
        };

        component = new AppointmentCalendarComponent(
            mockStateService,
            mockHttp,
            mockAuthService,
            mockNotifyService
        );
    });

    it('should barely search when input length is less than 2', () => {
        component.patientSearch = 'a';
        component.searchPatients();
        expect(component.patientResults().length).toBe(0);
        // Ensure no HTTP request was made for users
        expect(mockHttp.get).not.toHaveBeenCalledWith(expect.stringContaining('/api/users/search'));
    });

    it('should call patient search API with ngModel string and update results', () => {
        const mockResponse = {
            success: true,
            data: [
                { id: 1, fullName: 'Jaswanth Kumar', phone: '1234567890' },
                { id: 2, fullName: 'Jaswanth G', phoneNumber: '0987654321' }
            ]
        };
        mockHttp.get.mockReturnValue(of(mockResponse));

        component.patientSearch = 'jaswanth';
        component.searchPatients();

        expect(mockHttp.get).toHaveBeenCalledWith(
            expect.stringContaining('/api/users/search?q=jaswanth'),
            expect.any(Object)
        );
        expect(component.patientResults().length).toBe(2);
        expect(component.patientResults()[0].fullName).toBe('Jaswanth Kumar');
        // Ensure the fallback logic behaves properly with the result data pattern
        expect(component.patientResults()[1].phone || component.patientResults()[1].phoneNumber).toBe('0987654321');
    });

    it('should successfully select a patient from the list', () => {
        const testPatient = { id: 5, fullName: 'Test Patient', phone: '9999999999' };
        component.patientResults.set([testPatient]);

        component.selectPatient(testPatient);

        expect(component.selectedPatient()).toEqual(testPatient);
        expect(component.patientSearch).toBe('Test Patient');
        expect(component.patientResults().length).toBe(0); // List should clear after selection
    });
});
