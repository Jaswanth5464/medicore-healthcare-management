-- ==========================================================
-- 🚀 MEDICORE "FRESH START" DATABASE SYNC SCRIPT
-- This script will:
-- 1. DROP all existing tables to avoid conflicts
-- 2. CREATE the entire schema from scratch
-- 3. SEED default Roles and Departments
-- ==========================================================

-- 1️⃣ CLEANUP: Drop all existing tables (Ordering handles Foreign Keys)
IF OBJECT_ID(N'[AuditLogs]') IS NOT NULL DROP TABLE [AuditLogs];
IF OBJECT_ID(N'[RefreshTokens]') IS NOT NULL DROP TABLE [RefreshTokens];
IF OBJECT_ID(N'[UserRoles]') IS NOT NULL DROP TABLE [UserRoles];
IF OBJECT_ID(N'[DoctorLeaves]') IS NOT NULL DROP TABLE [DoctorLeaves];
IF OBJECT_ID(N'[PatientProfiles]') IS NOT NULL DROP TABLE [PatientProfiles];
IF OBJECT_ID(N'[Medicines]') IS NOT NULL DROP TABLE [Medicines];
IF OBJECT_ID(N'[Vitals]') IS NOT NULL DROP TABLE [Vitals];
IF OBJECT_ID(N'[Prescriptions]') IS NOT NULL DROP TABLE [Prescriptions];
IF OBJECT_ID(N'[LabOrders]') IS NOT NULL DROP TABLE [LabOrders];
IF OBJECT_ID(N'[Bills]') IS NOT NULL DROP TABLE [Bills];
IF OBJECT_ID(N'[Appointments]') IS NOT NULL DROP TABLE [Appointments];
IF OBJECT_ID(N'[AppointmentRequests]') IS NOT NULL DROP TABLE [AppointmentRequests];
IF OBJECT_ID(N'[OtpRecords]') IS NOT NULL DROP TABLE [OtpRecords];
IF OBJECT_ID(N'[DoctorProfiles]') IS NOT NULL DROP TABLE [DoctorProfiles];
IF OBJECT_ID(N'[Departments]') IS NOT NULL DROP TABLE [Departments];
IF OBJECT_ID(N'[Users]') IS NOT NULL DROP TABLE [Users];
IF OBJECT_ID(N'[Roles]') IS NOT NULL DROP TABLE [Roles];
IF OBJECT_ID(N'[LabTestMasters]') IS NOT NULL DROP TABLE [LabTestMasters];
IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NOT NULL DROP TABLE [__EFMigrationsHistory];
GO

-- 2️⃣ INITIALIZE: Recreate Migration History
IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

-- 3️⃣ CREATE TABLES AND SEED DATA (Full Schema)
BEGIN TRANSACTION;
GO

CREATE TABLE [Roles] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [Users] (
    [Id] int NOT NULL IDENTITY,
    [FullName] nvarchar(max) NOT NULL,
    [Email] nvarchar(max) NOT NULL,
    [PasswordHash] nvarchar(max) NOT NULL,
    [PhoneNumber] nvarchar(max) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [RefreshTokens] (
    [Id] int NOT NULL IDENTITY,
    [Token] nvarchar(max) NOT NULL,
    [UserId] int NOT NULL,
    [ExpiresAt] datetime2 NOT NULL,
    [IsRevoked] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_RefreshTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [Departments] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [Icon] nvarchar(max) NOT NULL,
    [FloorNumber] int NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Departments] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [DoctorProfiles] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [DepartmentId] int NOT NULL,
    [Specialization] nvarchar(max) NOT NULL,
    [Qualification] nvarchar(max) NOT NULL,
    [ExperienceYears] int NOT NULL,
    [ConsultationFee] decimal(18,2) NOT NULL,
    [AvailableDays] nvarchar(max) NOT NULL,
    [MorningStart] time NOT NULL,
    [MorningEnd] time NOT NULL,
    [HasEveningShift] bit NOT NULL,
    [EveningStart] time NULL,
    [EveningEnd] time NULL,
    [SlotDurationMinutes] int NOT NULL,
    [MaxPatientsPerDay] int NOT NULL,
    [Bio] nvarchar(max) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_DoctorProfiles] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_DoctorProfiles_Departments_DepartmentId] FOREIGN KEY ([DepartmentId]) REFERENCES [Departments] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_DoctorProfiles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [UserRoles] (
    [UserId] int NOT NULL,
    [RoleId] int NOT NULL,
    CONSTRAINT [PK_UserRoles] PRIMARY KEY ([UserId], [RoleId]),
    CONSTRAINT [FK_UserRoles_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_UserRoles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [AppointmentRequests] (
    [Id] int NOT NULL IDENTITY,
    [ReferenceNumber] nvarchar(max) NOT NULL,
    [FullName] nvarchar(max) NOT NULL,
    [Phone] nvarchar(max) NOT NULL,
    [Email] nvarchar(max) NOT NULL,
    [Age] int NOT NULL,
    [Gender] nvarchar(max) NOT NULL,
    [PreferredDepartmentId] int NULL,
    [Symptoms] nvarchar(max) NOT NULL,
    [PreferredDate] datetime2 NULL,
    [VisitType] nvarchar(max) NOT NULL,
    [IsFirstVisit] bit NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [RejectionReason] nvarchar(max) NULL,
    [ReceptionistNotes] nvarchar(max) NULL,
    [HandledByUserId] int NULL,
    [HandledAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_AppointmentRequests] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [Appointments] (
    [Id] int NOT NULL IDENTITY,
    [TokenNumber] nvarchar(max) NOT NULL,
    [PatientUserId] int NOT NULL,
    [DoctorProfileId] int NOT NULL,
    [DepartmentId] int NOT NULL,
    [AppointmentDate] datetime2 NOT NULL,
    [TimeSlot] time NOT NULL,
    [VisitType] nvarchar(max) NOT NULL,
    [Symptoms] nvarchar(max) NOT NULL,
    [IsFirstVisit] bit NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [ConsultationFee] decimal(18,2) NOT NULL,
    [PaymentStatus] nvarchar(max) NOT NULL,
    [PaymentMode] nvarchar(max) NULL,
    [RazorpayOrderId] nvarchar(max) NULL,
    [RazorpayPaymentId] nvarchar(max) NULL,
    [AppointmentRequestId] int NULL,
    [DoctorNotes] nvarchar(max) NULL,
    [ReceptionistNotes] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CheckedInAt] datetime2 NULL,
    [CompletedAt] datetime2 NULL,
    [ConsultationStartedAt] datetime2 NULL,
    [QueuePosition] int NOT NULL DEFAULT 0,
    CONSTRAINT [PK_Appointments] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Appointments_Departments_DepartmentId] FOREIGN KEY ([DepartmentId]) REFERENCES [Departments] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Appointments_DoctorProfiles_DoctorProfileId] FOREIGN KEY ([DoctorProfileId]) REFERENCES [DoctorProfiles] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Appointments_Users_PatientUserId] FOREIGN KEY ([PatientUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
);
GO

CREATE TABLE [Bills] (
    [Id] int NOT NULL IDENTITY,
    [BillNumber] nvarchar(max) NOT NULL,
    [AppointmentId] int NOT NULL,
    [PatientUserId] int NOT NULL,
    [DoctorProfileId] int NOT NULL,
    [Items] nvarchar(max) NOT NULL,
    [SubTotal] decimal(18,2) NOT NULL,
    [GSTPercent] decimal(18,2) NOT NULL,
    [GSTAmount] decimal(18,2) NOT NULL,
    [Discount] decimal(18,2) NOT NULL,
    [InsuranceDeduction] decimal(18,2) NOT NULL,
    [TotalAmount] decimal(18,2) NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [PaymentMode] nvarchar(max) NULL,
    [RazorpayOrderId] nvarchar(max) NULL,
    [RazorpayPaymentId] nvarchar(max) NULL,
    [PaidAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Bills] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Bills_Appointments_AppointmentId] FOREIGN KEY ([AppointmentId]) REFERENCES [Appointments] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [LabOrders] (
    [Id] int NOT NULL IDENTITY,
    [AppointmentId] int NOT NULL,
    [PatientUserId] int NOT NULL,
    [DoctorProfileId] int NOT NULL,
    [TestType] nvarchar(max) NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [ReportUrl] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CompletedAt] datetime2 NULL,
    [Notes] nvarchar(max) NULL,
    [ResultNotes] nvarchar(max) NULL,
    [CriticalAlert] bit NOT NULL DEFAULT 0,
    CONSTRAINT [PK_LabOrders] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_LabOrders_Appointments_AppointmentId] FOREIGN KEY ([AppointmentId]) REFERENCES [Appointments] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [Prescriptions] (
    [Id] int NOT NULL IDENTITY,
    [AppointmentId] int NOT NULL,
    [PatientUserId] int NOT NULL,
    [DoctorProfileId] int NOT NULL,
    [Diagnosis] nvarchar(max) NOT NULL,
    [MedicinesJson] nvarchar(max) NOT NULL,
    [FollowUpDate] datetime2 NULL,
    [Notes] nvarchar(max) NULL,
    [PdfUrl] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [Advice] nvarchar(max) NULL,
    [DispensedAt] datetime2 NULL,
    [IsDispensed] bit NOT NULL DEFAULT 0,
    [DietPlan] nvarchar(max) NULL,
    CONSTRAINT [PK_Prescriptions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Prescriptions_Appointments_AppointmentId] FOREIGN KEY ([AppointmentId]) REFERENCES [Appointments] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [Vitals] (
    [Id] int NOT NULL IDENTITY,
    [AppointmentId] int NOT NULL,
    [PatientUserId] int NOT NULL,
    [BloodPressureSystolic] int NULL,
    [BloodPressureDiastolic] int NULL,
    [Pulse] int NULL,
    [Temperature] decimal(18,2) NULL,
    [SpO2] int NULL,
    [Weight] decimal(18,2) NULL,
    [Height] decimal(18,2) NULL,
    [RecordedById] int NOT NULL,
    [RecordedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Vitals] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [DoctorLeaves] (
    [Id] int NOT NULL IDENTITY,
    [DoctorProfileId] int NOT NULL,
    [StartDate] datetime2 NOT NULL,
    [EndDate] datetime2 NOT NULL,
    [Reason] nvarchar(max) NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_DoctorLeaves] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_DoctorLeaves_DoctorProfiles_DoctorProfileId] FOREIGN KEY ([DoctorProfileId]) REFERENCES [DoctorProfiles] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [PatientProfiles] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [BloodGroup] nvarchar(max) NOT NULL,
    [Allergies] nvarchar(max) NOT NULL,
    [ChronicConditions] nvarchar(max) NOT NULL,
    [EmergencyContactName] nvarchar(max) NOT NULL,
    [EmergencyContactPhone] nvarchar(max) NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_PatientProfiles] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PatientProfiles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [AuditLogs] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NULL,
    [Action] nvarchar(max) NOT NULL,
    [Module] nvarchar(max) NOT NULL,
    [Details] nvarchar(max) NOT NULL,
    [IPAddress] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [LabTestMasters] (
    [Id] int NOT NULL IDENTITY,
    [TestName] nvarchar(200) NOT NULL,
    [NormalRange] nvarchar(200) NOT NULL,
    [Price] decimal(18,2) NOT NULL,
    [TurnaroundTimeHours] int NOT NULL,
    [IsActive] bit NOT NULL,
    CONSTRAINT [PK_LabTestMasters] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [Medicines] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(200) NOT NULL,
    [GenericName] nvarchar(200) NOT NULL,
    [Category] nvarchar(100) NOT NULL,
    [Manufacturer] nvarchar(200) NOT NULL,
    [Price] decimal(18,2) NOT NULL,
    [StockQuantity] int NOT NULL,
    [LowStockThreshold] int NOT NULL,
    [ExpiryDate] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Medicines] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [OtpRecords] (
    [Id] int NOT NULL IDENTITY,
    [Email] nvarchar(max) NOT NULL,
    [OtpCode] nvarchar(max) NOT NULL,
    [ExpiryTime] datetime2 NOT NULL,
    [IsUsed] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_OtpRecords] PRIMARY KEY ([Id])
);
GO

-- 4️⃣ SEED DATA
SET IDENTITY_INSERT [Roles] ON;
INSERT INTO [Roles] ([Id], [Description], [Name]) VALUES 
(1, N'Full system access', N'SuperAdmin'),
(2, N'Hospital management access', N'HospitalAdmin'),
(3, N'Front desk operations', N'Receptionist'),
(4, N'Medical consultation access', N'Doctor'),
(5, N'Ward management access', N'Nurse'),
(6, N'Pharmacy management access', N'Pharmacist'),
(7, N'Laboratory access', N'LabTechnician'),
(8, N'Billing and finance access', N'FinanceStaff'),
(9, N'Patient mentoring access', N'Mentor'),
(10, N'Patient portal access', N'Patient');
SET IDENTITY_INSERT [Roles] OFF;
GO

SET IDENTITY_INSERT [Departments] ON;
INSERT INTO [Departments] ([Id], [CreatedAt], [Description], [FloorNumber], [Icon], [IsActive], [Name]) VALUES 
(1, '2026-03-12T00:00:00Z', N'General health consultations', 1, N'🏥', 1, N'General Medicine'),
(2, '2026-03-12T00:00:00Z', N'Heart care', 2, N'❤️', 1, N'Cardiology'),
(3, '2026-03-12T00:00:00Z', N'Brain care', 2, N'🧠', 1, N'Neurology'),
(4, '2026-03-12T00:00:00Z', N'Bone care', 3, N'🦴', 1, N'Orthopedics'),
(5, '2026-03-12T00:00:00Z', N'Children care', 1, N'👶', 1, N'Pediatrics'),
(6, '2026-03-12T00:00:00Z', N'Women health', 4, N'🌸', 1, N'Gynecology'),
(7, '2026-03-12T00:00:00Z', N'Skin care', 2, N'✨', 1, N'Dermatology'),
(8, '2026-03-12T00:00:00Z', N'Eye care', 1, N'👁️', 1, N'Ophthalmology'),
(9, '2026-03-12T00:00:00Z', N'Ear nose throat', 3, N'👂', 1, N'ENT'),
(10, '2026-03-12T00:00:00Z', N'Mental health', 4, N'🧘', 1, N'Psychiatry');
SET IDENTITY_INSERT [Departments] OFF;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260311132828_Phase2EntitiesFixed', N'8.0.0');

COMMIT;
GO
