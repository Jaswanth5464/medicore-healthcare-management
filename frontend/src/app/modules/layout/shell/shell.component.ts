import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">

      <!-- Desktop Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-logo">
          <div class="logo-icon">
            <svg viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="10" fill="white" fill-opacity="0.15"/>
              <path d="M24 10v28M10 24h28" stroke="white" stroke-width="4" stroke-linecap="round"/>
              <circle cx="24" cy="24" r="8" stroke="white" stroke-width="2.5" fill="none"/>
            </svg>
          </div>
          <span class="logo-text" *ngIf="!sidebarCollapsed()">
            <span class="medi">Medi</span><span class="core">Core</span>
          </span>
          <button class="collapse-btn" (click)="sidebarCollapsed.set(!sidebarCollapsed())">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path *ngIf="!sidebarCollapsed()" d="M15 18l-6-6 6-6"/>
              <path *ngIf="sidebarCollapsed()" d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        <div class="sidebar-user" *ngIf="!sidebarCollapsed()">
          <div class="user-avatar">{{ userInitials() }}</div>
          <div class="user-info">
            <div class="user-name">{{ authService.userFullName() }}</div>
            <div class="user-role">{{ authService.userRole() }}</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a *ngFor="let item of navItems()"
            [routerLink]="item.route"
            routerLinkActive="active"
            class="nav-item"
            [title]="item.label">
            <span class="nav-icon" [innerHTML]="safe(item.icon)"></span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">{{ item.label }}</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <button class="logout-btn" (click)="logout()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span *ngIf="!sidebarCollapsed()">Sign Out</span>
          </button>
        </div>
      </aside>

      <!-- Main Area -->
      <div class="main-content">

        <!-- Top Header -->
        <header class="top-header">
          <div class="header-left">
            <button class="mobile-menu-btn" (click)="mobileMenuOpen.set(!mobileMenuOpen())">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div class="breadcrumb">
              <span class="breadcrumb-root">MediCore</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              <span class="breadcrumb-current">Dashboard</span>
            </div>
          </div>

          <div class="header-right">
            <button class="header-icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span class="notification-badge">3</span>
            </button>
            <div class="user-menu">
              <div class="user-avatar-sm">{{ userInitials() }}</div>
              <div class="user-meta">
                <div class="user-meta-name">{{ authService.userFullName() }}</div>
                <div class="user-meta-role">{{ authService.userRole() }}</div>
              </div>
            </div>
          </div>
        </header>

        <!-- Mobile Overlay -->
        <div class="mobile-overlay"
          *ngIf="mobileMenuOpen()"
          (click)="mobileMenuOpen.set(false)">
        </div>

        <!-- Mobile Sidebar -->
        <aside class="mobile-sidebar" [class.open]="mobileMenuOpen()">
          <div class="mobile-sidebar-header">
            <span class="logo-text">
              <span class="medi">Medi</span><span class="core">Core</span>
            </span>
            <button (click)="mobileMenuOpen.set(false)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <nav class="mobile-nav">
            <a *ngFor="let item of navItems()"
              [routerLink]="item.route"
              routerLinkActive="active"
              class="nav-item"
              (click)="mobileMenuOpen.set(false)">
              <span class="nav-icon" [innerHTML]="safe(item.icon)"></span>
              <span>{{ item.label }}</span>
            </a>
          </nav>
          <button class="logout-btn" style="margin-top:16px" (click)="logout()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </aside>

        <!-- Page Content -->
        <main class="page-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .shell {
      display: flex;
      height: 100vh;
      font-family: 'DM Sans', sans-serif;
      background: #f0f4f8;
      overflow: hidden;
    }

    .sidebar {
      width: 240px;
      background: linear-gradient(180deg, #0a2744 0%, #0d3461 100%);
      display: flex;
      flex-direction: column;
      transition: width 0.25s ease;
      flex-shrink: 0;
    }

    .sidebar.collapsed { width: 68px; }
    @media (max-width: 768px) { .sidebar { display: none; } }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    .logo-icon svg { width: 36px; height: 36px; flex-shrink: 0; }
    .logo-text { font-size: 20px; font-weight: 700; flex: 1; }
    .medi { color: white; }
    .core { color: #7dd3fc; }

    .collapse-btn {
      background: none; border: none; cursor: pointer;
      color: rgba(255,255,255,0.5); padding: 4px;
      border-radius: 6px; display: flex; align-items: center;
      transition: color 0.2s; margin-left: auto;
    }
    .collapse-btn:hover { color: white; }
    .collapse-btn svg { width: 16px; height: 16px; }

    .sidebar-user {
      display: flex; align-items: center; gap: 10px;
      padding: 16px; margin: 8px;
      background: rgba(255,255,255,0.06); border-radius: 10px;
    }

    .user-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: white; flex-shrink: 0;
    }

    .user-name { font-size: 13px; font-weight: 600; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 11px; color: #7dd3fc; margin-top: 2px; }

    .sidebar-nav { flex: 1; overflow-y: auto; padding: 8px; }

    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 8px;
      color: rgba(255,255,255,0.65); text-decoration: none;
      font-size: 13.5px; font-weight: 500; transition: all 0.15s;
      cursor: pointer; white-space: nowrap; margin-bottom: 2px;
    }

    .nav-item:hover { background: rgba(255,255,255,0.08); color: white; }
    .nav-item.active { background: rgba(125,211,252,0.15); color: #7dd3fc; }

    .nav-icon { display: flex; align-items: center; flex-shrink: 0; }
    .nav-icon :deep(svg) { width: 18px; height: 18px; }

    .sidebar-footer { padding: 12px; border-top: 1px solid rgba(255,255,255,0.08); }

    .logout-btn {
      display: flex; align-items: center; gap: 10px;
      width: 100%; padding: 10px 12px;
      background: none; border: none; border-radius: 8px;
      color: rgba(255,255,255,0.5); font-size: 13.5px;
      font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s;
    }

    .logout-btn:hover { background: rgba(239,68,68,0.15); color: #fca5a5; }
    .logout-btn svg { width: 18px; height: 18px; flex-shrink: 0; }

    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

    .top-header {
      height: 60px; background: white;
      border-bottom: 1px solid #e2e8f0;
      display: flex; align-items: center;
      justify-content: space-between;
      padding: 0 24px; flex-shrink: 0;
    }

    .header-left { display: flex; align-items: center; gap: 16px; }

    .mobile-menu-btn {
      display: none; background: none; border: none;
      cursor: pointer; color: #64748b; padding: 6px;
    }
    .mobile-menu-btn svg { width: 22px; height: 22px; }
    @media (max-width: 768px) { .mobile-menu-btn { display: flex; } }

    .breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 13px; }
    .breadcrumb svg { width: 14px; height: 14px; color: #cbd5e1; }
    .breadcrumb-root { color: #94a3b8; }
    .breadcrumb-current { color: #0f172a; font-weight: 600; }

    .header-right { display: flex; align-items: center; gap: 12px; }

    .header-icon-btn {
      position: relative; background: none; border: none;
      cursor: pointer; color: #64748b; padding: 8px;
      border-radius: 8px; transition: background 0.2s;
    }
    .header-icon-btn:hover { background: #f1f5f9; color: #0f172a; }
    .header-icon-btn svg { width: 20px; height: 20px; }

    .notification-badge {
      position: absolute; top: 4px; right: 4px;
      width: 16px; height: 16px; background: #ef4444;
      border-radius: 50%; font-size: 9px; color: white;
      font-weight: 700; display: flex; align-items: center; justify-content: center;
    }

    .user-menu {
      display: flex; align-items: center; gap: 10px;
      padding: 6px 12px; border-radius: 10px;
      cursor: pointer; transition: background 0.2s;
    }
    .user-menu:hover { background: #f1f5f9; }

    .user-avatar-sm {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; color: white;
    }

    .user-meta-name { font-size: 13px; font-weight: 600; color: #0f172a; }
    .user-meta-role { font-size: 11px; color: #64748b; }
    @media (max-width: 480px) { .user-meta { display: none; } }

    .mobile-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5); z-index: 40;
    }

    .mobile-sidebar {
      position: fixed; top: 0; left: -280px;
      width: 260px; height: 100vh;
      background: linear-gradient(180deg, #0a2744 0%, #0d3461 100%);
      z-index: 50; transition: left 0.25s ease;
      display: flex; flex-direction: column; padding: 16px;
    }

    .mobile-sidebar.open { left: 0; }

    .mobile-sidebar-header {
      display: flex; align-items: center;
      justify-content: space-between; margin-bottom: 24px;
    }

    .mobile-sidebar-header button {
      background: none; border: none;
      color: rgba(255,255,255,0.6); cursor: pointer;
    }
    .mobile-sidebar-header button svg { width: 20px; height: 20px; }

    .mobile-nav { flex: 1; display: flex; flex-direction: column; gap: 2px; }

    .page-content { flex: 1; overflow-y: auto; padding: 24px; }
    @media (max-width: 480px) { .page-content { padding: 16px; } }
  `]
})
export class ShellComponent {
  sidebarCollapsed = signal(false);
  mobileMenuOpen = signal(false);

  constructor(public authService: AuthService, private sanitizer: DomSanitizer) {}

  safe(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  userInitials = computed(() => {
    const name = this.authService.userFullName();
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  });

  navItems = computed(() => {
    const role = this.authService.userRole();

    const allItems = [
      {
        label: 'Dashboard', roles: ['SuperAdmin', 'HospitalAdmin', 'Receptionist'],
        route: '/dashboard/admin',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
      },
      {
        label: 'Dashboard', roles: ['Doctor', 'Mentor'],
        route: '/dashboard/doctor',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
      },
      {
        label: 'Dashboard', roles: ['Nurse'],
        route: '/dashboard/nurse',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`
      },
      {
        label: 'My Portal', roles: ['Patient'],
        route: '/dashboard/patient',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
      },
      {
        label: 'Pharmacy', roles: ['Pharmacist'],
        route: '/dashboard/pharmacist',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`
      },
      {
        label: 'Laboratory', roles: ['LabTechnician'],
        route: '/dashboard/lab',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11l-4 7h14l-4-7V3"/></svg>`
      },
      {
        label: 'Finance', roles: ['FinanceStaff'],
        route: '/dashboard/finance',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
      },
    ];

    return allItems.filter(item => item.roles.includes(role));
  });

  logout(): void {
    this.authService.logout();
  }
}