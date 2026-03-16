import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./modules/public/landing/landing.component').then(
        (m) => m.LandingComponent
      ),
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./modules/auth/login/login.component').then(
            (m) => m.LoginComponent
          ),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./modules/auth/login/register.component').then(
            (m) => m.RegisterComponent
          ),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: 'waiting-room',
    loadComponent: () => import('./modules/dashboard/receptionist/waiting-room.component').then(m => m.WaitingRoomComponent)
  },
  {
    path: 'token-display',
    loadComponent: () => import('./modules/display/token-display.component').then(m => m.TokenDisplayComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./modules/layout/shell/shell.component').then(
        (m) => m.ShellComponent
      ),
    children: [
      {
        path: 'admin',
        canActivate: [roleGuard(['SuperAdmin', 'HospitalAdmin'])],
        loadComponent: () =>
          import('./modules/dashboard/admin/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'receptionist',
        canActivate: [roleGuard(['Receptionist', 'SuperAdmin', 'HospitalAdmin'])],
        loadComponent: () =>
          import('./modules/dashboard/receptionist/receptionist-dashboard.component').then(
            (m) => m.ReceptionistDashboardComponent
          ),
      },
      {
        path: 'doctor',
        canActivate: [roleGuard(['Doctor', 'Mentor'])],
        loadComponent: () =>
          import('./modules/dashboard/doctor/doctor-dashboard.component').then(
            (m) => m.DoctorDashboardComponent
          ),
      },
      {
        path: 'nurse',
        canActivate: [roleGuard(['Nurse'])],
        loadComponent: () =>
          import('./modules/dashboard/nurse/nurse-dashboard.component').then(
            (m) => m.NurseDashboardComponent
          ),
      },
      {
        path: 'patient',
        canActivate: [roleGuard(['Patient'])],
        loadComponent: () =>
          import('./modules/dashboard/patient/patient-dashboard.component').then(
            (m) => m.PatientDashboardComponent
          ),
      },
      {
        path: 'pharmacist',
        canActivate: [roleGuard(['Pharmacist'])],
        loadComponent: () =>
          import('./modules/dashboard/pharmacist/pharmacist-dashboard.component').then(
            (m) => m.PharmacistDashboardComponent
          ),
      },
      {
        path: 'lab',
        canActivate: [roleGuard(['LabTechnician'])],
        loadComponent: () =>
          import('./modules/dashboard/lab/lab-dashboard.component').then(
            (m) => m.LabDashboardComponent
          ),
      },
      {
        path: 'finance',
        canActivate: [roleGuard(['FinanceStaff'])],
        loadComponent: () =>
          import('./modules/dashboard/finance/finance-dashboard.component').then(
            (m) => m.FinanceDashboardComponent
          ),
      },
      {
        path: 'ipd',
        canActivate: [roleGuard(['SuperAdmin', 'HospitalAdmin', 'Receptionist'])],
        loadComponent: () =>
          import('./modules/dashboard/ipd/bed-allocation.component').then(
            (m) => m.BedAllocationComponent
          ),
      },
      { path: '', redirectTo: 'admin', pathMatch: 'full' },
    ],
  },
  {
    path: '404',
    loadComponent: () =>
      import('./modules/auth/login/not-found.component')
        .then(m => m.NotFoundComponent)
  },
  {
    path: '**',
    loadComponent: () =>
      import('./modules/auth/login/not-found.component')
        .then(m => m.NotFoundComponent)
  }
];
