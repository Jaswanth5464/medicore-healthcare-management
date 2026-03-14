import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfigService } from '../../../core/services/config.service';
import { HospitalChatComponent } from '../../communication/chat/hospital-chat.component';

interface User {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  roles: string[];
  roleIds: number[];
  isActive: boolean;
  createdAt: string;
}

interface UserListResponse {
  users: User[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HospitalChatComponent],
  template: `
    <div class="admin">

      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage hospital staff, departments and doctors</p>
        </div>
        <button class="btn-primary" (click)="onAddClick()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {{ activePage() === 'users' ? 'Add User' : activePage() === 'departments' ? 'Add Department' : 'Add Doctor Profile' }}
        </button>
      </div>

      <!-- Page Tabs -->
      <div class="page-tabs">
        <button class="page-tab" [class.active]="activePage() === 'users'" (click)="activePage.set('users')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Users
          <span class="page-tab-count">{{ allUsers().length }}</span>
        </button>
        <button class="page-tab" [class.active]="activePage() === 'departments'" (click)="activePage.set('departments')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Departments
          <span class="page-tab-count">{{ allDepartments().length }}</span>
        </button>
        <button class="page-tab" [class.active]="activePage() === 'doctors'" (click)="activePage.set('doctors')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          Doctor Profiles
          <span class="page-tab-count">{{ allDoctors().length }}</span>
        </button>
        <button class="page-tab" [class.active]="activePage() === 'reports'" (click)="activePage.set('reports')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          Reports & Analytics
        </button>
        <button class="page-tab" [class.active]="activePage() === 'leaves'" (click)="activePage.set('leaves')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Leave Requests
          <span class="page-tab-count" *ngIf="pendingLeavesCount() > 0" style="background:#ef4444;color:#fff;">{{ pendingLeavesCount() }}</span>
        </button>
        <button class="page-tab" [class.active]="activePage() === 'hospital-chat'" (click)="activePage.set('hospital-chat')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-10.8 8.5 8.5 0 0 1 7.6 11.7z"/>
          </svg>
          Staff Chat
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card" *ngFor="let stat of statsCards()">
          <div class="stat-icon" [style.background]="stat.bg">
            <span [innerHTML]="stat.icon"></span>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
          <div class="stat-badge" [style.color]="stat.badgeColor" [style.background]="stat.badgeBg">
            {{ stat.badge }}
          </div>
        </div>
      </div>

      <!-- USERS PAGE -->
      <ng-container *ngIf="activePage() === 'users'">

      <!-- Role Filter Tabs -->
      <div class="section-card">
        <div class="section-header">
          <div>
            <h2>User Management</h2>
            <p>All hospital staff and patient accounts</p>
          </div>
          <div class="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search users..."
              [value]="searchQuery()"
              (input)="searchQuery.set($any($event.target).value)"
            />
          </div>
        </div>

        <!-- Role Filter -->
        <div class="role-tabs">
          <button
            *ngFor="let tab of roleTabs"
            class="role-tab"
            [class.active]="activeTab() === tab.value"
            (click)="filterByRole(tab.value)">
            <span class="tab-dot" [style.background]="tab.color"></span>
            {{ tab.label }}
            <span class="tab-count">{{ getRoleCount(tab.value) }}</span>
          </button>
        </div>

        <!-- Loading State -->
        <div class="loading-state" *ngIf="isLoading()">
          <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5]">
            <div class="sk sk-avatar"></div>
            <div class="sk-group">
              <div class="sk sk-line-lg"></div>
              <div class="sk sk-line-sm"></div>
            </div>
            <div class="sk sk-badge"></div>
            <div class="sk sk-badge"></div>
            <div class="sk sk-btn"></div>
          </div>
        </div>

        <!-- Users Table Desktop -->
        <div class="table-wrapper" *ngIf="!isLoading()">
          <table class="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of filteredUsers()" class="user-row">
                <td>
                  <div class="user-cell">
                    <div class="user-avatar" [style.background]="getAvatarColor(getPrimaryRole(user.roles))">
                      {{ getInitials(user.fullName) }}
                    </div>
                    <div>
                      <div class="user-name">{{ user.fullName }}</div>
                      <div class="user-email">{{ user.email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                    <span *ngFor="let r of user.roles" class="role-badge" [style.background]="getRoleBadgeBg(r)" [style.color]="getRoleBadgeColor(r)">
                      {{ r }}
                    </span>
                  </div>
                </td>
                <td class="phone-cell">{{ user.phoneNumber || '—' }}</td>
                <td>
                  <div class="status-badge" [class.active]="user.isActive" [class.inactive]="!user.isActive">
                    <span class="status-dot"></span>
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </div>
                </td>
                <td class="date-cell">{{ formatDate(user.createdAt) }}</td>
                <td>
                  <div class="action-btns">
                    <button class="action-btn edit" (click)="openEditModal(user)" title="Edit">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      class="action-btn"
                      [class.deactivate]="user.isActive"
                      [class.activate]="!user.isActive"
                      (click)="toggleStatus(user)"
                      [title]="user.isActive ? 'Deactivate' : 'Activate'">
                      <svg *ngIf="user.isActive" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                      </svg>
                      <svg *ngIf="!user.isActive" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </button>
                    <button class="action-btn reset" (click)="openResetModal(user)" title="Reset Password">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredUsers().length === 0">
                <td colspan="6" class="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <p>No users found</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="mobile-cards" *ngIf="!isLoading()">
          <div class="mobile-user-card" *ngFor="let user of filteredUsers()">
            <div class="muc-header">
              <div class="user-cell">
                <div class="user-avatar" [style.background]="getAvatarColor(getPrimaryRole(user.roles))">
                  {{ getInitials(user.fullName) }}
                </div>
                <div>
                  <div class="user-name">{{ user.fullName }}</div>
                  <div class="user-email">{{ user.email }}</div>
                </div>
              </div>
              <div class="status-badge" [class.active]="user.isActive" [class.inactive]="!user.isActive">
                <span class="status-dot"></span>
                {{ user.isActive ? 'Active' : 'Inactive' }}
              </div>
            </div>
            <div class="muc-meta" style="flex-wrap: wrap; gap: 4px;">
              <span *ngFor="let r of user.roles" class="role-badge" [style.background]="getRoleBadgeBg(r)" [style.color]="getRoleBadgeColor(r)">
                {{ r }}
              </span>
              <span class="muc-phone" style="width: 100%;">{{ user.phoneNumber || 'No phone' }}</span>
            </div>
            <div class="muc-actions">
              <button class="action-btn edit" (click)="openEditModal(user)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit
              </button>
              <button class="action-btn" [class.deactivate]="user.isActive" [class.activate]="!user.isActive" (click)="toggleStatus(user)">
                {{ user.isActive ? 'Deactivate' : 'Activate' }}
              </button>
              <button class="action-btn reset" (click)="openResetModal(user)">Reset Pass</button>
            </div>
          </div>
        </div>
      </div>

      </ng-container>
      <!-- END USERS PAGE -->

<!-- DEPARTMENTS PAGE -->
<ng-container *ngIf="activePage() === 'departments'">
  <div class="section-card">
    <div class="section-header">
      <div>
        <h2>Department Management</h2>
        <p>Manage hospital departments and sections</p>
      </div>
    </div>

    <!-- Loading -->
    <div class="loading-state" *ngIf="deptLoading()">
      <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5]">
        <div class="sk sk-avatar" style="border-radius:10px"></div>
        <div class="sk-group">
          <div class="sk sk-line-lg"></div>
          <div class="sk sk-line-sm"></div>
        </div>
        <div class="sk sk-badge"></div>
        <div class="sk sk-btn"></div>
      </div>
    </div>

    <!-- Department Grid -->
    <div class="dept-grid" *ngIf="!deptLoading()">
      <div class="dept-card" *ngFor="let dept of allDepartments()"
        [class.inactive]="!dept.isActive">
        <div class="dept-icon">{{ dept.icon }}</div>
        <div class="dept-info">
          <div class="dept-name">{{ dept.name }}</div>
          <div class="dept-desc">{{ dept.description }}</div>
          <div class="dept-meta">
            <span class="dept-floor">Floor {{ dept.floorNumber }}</span>
            <span class="dept-doctors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
              {{ dept.doctorCount }} doctors
            </span>
          </div>
        </div>
        <div class="dept-actions">
          <div class="status-badge" [class.active]="dept.isActive" [class.inactive]="!dept.isActive">
            <span class="status-dot"></span>
            {{ dept.isActive ? 'Active' : 'Inactive' }}
          </div>
          <div class="action-btns" style="margin-top:8px">
            <button class="action-btn edit" (click)="openEditDept(dept)" title="Edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="action-btn"
              [class.deactivate]="dept.isActive"
              [class.activate]="!dept.isActive"
              (click)="toggleDept(dept)"
              [title]="dept.isActive ? 'Deactivate' : 'Activate'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line *ngIf="dept.isActive" x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                <polyline *ngIf="!dept.isActive" points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</ng-container>

<!-- DOCTORS PAGE -->
<ng-container *ngIf="activePage() === 'doctors'">
  <div class="section-card">
    <div class="section-header">
      <div>
        <h2>Doctor Profiles</h2>
        <p>Setup doctor specializations, schedules and fees</p>
      </div>
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Search doctors..."
          [value]="doctorSearch()"
          (input)="doctorSearch.set($any($event.target).value)"/>
      </div>
    </div>

    <!-- Loading -->
    <div class="loading-state" *ngIf="doctorLoading()">
      <div class="skeleton-row" *ngFor="let i of [1,2,3]">
        <div class="sk sk-avatar"></div>
        <div class="sk-group">
          <div class="sk sk-line-lg"></div>
          <div class="sk sk-line-sm"></div>
        </div>
        <div class="sk sk-badge"></div>
        <div class="sk sk-btn"></div>
      </div>
    </div>

    <!-- No Profiles Yet -->
    <div class="empty-state" *ngIf="!doctorLoading() && filteredDoctors().length === 0">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      <p>No doctor profiles yet. Create a Doctor user first then add their profile.</p>
    </div>

    <!-- Doctors Table -->
    <div class="table-wrapper" *ngIf="!doctorLoading() && filteredDoctors().length > 0">
      <table class="users-table">
        <thead>
          <tr>
            <th>Doctor</th>
            <th>Department</th>
            <th>Specialization</th>
            <th>Schedule</th>
            <th>Fee</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let doc of filteredDoctors()" class="user-row">
            <td>
              <div class="user-cell">
                <div class="user-avatar" style="background:#3b82f6">
                  {{ getInitials(doc.fullName) }}
                </div>
                <div>
                  <div class="user-name">{{ doc.fullName }}</div>
                  <div class="user-email">{{ doc.qualification }}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="role-badge" style="background:#eff6ff;color:#1d4ed8">
                {{ doc.departmentIcon }} {{ doc.departmentName }}
              </span>
            </td>
            <td style="font-size:13px;color:#374151">{{ doc.specialization }}</td>
            <td>
              <div style="font-size:12px;color:#64748b">
                <div>{{ doc.morningStart | slice:0:5 }} - {{ doc.morningEnd | slice:0:5 }}</div>
                <div *ngIf="doc.hasEveningShift" style="color:#8b5cf6">
                  {{ doc.eveningStart | slice:0:5 }} - {{ doc.eveningEnd | slice:0:5 }}
                </div>
                <div style="margin-top:2px;font-size:11px">{{ doc.availableDays }}</div>
              </div>
            </td>
            <td style="font-weight:600;color:#0a2744">₹{{ doc.consultationFee }}</td>
            <td>
              <div class="action-btns">
                <button class="action-btn edit" (click)="openEditDoctor(doc)" title="Edit Profile">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</ng-container>

<!-- LEAVES PAGE -->
<ng-container *ngIf="activePage() === 'leaves'">
  <div class="section-card">
    <div class="section-header">
      <div>
        <h2>Doctor Leave Requests</h2>
        <p>Review and approve leave applications</p>
      </div>
    </div>

    <!-- Loading State -->
    <div class="loading-state" *ngIf="leavesLoading()">
      <div class="skeleton-row" *ngFor="let i of [1,2,3]">
        <div class="sk-group"><div class="sk sk-line-lg"></div><div class="sk sk-line-sm"></div></div>
        <div class="sk-group"><div class="sk sk-line-lg"></div><div class="sk sk-line-sm"></div></div>
        <div class="sk sk-badge"></div>
        <div class="sk sk-btn"></div>
      </div>
    </div>

    <!-- Filter & Search -->
    <div class="section-header" style="margin-top: -10px; margin-bottom: 20px; border-bottom: none; padding-bottom: 0;">
      <div class="role-tabs" style="margin: 0;">
        <button class="role-tab" [class.active]="leaveStatusTab() === 'all'" (click)="leaveStatusTab.set('all')">
          All Requests <span class="tab-count">{{ allLeaves().length }}</span>
        </button>
        <button class="role-tab" [class.active]="leaveStatusTab() === 'Pending'" (click)="leaveStatusTab.set('Pending')">
          <span class="tab-dot" style="background:#f59e0b"></span> Pending <span class="tab-count" style="background:#fef3c7;color:#b45309">{{ pendingLeavesCount() }}</span>
        </button>
        <button class="role-tab" [class.active]="leaveStatusTab() === 'Approved'" (click)="leaveStatusTab.set('Approved')">
          <span class="tab-dot" style="background:#10b981"></span> Approved <span class="tab-count">{{ getLeaveCountByStatus('Approved') }}</span>
        </button>
        <button class="role-tab" [class.active]="leaveStatusTab() === 'Rejected'" (click)="leaveStatusTab.set('Rejected')">
          <span class="tab-dot" style="background:#ef4444"></span> Rejected <span class="tab-count">{{ getLeaveCountByStatus('Rejected') }}</span>
        </button>
      </div>
      <div class="search-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Search doctor or reason..."
          [value]="leaveSearchQuery()"
          (input)="leaveSearchQuery.set($any($event.target).value)"/>
      </div>
    </div>

    <!-- Empty State -->
    <div class="empty-state" *ngIf="!leavesLoading() && filteredLeaves().length === 0">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <p>No leave requests found for this filter.</p>
    </div>

    <!-- Table -->
    <div class="table-wrapper" *ngIf="!leavesLoading() && filteredLeaves().length > 0">
      <table class="users-table">
        <thead>
          <tr>
            <th>Doctor</th>
            <th>Leave Dates</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let leave of filteredLeaves()" class="user-row">
            <td>
              <div class="user-cell">
                <div>
                  <div class="user-name">Dr. {{ leave.doctorName }}</div>
                  <div class="user-email">{{ leave.departmentName }}</div>
                </div>
              </div>
            </td>
            <td>
              <div style="font-size:13px; font-weight:600; color:#0f172a;">
                {{ formatDate(leave.startDate).split(' ')[0] }} - {{ formatDate(leave.endDate).split(' ')[0] }}
              </div>
            </td>
            <td>
              <div style="font-size:13px; color:#334155; max-width:250px;">{{ leave.reason }}</div>
            </td>
            <td>
              <span class="status-badge" 
                    [class.pending]="leave.status === 'Pending'"
                    [class.approved]="leave.status === 'Approved'"
                    [class.rejected]="leave.status === 'Rejected'">
                {{ leave.status }}
              </span>
            </td>
            <td>
              <div class="action-btns" *ngIf="leave.status === 'Pending'">
                <button class="btn-primary" style="padding:6px 12px; font-size:12px; height:auto; background:#10b981; border:none; color:white; border-radius:6px; font-weight:600; cursor:pointer;" (click)="updateLeaveStatus(leave.id, 'Approved')">
                  Approve
                </button>
                <button class="btn-secondary" style="padding:6px 12px; font-size:12px; height:auto; color:#ef4444; border:1px solid #fca5a5; background:white; border-radius:6px; font-weight:600; cursor:pointer;" (click)="updateLeaveStatus(leave.id, 'Rejected')">
                  Reject
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</ng-container>

<!-- REPORTS PAGE -->
<ng-container *ngIf="activePage() === 'reports'">
  <div class="section-card">
    <div class="section-header">
      <div>
        <h2>Reports & Analytics</h2>
        <p>Monitor hospital performance and audit logs</p>
      </div>
      <button class="btn-secondary" (click)="sendDailyDigest()" [disabled]="isLoading()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;margin-right:8px;">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        Send Daily Digest Email
      </button>
    </div>

    <!-- Loading State -->
    <div class="loading-state" *ngIf="reportsLoading()">
      <div class="skeleton-row" *ngFor="let i of [1,2,3]">
        <div class="sk-group"><div class="sk sk-line-lg"></div><div class="sk sk-line-sm"></div></div>
      </div>
    </div>

    <ng-container *ngIf="!reportsLoading()">
      <!-- System Stats Grid -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:24px;">
        <div class="stat-card" style="margin-bottom:0;">
          <div class="stat-icon" style="background:#eff6ff;color:#3b82f6;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div class="stat-details">
            <span class="stat-label">Total Patients</span>
            <span class="stat-value">{{ systemStats()?.totalPatients || 0 }}</span>
          </div>
        </div>
        <div class="stat-card" style="margin-bottom:0;">
          <div class="stat-icon" style="background:#dbeafe;color:#1d4ed8;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          </div>
          <div class="stat-details">
            <span class="stat-label">Total Doctors</span>
            <span class="stat-value">{{ systemStats()?.totalDoctors || 0 }}</span>
          </div>
        </div>
        <div class="stat-card" style="margin-bottom:0;">
          <div class="stat-icon" style="background:#fef3c7;color:#b45309;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div class="stat-details">
            <span class="stat-label">Appointments</span>
            <span class="stat-value">{{ systemStats()?.totalAppointments || 0 }}</span>
          </div>
        </div>
      </div>       <!-- Financial Reports -->
       <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:24px;">
         <!-- Dept Revenue Bar Chart -->
         <div style="background:#fafbfc; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
           <h3 style="font-size:15px; color:#0f172a; margin-bottom:16px;">Revenue by Department</h3>
           <div style="display:flex; flex-direction:column; gap:12px;">
              <div *ngIf="!reportData()?.revenueByDept || reportData()?.revenueByDept.length === 0" style="color:#64748b; font-size:13px;">No department revenue data.</div>
              <div *ngFor="let item of reportData()?.revenueByDept" style="display:flex; align-items:center; gap:12px;">
                  <div style="width:100px; font-size:12px; font-weight:600; color:#475569;">{{ item.department || 'General' }}</div>
                  <div style="flex:1; height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden;">
                     <div style="height:100%; background:#3b82f6; border-radius:4px;" [style.width]="(item.amount / reportData()?.totalRevenue * 100) + '%'"></div>
                  </div>
                  <div style="font-size:12px; font-weight:700; color:#0f172a;">₹{{ item.amount }}</div>
              </div>
           </div>
         </div>

         <!-- Source Revenue Pie/Multi-bar Chart -->
         <div style="background:#fafbfc; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
           <h3 style="font-size:15px; color:#0f172a; margin-bottom:16px;">Revenue by Source</h3>
           <div style="display:flex; flex-direction:column; gap:12px;">
              <div *ngIf="!reportData()?.revenueBySource || reportData()?.revenueBySource.length === 0" style="color:#64748b; font-size:13px;">No source revenue data.</div>
              <div *ngFor="let item of reportData()?.revenueBySource" style="display:flex; align-items:center; gap:12px;">
                  <div style="width:100px; font-size:12px; font-weight:600; color:#475569;">{{ item.source }}</div>
                  <div style="flex:1; height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden;">
                     <div style="height:100%; background:#8b5cf6; border-radius:4px;" [style.width]="(item.amount / reportData()?.totalRevenue * 100) + '%'"></div>
                  </div>
                  <div style="font-size:12px; font-weight:700; color:#0f172a;">₹{{ item.amount }}</div>
              </div>
           </div>
         </div>
       </div>

       <!-- Total Summary Card -->
       <div style="background:linear-gradient(135deg, #0f4c81, #0a2744); border-radius:12px; padding:24px; color:white; display:flex; flex-direction:column; justify-content:center; margin-bottom: 24px;">
           <span style="font-size:14px; opacity:0.8; margin-bottom:8px;">Total Hospital Revenue (All Sources)</span>
           <span style="font-size:36px; font-weight:700;">₹{{ reportData()?.totalRevenue?.toLocaleString() || 0 }}</span>
           <div style="margin-top:16px; font-size:13px; opacity:0.9; display:flex; align-items:center; gap:6px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
              Calculated from Appointments, Pharmacy & Lab
           </div>
       </div>
        
      <!-- Audit Logs Section -->
      <div style="margin-top:40px;">
        <div class="section-header" style="border-bottom:none; margin-bottom:16px;">
          <div>
            <h3 style="font-size:18px; color:#0f172a; font-weight:800;">Recent Activity & Audit Logs</h3>
            <p style="font-size:13px; color:#64748b;">Live stream of system events and security audits</p>
          </div>
          <button class="btn-secondary" style="padding:8px 16px; font-size:12px; height:auto;" (click)="loadAuditLogs()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;margin-right:6px;"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Refresh Logs
          </button>
        </div>

        <div class="audit-container" style="background:rgba(255,255,255,0.7); backdrop-filter:blur(10px); border:1px solid rgba(226,232,240,0.8); border-radius:20px; padding:8px; box-shadow:0 10px 30px rgba(0,0,0,0.03);">
          <div class="table-wrapper" style="border:none; box-shadow:none; max-height:500px; overflow-y:auto;">
            <table class="users-table">
              <thead>
                <tr style="background:transparent;">
                  <th style="padding:16px; font-size:11px;">TIMESTAMP</th>
                  <th style="padding:16px; font-size:11px;">USER / IDENTITY</th>
                  <th style="padding:16px; font-size:11px;">ACTION / ENDPOINT</th>
                  <th style="padding:16px; font-size:11px;">DYNAMICS</th>
                </tr>
              </thead>
              <tbody style="background:transparent;">
                 <tr *ngIf="auditLogs().length === 0">
                   <td colspan="4" style="text-align:center; padding:40px; color:#94a3b8; font-style:italic;">No recent activity recorded.</td>
                 </tr>
                 <tr *ngFor="let log of auditLogs()" class="audit-row" style="transition:all 0.2s;">
                   <td style="padding:16px;">
                     <div style="font-size:13px; color:#1e293b; font-weight:600;">{{ log.createdAt | date:'dd MMM, HH:mm' }}</div>
                     <div style="font-size:11px; color:#94a3b8; margin-top:2px;">{{ timeSince(log.createdAt) }}</div>
                   </td>
                   <td style="padding:16px;">
                     <div style="display:flex; align-items:center; gap:10px;">
                       <div [style.background]="getAvatarColor(log.userEmail?.[0] || 'A')" style="width:32px; height:32px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:12px; font-weight:700;">
                         {{ (log.userEmail?.[0] || 'S').toUpperCase() }}
                       </div>
                       <div>
                         <div style="font-size:13px; font-weight:700; color:#0f172a;">{{ log.userEmail || 'System' }}</div>
                         <div style="font-size:11px; color:#64748b;">IP: {{ log.ipAddress }}</div>
                       </div>
                     </div>
                   </td>
                   <td style="padding:16px;">
                     <div style="display:flex; flex-direction:column; gap:6px;">
                       <div style="display:flex; align-items:center; gap:8px;">
                         <span [class]="'method-badge ' + (log.action?.split(' ')?.[0]?.toLowerCase() || 'get')">
                           {{ log.action?.split(' ')?.[0] || 'GET' }}
                         </span>
                         <code style="font-size:11px; color:#0f4c81; font-weight:600; background:#eff6ff; padding:2px 6px; border-radius:4px;">
                           {{ log.endpoint }}
                         </code>
                       </div>
                       <div style="font-size:12px; color:#475569; font-weight:500;">{{ log.action?.split(' ').slice(1).join(' ') }}</div>
                     </div>
                   </td>
                   <td style="padding:16px;">
                     <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px; font-size:12px; color:#475569; border-left:4px solid #3b82f6;">
                       {{ log.details }}
                     </div>
                   </td>
                 </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ng-container>
  </div>
</ng-container>

<!-- HOSPITAL CHAT PAGE -->
<ng-container *ngIf="activePage() === 'hospital-chat'">
  <div class="section-card" style="height: calc(100vh - 200px); padding: 0; overflow: hidden;">
    <app-hospital-chat></app-hospital-chat>
  </div>
</ng-container>

      <!-- CREATE / EDIT USER MODAL -->
      <div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3>{{ isEditing() ? 'Edit User' : 'Create New User' }}</h3>
              <p>{{ isEditing() ? 'Update user details' : 'Add a new staff member or account' }}</p>
            </div>
            <button class="modal-close" (click)="closeModal()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <form [formGroup]="userForm" (ngSubmit)="saveUser()" class="modal-form">

            <div class="form-row">
              <div class="field-group">
                <label>Full Name</label>
                <input type="text" formControlName="fullName" placeholder="Dr. John Smith"
                  [class.error]="hasError('fullName')"/>
                <span class="ferr" *ngIf="hasError('fullName')">Full name is required</span>
              </div>
              <div class="field-group">
                <label>Phone Number</label>
                <input type="tel" formControlName="phoneNumber" placeholder="9876543210"/>
              </div>
            </div>

            <div class="field-group">
              <label>Email Address</label>
              <input type="email" formControlName="email" placeholder="doctor@medicore.com"
                [class.error]="hasError('email')" [readonly]="isEditing()"/>
              <span class="ferr" *ngIf="hasError('email')">Valid email is required</span>
            </div>

            <div class="field-group" *ngIf="!isEditing()">
              <label>Password</label>
              <input type="password" formControlName="password" placeholder="Min 6 characters"
                [class.error]="hasError('password')"/>
              <span class="ferr" *ngIf="hasError('password')">Password is required</span>
            </div>

            <div class="field-group" *ngIf="!isEditing()">
              <label>Role</label>
              <select formControlName="roleId" [class.error]="hasError('roleId')">
                <option value="">Select role</option>
                <option *ngFor="let role of availableRoles" [value]="role.id">
                  {{ role.name }}
                </option>
              </select>
              <span class="ferr" *ngIf="hasError('roleId')">Role is required</span>
            </div>

            <div class="field-group" *ngIf="isEditing()">
              <label>Status</label>
              <select formControlName="isActive">
                <option [value]="true">Active</option>
                <option [value]="false">Inactive</option>
              </select>
            </div>

            <div class="modal-error" *ngIf="modalError()">{{ modalError() }}</div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="isSaving()">
                <span *ngIf="!isSaving()">{{ isEditing() ? 'Save Changes' : 'Create User' }}</span>
                <span *ngIf="isSaving()" class="loading-content">
                  <span class="spinner"></span>
                  {{ isEditing() ? 'Saving...' : 'Creating...' }}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- RESET PASSWORD MODAL -->
      <div class="modal-overlay" *ngIf="showResetModal()" (click)="showResetModal.set(false)">
        <div class="modal modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3>Reset Password</h3>
              <p>Set a new password for {{ selectedUser()?.fullName }}</p>
            </div>
            <button class="modal-close" (click)="showResetModal.set(false)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <form [formGroup]="resetForm" (ngSubmit)="resetPassword()" class="modal-form">
            <div class="field-group">
              <label>New Password</label>
              <input type="password" formControlName="newPassword" placeholder="Min 6 characters"/>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="showResetModal.set(false)">Cancel</button>
              <button type="submit" class="btn-primary" [disabled]="isSaving()">
                <span *ngIf="!isSaving()">Reset Password</span>
                <span *ngIf="isSaving()" class="loading-content"><span class="spinner"></span> Resetting...</span>
              </button>
            </div>
          </form>
        </div>
      </div>

<!-- DEPARTMENT MODAL -->
<div class="modal-overlay" *ngIf="showDeptModal()" (click)="showDeptModal.set(false)">
  <div class="modal modal-sm" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <div>
        <h3>{{ editingDept() ? 'Edit Department' : 'Add Department' }}</h3>
        <p>{{ editingDept() ? 'Update department details' : 'Add a new hospital department' }}</p>
      </div>
      <button class="modal-close" (click)="showDeptModal.set(false)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <form [formGroup]="deptForm" (ngSubmit)="saveDept()" class="modal-form">
      <div class="form-row">
        <div class="field-group">
          <label>Department Name</label>
          <input type="text" formControlName="name" placeholder="e.g. Cardiology"/>
        </div>
        <div class="field-group">
          <label>Icon (Emoji)</label>
          <input type="text" formControlName="icon" placeholder="e.g. ❤️"/>
        </div>
      </div>
      <div class="field-group">
        <label>Description</label>
        <input type="text" formControlName="description" placeholder="Brief description"/>
      </div>
      <div class="field-group">
        <label>Floor Number</label>
        <input type="number" formControlName="floorNumber" placeholder="1"/>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn-secondary" (click)="showDeptModal.set(false)">Cancel</button>
        <button type="submit" class="btn-primary" [disabled]="isSaving()">
          <span *ngIf="!isSaving()">{{ editingDept() ? 'Save Changes' : 'Add Department' }}</span>
          <span *ngIf="isSaving()" class="loading-content"><span class="spinner"></span> Saving...</span>
        </button>
      </div>
    </form>
  </div>
</div>

<!-- DOCTOR PROFILE MODAL -->
<div class="modal-overlay" *ngIf="showDoctorModal()" (click)="showDoctorModal.set(false)">
  <div class="modal" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <div>
        <h3>{{ editingDoctor() ? 'Edit Doctor Profile' : 'Create Doctor Profile' }}</h3>
        <p>Setup specialization, schedule and consultation fee</p>
      </div>
      <button class="modal-close" (click)="showDoctorModal.set(false)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <form [formGroup]="doctorForm" (ngSubmit)="saveDoctor()" class="modal-form">

      <div class="field-group" *ngIf="!editingDoctor()">
        <label>Select Doctor User</label>
        <select formControlName="userId">
          <option value="">Select a doctor</option>
          <option *ngFor="let u of doctorUsers()" [value]="u.id">
            {{ u.fullName }} — {{ u.email }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>Department</label>
          <select formControlName="departmentId">
            <option value="">Select department</option>
            <option *ngFor="let d of allDepartments()" [value]="d.id">
              {{ d.icon }} {{ d.name }}
            </option>
          </select>
        </div>
        <div class="field-group">
          <label>Specialization</label>
          <input type="text" formControlName="specialization" placeholder="e.g. Cardiologist"/>
        </div>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>Qualification</label>
          <input type="text" formControlName="qualification" placeholder="e.g. MBBS, MD"/>
        </div>
        <div class="field-group">
          <label>Experience (Years)</label>
          <input type="number" formControlName="experienceYears" placeholder="5"/>
        </div>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>Consultation Fee (₹)</label>
          <input type="number" formControlName="consultationFee" placeholder="500"/>
        </div>
        <div class="field-group">
          <label>Slot Duration (mins)</label>
          <select formControlName="slotDurationMinutes">
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="20">20 minutes</option>
            <option value="30">30 minutes</option>
          </select>
        </div>
      </div>

      <div class="field-group">
        <label>Available Days</label>
        <div class="days-selector">
          <label class="day-chip" *ngFor="let day of weekDays"
            [class.selected]="isDaySelected(day)">
            <input type="checkbox" [checked]="isDaySelected(day)"
              (change)="toggleDay(day)"/>
            {{ day }}
          </label>
        </div>
      </div>

      <div class="form-row">
        <div class="field-group">
          <label>Morning Start</label>
          <input type="time" formControlName="morningStart"/>
        </div>
        <div class="field-group">
          <label>Morning End</label>
          <input type="time" formControlName="morningEnd"/>
        </div>
      </div>

      <div class="field-group">
        <label class="checkbox-label" style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" formControlName="hasEveningShift"/>
          <span style="font-size:13px;font-weight:500;color:#374151">Has Evening Shift</span>
        </label>
      </div>

      <div class="form-row" *ngIf="doctorForm.get('hasEveningShift')?.value">
        <div class="field-group">
          <label>Evening Start</label>
          <input type="time" formControlName="eveningStart"/>
        </div>
        <div class="field-group">
          <label>Evening End</label>
          <input type="time" formControlName="eveningEnd"/>
        </div>
      </div>

      <div class="field-group">
        <label>Max Patients Per Day</label>
        <input type="number" formControlName="maxPatientsPerDay" placeholder="30"/>
      </div>

      <div class="field-group">
        <label>Bio</label>
        <input type="text" formControlName="bio" placeholder="Short bio about the doctor"/>
      </div>

      <div class="modal-error" *ngIf="modalError()">{{ modalError() }}</div>

      <div class="modal-footer">
        <button type="button" class="btn-secondary" (click)="showDoctorModal.set(false)">Cancel</button>
        <button type="submit" class="btn-primary" [disabled]="isSaving()">
          <span *ngIf="!isSaving()">{{ editingDoctor() ? 'Save Changes' : 'Create Profile' }}</span>
          <span *ngIf="isSaving()" class="loading-content"><span class="spinner"></span> Saving...</span>
        </button>
      </div>
    </form>
  </div>
</div>

      <!-- SUCCESS TOAST -->
      <div class="toast" [class.show]="toastMsg()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        {{ toastMsg() }}
      </div>

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }

    .admin { padding: 0; }

    /* Page Header */
    .page-header {
      display: flex; align-items: flex-start;
      justify-content: space-between; gap: 16px;
      margin-bottom: 24px; flex-wrap: wrap;
    }
    .page-header h1 { font-size: 22px; font-weight: 700; color: #0a2744; letter-spacing: -0.3px; }
    .page-header p { font-size: 13px; color: #64748b; margin-top: 3px; }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px; margin-bottom: 24px;
    }

    .stat-card {
      background: white; border-radius: 14px;
      padding: 18px; display: flex; align-items: center;
      gap: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9;
    }

    .stat-icon {
      width: 46px; height: 46px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .stat-icon :deep(svg) { width: 20px; height: 20px; color: white; }

    .stat-body { flex: 1; }
    .stat-value { font-size: 22px; font-weight: 700; color: #0a2744; line-height: 1; }
    .stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }

    .stat-badge {
      font-size: 11px; font-weight: 600;
      padding: 4px 8px; border-radius: 100px;
    }

    /* Section Card */
    .section-card {
      background: white; border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9; overflow: hidden;
    }

    .section-header {
      display: flex; align-items: center;
      justify-content: space-between; gap: 16px;
      padding: 20px 24px; border-bottom: 1px solid #f1f5f9;
      flex-wrap: wrap;
    }

    /* Reports Styles */
    .reports-container { animation: fadeIn 0.3s ease; }
    .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .r-stat-card { background: #fff; padding: 20px; border-radius: 14px; border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .r-stat-card.orange { border-left: 4px solid #f59e0b; }
    .r-stat-card .lbl { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 6px; }
    .r-stat-card .val { font-size: 28px; font-weight: 800; color: #0a2744; }

    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    @media (max-width: 900px) { .charts-grid { grid-template-columns: 1fr; } }
    .chart-panel { background: #fff; border-radius: 16px; border: 1px solid #f1f5f9; padding: 20px; }
    .chart-panel .panel-head h3 { font-size: 15px; margin-bottom: 20px; color: #0a2744; }

    .revenue-chart { display: flex; align-items: flex-end; gap: 4px; height: 200px; padding-bottom: 30px; position: relative; border-bottom: 1px solid #e2e8f0; }
    .bar-container { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; position: relative; }
    .bar { width: 100%; background: #3b82f6; border-radius: 4px 4px 0 0; min-height: 2px; transition: height 0.3s ease; }
    .bar:hover { background: #1d4ed8; }
    .bar-lbl { font-size: 9px; color: #94a3b8; position: absolute; bottom: -22px; }
    .empty-chart { height: 100%; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 13px; }

    .dept-rev-row { margin-bottom: 14px; }
    .d-info { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
    .d-bar-bg { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
    .d-bar { height: 100%; background: #10b981; border-radius: 4px; }

    .section-header h2 { font-size: 16px; font-weight: 700; color: #0a2744; }
    .section-header p { font-size: 12px; color: #64748b; margin-top: 2px; }

    .search-box {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 14px; border: 1.5px solid #e2e8f0;
      border-radius: 10px; background: #f8fafc;
      transition: all 0.2s; min-width: 220px;
    }
    .search-box:focus-within { border-color: #0f4c81; background: white; box-shadow: 0 0 0 3px rgba(15,76,129,0.08); }
    .search-box svg { width: 15px; height: 15px; color: #94a3b8; flex-shrink: 0; }
    .search-box input { border: none; background: transparent; font-size: 13px; color: #0f172a; outline: none; width: 100%; }
    .search-box input::placeholder { color: #cbd5e1; }

    /* Role Tabs */
    .role-tabs {
      display: flex; gap: 4px; padding: 12px 24px;
      border-bottom: 1px solid #f1f5f9; overflow-x: auto;
      scrollbar-width: none;
    }
    .role-tabs::-webkit-scrollbar { display: none; }

    .role-tab {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 14px; border-radius: 8px; border: none;
      background: transparent; font-size: 12px; font-weight: 500;
      color: #64748b; cursor: pointer; transition: all 0.15s;
      white-space: nowrap;
    }
    .role-tab:hover { background: #f1f5f9; color: #0f172a; }
    .role-tab.active { background: #eff6ff; color: #0f4c81; font-weight: 600; }

    .tab-dot { width: 6px; height: 6px; border-radius: 50%; }
    .tab-count {
      background: #e2e8f0; color: #64748b;
      font-size: 10px; font-weight: 700;
      padding: 1px 6px; border-radius: 100px;
    }
    .role-tab.active .tab-count { background: #bfdbfe; color: #0f4c81; }

    /* Skeleton Loading */
    .loading-state { padding: 16px 24px; display: flex; flex-direction: column; gap: 12px; }
    .skeleton-row { display: flex; align-items: center; gap: 12px; }
    .sk { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 6px; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .sk-avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
    .sk-group { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .sk-line-lg { height: 13px; width: 60%; }
    .sk-line-sm { height: 11px; width: 40%; }
    .sk-badge { height: 22px; width: 80px; border-radius: 100px; }
    .sk-btn { height: 28px; width: 60px; border-radius: 8px; }

    /* Table */
    .table-wrapper { overflow-x: auto; }

    .users-table {
      width: 100%; border-collapse: collapse;
      font-size: 13px;
    }

    .users-table thead tr {
      background: #f8fafc; border-bottom: 1px solid #e2e8f0;
    }

    .users-table th {
      padding: 11px 16px; text-align: left;
      font-size: 11px; font-weight: 600;
      color: #64748b; text-transform: uppercase;
      letter-spacing: 0.5px; white-space: nowrap;
    }

    .user-row { border-bottom: 1px solid #f1f5f9; transition:  background  0.15s; }
    .user-row:hover { background: #f8fafc; }
    .user-row td { padding: 12px 16px; }

    .user-cell { display: flex; align-items: center; gap: 10px; }

    .user-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; color: white; flex-shrink: 0;
    }

    .user-name { font-size: 13px; font-weight: 600; color: #0f172a; }
    .user-email { font-size: 11px; color: #64748b; margin-top: 1px; }

    .role-badge {
      display: inline-block; padding: 3px 10px;
      border-radius: 100px; font-size: 11px; font-weight: 600;
    }

    .phone-cell { color: #64748b; font-size: 12px; }
    .date-cell { color: #94a3b8; font-size: 12px; white-space: nowrap; }

    .status-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 10px; border-radius: 100px;
      font-size: 11px; font-weight: 600;
    }
    .status-badge.active { background: #dcfce7; color: #16a34a; }
    .status-badge.inactive { background: #fee2e2; color: #dc2626; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

    .action-btns { display: flex; gap: 6px; align-items: center; }

    .action-btn {
      width: 30px; height: 30px; border-radius: 8px;
      border: 1px solid #e2e8f0; background: white;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.15s; color: #64748b;
      font-size: 11px; font-weight: 600; gap: 4px; padding: 0 8px;
    }
    .action-btn svg { width: 13px; height: 13px; }
    .action-btn:hover { border-color: transparent; }
    .action-btn.edit:hover { background: #eff6ff; color: #0f4c81; border-color: #bfdbfe; }
    .action-btn.deactivate:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
    .action-btn.activate:hover { background: #dcfce7; color: #16a34a; border-color: #bbf7d0; }
    .action-btn.reset:hover { background: #fef9c3; color: #ca8a04; border-color: #fde68a; }

    .empty-state {
      text-align: center; padding: 48px;
      color: #94a3b8;
    }
    .empty-state svg { width: 40px; height: 40px; margin-bottom: 10px; }
    .empty-state p { font-size: 14px; }

    /* Mobile Cards */
    .mobile-cards { display: none; padding: 12px; gap: 10px; flex-direction: column; }
    @media (max-width: 768px) {
      .table-wrapper { display: none; }
      .mobile-cards { display: flex; }
    }

    .mobile-user-card {
      border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 14px; background: #fafbfc;
    }
    .muc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
    .muc-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .muc-phone { font-size: 12px; color: #64748b; }
    .muc-actions { display: flex; gap: 8px; }
    .muc-actions .action-btn { width: auto; height: 30px; padding: 0 10px; font-size: 11px; }

    /* Buttons */
    .btn-primary {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 18px;
      background: linear-gradient(135deg, #0a2744 0%, #0f4c81 100%);
      color: white; border: none; border-radius: 10px;
      font-size: 13px; font-weight: 600; cursor: pointer;
      transition: all 0.2s; font-family: 'DM Sans', sans-serif;
      white-space: nowrap;
    }
    .btn-primary svg { width: 16px; height: 16px; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(15,76,129,0.3); }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

    .btn-secondary {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 10px 18px; background: white;
      color: #64748b; border: 1.5px solid #e2e8f0;
      border-radius: 10px; font-size: 13px; font-weight: 500;
      cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
    }
    .btn-secondary:hover { border-color: #94a3b8; color: #0f172a; }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(15,23,42,0.5);
      backdrop-filter: blur(4px); z-index: 100;
      display: flex; align-items: center; justify-content: center;
      padding: 16px;
    }

    .modal {
      background: white; border-radius: 18px;
      width: 100%; max-width: 520px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.2);
      max-height: 90vh; overflow-y: auto;
    }

    .modal-sm { max-width: 380px; }

    .modal-header {
      display: flex; align-items: flex-start;
      justify-content: space-between; padding: 24px 24px 0;
    }
    .modal-header h3 { font-size: 17px; font-weight: 700; color: #0a2744; }
    .modal-header p { font-size: 12px; color: #64748b; margin-top: 3px; }

    .modal-close {
      background: none; border: none; cursor: pointer;
      color: #94a3b8; padding: 4px; border-radius: 6px;
      transition: all 0.2s;
    }
    .modal-close:hover { background: #f1f5f9; color: #0f172a; }
    .modal-close svg { width: 18px; height: 18px; }

    .modal-form { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 14px; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } }

    .field-group { display: flex; flex-direction: column; gap: 5px; }
    .field-group label { font-size: 12px; font-weight: 600; color: #374151; }

    .field-group input, .field-group select {
      padding: 10px 12px; border: 1.5px solid #e2e8f0;
      border-radius: 8px; font-size: 13px; color: #0f172a;
      font-family: 'DM Sans', sans-serif; outline: none;
      background: #f8fafc; transition: all 0.2s;
    }
    .field-group input:focus, .field-group select:focus {
      border-color: #0f4c81; background: white;
      box-shadow: 0 0 0 3px rgba(15,76,129,0.08);
    }
    .field-group input.error { border-color: #ef4444; }
    .field-group input[readonly] { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }

    .ferr { font-size: 11px; color: #ef4444; font-weight: 500; }

    .modal-error {
      padding: 10px 12px; background: #fef2f2;
      border: 1px solid #fecaca; border-radius: 8px;
      color: #dc2626; font-size: 12px;
    }

    .modal-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding-top: 8px; border-top: 1px solid #f1f5f9;
    }

    .loading-content { display: flex; align-items: center; gap: 8px; }
    .spinner {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Toast */
    .toast {
      position: fixed; bottom: 24px; right: 24px;
      background: #0a2744; color: white;
      padding: 12px 18px; border-radius: 10px;
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; font-weight: 500;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      transform: translateY(80px); opacity: 0;
      transition: all 0.3s; z-index: 200;
    }
    .toast.show { transform: translateY(0); opacity: 1; }
    .toast svg { width: 16px; height: 16px; color: #4ade80; }

    /* Page Tabs */
    .page-tabs {
      display: flex; gap: 4px;
      margin-bottom: 24px;
      background: white;
      padding: 6px;
      border-radius: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9;
      width: fit-content;
    }

    .page-tab {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 10px;
      border: none; background: transparent;
      font-size: 13px; font-weight: 500;
      color: #64748b; cursor: pointer;
      transition: all 0.2s; font-family: 'DM Sans', sans-serif;
    }
    .page-tab svg { width: 16px; height: 16px; }
    .page-tab:hover { background: #f1f5f9; color: #0f172a; }
    .page-tab.active { background: linear-gradient(135deg, #0a2744, #0f4c81); color: white; }
    .page-tab.active .page-tab-count { background: rgba(255,255,255,0.2); color: white; }

    .page-tab-count {
      background: #e2e8f0; color: #64748b;
      font-size: 11px; font-weight: 700;
      padding: 2px 8px; border-radius: 100px;
    }

    /* Department Grid */
    .dept-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px; padding: 20px;
    }

    .dept-card {
      display: flex; align-items: flex-start; gap: 14px;
      padding: 18px; border: 1.5px solid #e2e8f0;
      border-radius: 14px; background: #fafbfc;
      transition: all 0.2s;
    }
    .dept-card:hover { border-color: #0f4c81; background: white; box-shadow: 0 4px 12px rgba(15,76,129,0.08); }
    .dept-card.inactive { opacity: 0.5; }

    .dept-icon { font-size: 32px; flex-shrink: 0; }

    .dept-info { flex: 1; }
    .dept-name { font-size: 15px; font-weight: 700; color: #0a2744; margin-bottom: 4px; }
    .dept-desc { font-size: 12px; color: #64748b; margin-bottom: 8px; line-height: 1.5; }

    .dept-meta { display: flex; align-items: center; gap: 12px; }
    .dept-floor { font-size: 11px; color: #94a3b8; }
    .dept-doctors {
      display: flex; align-items: center; gap: 4px;
      font-size: 11px; color: #0f4c81; font-weight: 600;
    }
    .dept-doctors svg { width: 12px; height: 12px; }

    .dept-actions { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }

    /* Days Selector */
    .days-selector { display: flex; gap: 6px; flex-wrap: wrap; }

    .day-chip {
      padding: 6px 12px; border: 1.5px solid #e2e8f0;
      border-radius: 8px; font-size: 12px; font-weight: 500;
      color: #64748b; cursor: pointer; transition: all 0.2s;
      user-select: none;
    }
    .day-chip input { display: none; }
    .day-chip.selected { border-color: #0f4c81; background: #eff6ff; color: #0f4c81; font-weight: 600; }
    /* Leave Status Badges */
    .status-badge.pending { background:#fefce8; color:#a16207; }
    .status-badge.approved { background:#dcfce7; color:#16a34a; }
    .status-badge.rejected { background:#fef2f2; color:#ef4444; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private readonly config = inject(ConfigService);
  private readonly API_URL = this.config.apiUrl;

  timeSince(date: string) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  }

  isLoading = signal(true);
  isSaving = signal(false);
  showModal = signal(false);
  showResetModal = signal(false);
  isEditing = signal(false);
  selectedUser = signal<User | null>(null);
  activeTab = signal('all');
  activePage = signal<'users' | 'departments' | 'doctors' | 'reports' | 'leaves' | 'hospital-chat'>('users');
  searchQuery = signal('');
  toastMsg = signal('');
  modalError = signal('');

  allUsers = signal<User[]>([]);

  // Department signals
  allDepartments = signal<any[]>([]);
  deptLoading = signal(false);
  showDeptModal = signal(false);
  editingDept = signal<any>(null);
  deptForm: any;

  // Doctor signals
  allDoctors = signal<any[]>([]);
  doctorLoading = signal(true);
  showDoctorModal = signal(false);
  editingDoctor = signal<any>(null);
  doctorForm: any;
  doctorSearch = signal('');
  doctorUsers = signal<any[]>([]);
  selectedDays = signal<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

  // Doctor Leaves State
  allLeaves = signal<any[]>([]);
  leavesLoading = signal(true);
  leaveStatusTab = signal<string>('all');
  leaveSearchQuery = signal<string>('');
  
  pendingLeavesCount = computed(() => this.allLeaves().filter(l => l.status === 'Pending').length);

  filteredLeaves = computed(() => {
    let leaves = this.allLeaves();
    
    // Filter by tab
    if (this.leaveStatusTab() !== 'all') {
      leaves = leaves.filter(l => l.status === this.leaveStatusTab());
    }

    // Filter by search
    const q = this.leaveSearchQuery().toLowerCase();
    if (q) {
      leaves = leaves.filter(l => 
        (l.doctorName && l.doctorName.toLowerCase().includes(q)) ||
        (l.departmentName && l.departmentName.toLowerCase().includes(q)) ||
        (l.reason && l.reason.toLowerCase().includes(q))
      );
    }
    return leaves;
  });

  getLeaveCountByStatus(status: string): number {
    return this.allLeaves().filter(l => l.status === status).length;
  }

  // Reports Data
  reportData = signal<any>(null);
  systemStats = signal<any>(null);
  auditLogs = signal<any[]>([]);
  reportsLoading = signal(true);

  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  filteredDoctors = computed(() => {
    const q = this.doctorSearch().toLowerCase();
    if (!q) return this.allDoctors();
    return this.allDoctors().filter(d =>
      d.fullName.toLowerCase().includes(q) ||
      d.specialization.toLowerCase().includes(q) ||
      d.departmentName.toLowerCase().includes(q)
    );
  });

  userForm: any;
  resetForm: any;

  roleTabs = [
    { label: 'All Users', value: 'all', color: '#64748b' },
    { label: 'Admins', value: 'SuperAdmin', color: '#8b5cf6' },
    { label: 'Doctors', value: 'Doctor', color: '#3b82f6' },
    { label: 'Nurses', value: 'Nurse', color: '#10b981' },
    { label: 'Patients', value: 'Patient', color: '#f59e0b' },
    { label: 'Pharmacists', value: 'Pharmacist', color: '#ef4444' },
    { label: 'Lab Tech', value: 'LabTechnician', color: '#06b6d4' },
    { label: 'Finance', value: 'FinanceStaff', color: '#84cc16' },
    { label: 'Reception', value: 'Receptionist', color: '#f97316' },
  ];

  availableRoles = [
    { id: 2, name: 'Hospital Admin' },
    { id: 3, name: 'Receptionist' },
    { id: 4, name: 'Doctor' },
    { id: 5, name: 'Nurse' },
    { id: 6, name: 'Pharmacist' },
    { id: 7, name: 'Lab Technician' },
    { id: 8, name: 'Finance Staff' },
    { id: 9, name: 'Mentor' },
    { id: 10, name: 'Patient' },
  ];

  filteredUsers = computed(() => {
    let users = this.allUsers();
    if (this.activeTab() !== 'all') {
      users = users.filter(u => u.roles && u.roles.includes(this.activeTab()));
    }
    const q = this.searchQuery().toLowerCase();
    if (q) {
      users = users.filter(u =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.roles && u.roles.some((r: string) => r.toLowerCase().includes(q)))
      );
    }
    return users;
  });

  formatTime(timeSpan: string) {
    if (!timeSpan) return '';
    const parts = timeSpan.split(':');
    return `${parts[0]}:${parts[1]}`;
  }

  // --- DOCTOR LEAVES METHODS ---

  loadLeaves() {
    this.leavesLoading.set(true);
    this.http.get<any>(`${this.API_URL}/doctor-leaves/all`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.allLeaves.set(res.data);
          }
          this.leavesLoading.set(false);
        },
        error: () => this.leavesLoading.set(false)
      });
  }

  updateLeaveStatus(leaveId: number, status: string) {
    if (!confirm(`Are you sure you want to mark this leave as ${status}?`)) return;

    this.http.patch<any>(`${this.API_URL}/doctor-leaves/${leaveId}/status`, { status }, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.showToast(`Leave ${status} successfully`);
            this.loadLeaves();
          } else {
            this.modalError.set(res.message);
          }
        },
        error: (err) => {
          this.modalError.set('Failed to update leave status.');
        }
      });
  }

  statsCards = computed(() => {
    const users = this.allUsers();
    return [
      {
        label: 'Total Users', value: users.length,
        badge: 'All Roles', badgeColor: '#0f4c81', badgeBg: '#eff6ff',
        bg: '#3b82f6',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
      },
      {
        label: 'Active Users', value: users.filter(u => u.isActive).length,
        badge: 'Online', badgeColor: '#16a34a', badgeBg: '#dcfce7',
        bg: '#10b981',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
      },
      {
        label: 'Doctors', value: users.filter(u => u.roles && u.roles.includes('Doctor')).length,
        badge: 'Medical', badgeColor: '#1d4ed8', badgeBg: '#dbeafe',
        bg: '#8b5cf6',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`
      },
      {
        label: 'Patients', value: users.filter(u => u.roles && u.roles.includes('Patient')).length,
        badge: 'Registered', badgeColor: '#b45309', badgeBg: '#fef3c7',
        bg: '#f59e0b',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`
      },
    ];
  });

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private fb: FormBuilder,
    private notification: NotificationService
  ) {
    this.userForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      phoneNumber: [''],
      roleId: ['', Validators.required],
      isActive: [true],
    });

    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.deptForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      icon: ['🏥'],
      floorNumber: [1],
    });

    this.doctorForm = this.fb.group({
      userId: [''],
      departmentId: ['', Validators.required],
      specialization: ['', Validators.required],
      qualification: [''],
      experienceYears: [0],
      consultationFee: [500, Validators.required],
      slotDurationMinutes: [15],
      morningStart: ['09:00'],
      morningEnd: ['13:00'],
      hasEveningShift: [false],
      eveningStart: ['17:00'],
      eveningEnd: ['20:00'],
      maxPatientsPerDay: [30],
      bio: [''],
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadDepartments();
    this.loadDoctors();
    this.loadReports();
    this.loadAuditLogs();
    this.loadLeaves();
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getAccessToken()}`
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.http.get<any>(`${this.API_URL}/users`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success) {
            this.allUsers.set(res.data.users);
          }
        },
        error: () => this.isLoading.set(false)
      });
  }

  sendDailyDigest() {
    this.isLoading.set(true);
    this.http.post(`${this.API_URL}/digest/send`, {
      dietPlanHtml: "<b>Today's Health Tip:</b> Stay hydrated and aimed for 8 glasses of water. Include more leafy greens in your lunch for better digestion."
    }, { headers: this.getHeaders() }).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.notification.success('Success', res.message || 'Daily digest sent successfully');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notification.error('Error', err.error?.message || 'Failed to send daily digest');
      }
    });
  }

  loadReports(): void {
    this.reportsLoading.set(true);
    this.http.get<any>(`${this.API_URL}/reports/revenue-summary`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.reportData.set(res.data);
          }
        },
        error: () => {}
      });
    this.http.get<any>(`${this.API_URL}/reports/system-stats`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.systemStats.set(res.data);
          }
          this.reportsLoading.set(false);
        },
        error: () => this.reportsLoading.set(false)
      });
  }

  loadAuditLogs(): void {
    this.http.get<any>(`${this.API_URL}/reports/audit-logs`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.auditLogs.set(res.data);
          }
        },
        error: () => {}
      });
  }

  filterByRole(role: string): void {
    this.activeTab.set(role);
  }

  getRoleCount(role: string): number {
    if (role === 'all') return this.allUsers().length;
    return this.allUsers().filter(u => u.roles && u.roles.includes(role)).length;
  }

  getPrimaryRole(roles: string[]): string {
    return roles && roles.length > 0 ? roles[0] : 'Unknown';
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.modalError.set('');
    this.userForm.reset({ isActive: true });
    this.userForm.get('password').setValidators([Validators.required]);
    this.userForm.get('roleId').setValidators([Validators.required]);
    this.userForm.updateValueAndValidity();
    this.showModal.set(true);
  }

  openEditModal(user: User): void {
    this.isEditing.set(true);
    this.selectedUser.set(user);
    this.modalError.set('');
    this.userForm.patchValue({
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
    });
    this.userForm.get('password').clearValidators();
    this.userForm.get('roleId').clearValidators();
    this.userForm.updateValueAndValidity();
    this.showModal.set(true);
  }

  openResetModal(user: User): void {
    this.selectedUser.set(user);
    this.resetForm.reset();
    this.showResetModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.modalError.set('');
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.modalError.set('');

    if (this.isEditing()) {
      const payload = {
        fullName: this.userForm.value.fullName,
        phoneNumber: this.userForm.value.phoneNumber,
        isActive: this.userForm.value.isActive === 'true' || this.userForm.value.isActive === true,
      };

      this.http.put<any>(
        `${this.API_URL}/users/${this.selectedUser()?.id}`,
        payload,
        { headers: this.getHeaders() }
      ).subscribe({
        next: (res) => {
          this.isSaving.set(false);
          if (res.success) {
            this.closeModal();
            this.loadUsers();
            this.showToast('User updated successfully');
          } else {
            this.modalError.set(res.message);
          }
        },
        error: (err) => {
          this.isSaving.set(false);
          this.modalError.set(err?.error?.message ?? 'Failed to update user');
        }
      });
    } else {
      const payload = {
        fullName: this.userForm.value.fullName,
        email: this.userForm.value.email,
        password: this.userForm.value.password,
        phoneNumber: this.userForm.value.phoneNumber,
        roleId: parseInt(this.userForm.value.roleId),
      };

      this.http.post<any>(
        `${this.API_URL}/users`,
        payload,
        { headers: this.getHeaders() }
      ).subscribe({
        next: (res) => {
          this.isSaving.set(false);
          if (res.success) {
            this.closeModal();
            this.loadUsers();
            this.showToast('User created successfully');
          } else {
            this.modalError.set(res.message);
          }
        },
        error: (err) => {
          this.isSaving.set(false);
          this.modalError.set(err?.error?.message ?? 'Failed to create user');
        }
      });
    }
  }

  toggleStatus(user: User): void {
    this.http.patch<any>(
      `${this.API_URL}/users/${user.id}/toggle-status`,
      {},
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadUsers();
          this.showToast(res.data);
        }
      }
    });
  }

  resetPassword(): void {
    if (this.resetForm.invalid) return;
    this.isSaving.set(true);

    this.http.patch<any>(
      `${this.API_URL}/users/${this.selectedUser()?.id}/reset-password`,
      { newPassword: this.resetForm.value.newPassword },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.showResetModal.set(false);
          this.showToast('Password reset successfully');
        }
      },
      error: () => this.isSaving.set(false)
    });
  }

  hasError(field: string): boolean {
    const ctrl = this.userForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  showToast(msg: string): void {
    this.toastMsg.set(msg);
    setTimeout(() => this.toastMsg.set(''), 3000);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  getAvatarColor(role: string): string {
    const colors: Record<string, string> = {
      SuperAdmin: '#8b5cf6', HospitalAdmin: '#8b5cf6',
      Doctor: '#3b82f6', Nurse: '#10b981', Patient: '#f59e0b',
      Pharmacist: '#ef4444', LabTechnician: '#06b6d4',
      FinanceStaff: '#84cc16', Receptionist: '#f97316', Mentor: '#ec4899',
    };
    return colors[role] ?? '#64748b';
  }

  getRoleBadgeBg(role: string): string {
    const colors: Record<string, string> = {
      SuperAdmin: '#f3e8ff', HospitalAdmin: '#f3e8ff',
      Doctor: '#dbeafe', Nurse: '#dcfce7', Patient: '#fef3c7',
      Pharmacist: '#fee2e2', LabTechnician: '#cffafe',
      FinanceStaff: '#ecfccb', Receptionist: '#ffedd5', Mentor: '#fce7f3',
    };
    return colors[role] ?? '#f1f5f9';
  }

  getRoleBadgeColor(role: string): string {
    const colors: Record<string, string> = {
      SuperAdmin: '#7c3aed', HospitalAdmin: '#7c3aed',
      Doctor: '#1d4ed8', Nurse: '#15803d', Patient: '#b45309',
      Pharmacist: '#b91c1c', LabTechnician: '#0e7490',
      FinanceStaff: '#4d7c0f', Receptionist: '#c2410c', Mentor: '#be185d',
    };
    return colors[role] ?? '#64748b';
  }

  // ── Department Methods ─────────────────────

  loadDepartments(): void {
    this.deptLoading.set(true);
    this.http.get<any>(`${this.API_URL}/departments`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          this.deptLoading.set(false);
          if (res.success) this.allDepartments.set(res.data);
        },
        error: () => this.deptLoading.set(false)
      });
  }

  openAddDept(): void {
    this.editingDept.set(null);
    this.deptForm.reset({ icon: '🏥', floorNumber: 1 });
    this.showDeptModal.set(true);
  }

  openEditDept(dept: any): void {
    this.editingDept.set(dept);
    this.deptForm.patchValue(dept);
    this.showDeptModal.set(true);
  }

  saveDept(): void {
    if (this.deptForm.invalid) return;
    this.isSaving.set(true);

    const payload = this.deptForm.value;
    const isEdit = !!this.editingDept();
    const url = isEdit
      ? `${this.API_URL}/departments/${this.editingDept().id}`
      : `${this.API_URL}/departments`;
    const req = isEdit
      ? this.http.put<any>(url, payload, { headers: this.getHeaders() })
      : this.http.post<any>(url, payload, { headers: this.getHeaders() });

    req.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.showDeptModal.set(false);
          this.loadDepartments();
          this.showToast(isEdit ? 'Department updated' : 'Department added');
        }
      },
      error: () => this.isSaving.set(false)
    });
  }

  toggleDept(dept: any): void {
    this.http.patch<any>(
      `${this.API_URL}/departments/${dept.id}/toggle`,
      {},
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadDepartments();
          this.showToast(res.message);
        }
      }
    });
  }

  // ── Doctor Methods ──────────────────────────

  loadDoctors(): void {
    this.doctorLoading.set(true);
    this.http.get<any>(`${this.API_URL}/doctors`, { headers: this.getHeaders() })
      .subscribe({
        next: (res) => {
          this.doctorLoading.set(false);
          if (res.success) this.allDoctors.set(res.data);
        },
        error: () => this.doctorLoading.set(false)
      });
  }

  openAddDoctor(): void {
    this.editingDoctor.set(null);
    this.modalError.set('');
    this.selectedDays.set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    this.doctorForm.reset({
      slotDurationMinutes: 15,
      morningStart: '09:00',
      morningEnd: '13:00',
      hasEveningShift: false,
      eveningStart: '17:00',
      eveningEnd: '20:00',
      maxPatientsPerDay: 30,
      consultationFee: 500,
    });
    // Load doctor users who don't have profiles yet
    const usersWithProfile = this.allDoctors().map(d => d.userId);
    this.doctorUsers.set(
      this.allUsers().filter(u =>
        (u.roles && (u.roles.includes('Doctor') || u.roles.includes('Mentor'))) &&
        !usersWithProfile.includes(u.id)
      )
    );
    this.showDoctorModal.set(true);
  }

  openEditDoctor(doc: any): void {
    this.editingDoctor.set(doc);
    this.modalError.set('');
    this.selectedDays.set(doc.availableDays.split(','));
    this.doctorForm.patchValue({
      departmentId: doc.departmentId,
      specialization: doc.specialization,
      qualification: doc.qualification,
      experienceYears: doc.experienceYears,
      consultationFee: doc.consultationFee,
      slotDurationMinutes: doc.slotDurationMinutes,
      morningStart: doc.morningStart?.substring(0, 5),
      morningEnd: doc.morningEnd?.substring(0, 5),
      hasEveningShift: doc.hasEveningShift,
      eveningStart: doc.eveningStart?.substring(0, 5),
      eveningEnd: doc.eveningEnd?.substring(0, 5),
      maxPatientsPerDay: doc.maxPatientsPerDay,
      bio: doc.bio,
    });
    this.showDoctorModal.set(true);
  }

  saveDoctor(): void {
    this.isSaving.set(true);
    this.modalError.set('');

    const val = this.doctorForm.value;
    const payload = {
      ...val,
      availableDays: this.selectedDays().join(','),
      userId: this.editingDoctor() ? this.editingDoctor().userId : parseInt(val.userId),
      departmentId: parseInt(val.departmentId),
    };

    const isEdit = !!this.editingDoctor();
    const url = isEdit
      ? `${this.API_URL}/doctors/${this.editingDoctor().id}`
      : `${this.API_URL}/doctors`;
    const req = isEdit
      ? this.http.put<any>(url, payload, { headers: this.getHeaders() })
      : this.http.post<any>(url, payload, { headers: this.getHeaders() });

    req.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.showDoctorModal.set(false);
          this.loadDoctors();
          this.showToast(isEdit ? 'Profile updated' : 'Doctor profile created');
        } else {
          this.modalError.set(res.message);
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.modalError.set(err?.error?.message ?? 'Failed to save');
      }
    });
  }

  isDaySelected(day: string): boolean {
    return this.selectedDays().includes(day);
  }

  toggleDay(day: string): void {
    const current = this.selectedDays();
    if (current.includes(day)) {
      this.selectedDays.set(current.filter(d => d !== day));
    } else {
      this.selectedDays.set([...current, day]);
    }
  }

  // ── Add Button Handler ──────────────────────
  onAddClick(): void {
    if (this.activePage() === 'users') this.openCreateModal();
    else if (this.activePage() === 'departments') this.openAddDept();
    else if (this.activePage() === 'doctors') this.openAddDoctor();
  }

}