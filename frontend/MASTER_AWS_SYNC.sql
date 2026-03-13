-- ==========================================================
-- 🚀 MEDICORE "MASTER SYNC" DATABASE SCRIPT (RDS)
-- This script will:
-- 1. DROP all existing tables to avoid conflicts
-- 2. CREATE the entire healthy schema
-- 3. SEED default Roles and Departments
-- 4. 👤 SEED Super Admin Account: jaswanth5464@gmail.com
-- ==========================================================

-- 1️⃣ CLEANUP: Drop all existing tables
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

-- 2️⃣ INITIALIZE: Migration History
CREATE TABLE [__EFMigrationsHistory] (
    [MigrationId] nvarchar(150) NOT NULL,
    [ProductVersion] nvarchar(32) NOT NULL,
    CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
);
GO

-- 3️⃣ CREATE TABLES
CREATE TABLE [Roles] (
    [Id] int NOT NULL IDENTITY, [Name] nvarchar(max) NOT NULL, [Description] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [Users] (
    [Id] int NOT NULL IDENTITY, [FullName] nvarchar(max) NOT NULL, [Email] nvarchar(max) NOT NULL,
    [PasswordHash] nvarchar(max) NOT NULL, [PhoneNumber] nvarchar(max) NOT NULL, [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL, CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [UserRoles] (
    [UserId] int NOT NULL, [RoleId] int NOT NULL,
    CONSTRAINT [PK_UserRoles] PRIMARY KEY ([UserId], [RoleId]),
    CONSTRAINT [FK_UserRoles_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_UserRoles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [Departments] (
    [Id] int NOT NULL IDENTITY, [Name] nvarchar(max) NOT NULL, [Description] nvarchar(max) NOT NULL,
    [Icon] nvarchar(max) NOT NULL, [FloorNumber] int NOT NULL, [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL, CONSTRAINT [PK_Departments] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [DoctorProfiles] (
    [Id] int NOT NULL IDENTITY, [UserId] int NOT NULL, [DepartmentId] int NOT NULL,
    [Specialization] nvarchar(max) NOT NULL, [Qualification] nvarchar(max) NOT NULL,
    [ExperienceYears] int NOT NULL, [ConsultationFee] decimal(18,2) NOT NULL,
    [AvailableDays] nvarchar(max) NOT NULL, [MorningStart] time NOT NULL, [MorningEnd] time NOT NULL,
    [HasEveningShift] bit NOT NULL, [SlotDurationMinutes] int NOT NULL, [MaxPatientsPerDay] int NOT NULL,
    [Bio] nvarchar(max) NOT NULL, [IsActive] bit NOT NULL, [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_DoctorProfiles] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_DoctorProfiles_Departments_DepartmentId] FOREIGN KEY ([DepartmentId]) REFERENCES [Departments] ([Id]),
    CONSTRAINT [FK_DoctorProfiles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])
);
GO

CREATE TABLE [Appointments] (
    [Id] int NOT NULL IDENTITY, [TokenNumber] nvarchar(max) NOT NULL, [PatientUserId] int NOT NULL,
    [DoctorProfileId] int NOT NULL, [DepartmentId] int NOT NULL, [AppointmentDate] datetime2 NOT NULL,
    [TimeSlot] time NOT NULL, [Status] nvarchar(max) NOT NULL, [ConsultationFee] decimal(18,2) NOT NULL,
    [PaymentStatus] nvarchar(max) NOT NULL, [CreatedAt] datetime2 NOT NULL, [Symptoms] nvarchar(max) NOT NULL,
    [IsFirstVisit] bit NOT NULL, [VisitType] nvarchar(max) NOT NULL, [QueuePosition] int NOT NULL DEFAULT 0,
    CONSTRAINT [PK_Appointments] PRIMARY KEY ([Id])
);
GO

-- 4️⃣ SEED ROLES
SET IDENTITY_INSERT [Roles] ON;
INSERT INTO [Roles] ([Id], [Description], [Name]) VALUES 
(1, N'Full system access', N'SuperAdmin'), (2, N'Hospital management access', N'HospitalAdmin'),
(3, N'Front desk operations', N'Receptionist'), (4, N'Medical consultation access', N'Doctor'),
(5, N'Ward management access', N'Nurse'), (6, N'Pharmacy management access', N'Pharmacist'),
(7, N'Laboratory access', N'LabTechnician'), (8, N'Billing and finance access', N'FinanceStaff'),
(9, N'Patient mentoring access', N'Mentor'), (10, N'Patient portal access', N'Patient');
SET IDENTITY_INSERT [Roles] OFF;
GO

-- 5️⃣ SEED DEPARTMENTS
SET IDENTITY_INSERT [Departments] ON;
INSERT INTO [Departments] ([Id], [CreatedAt], [Description], [FloorNumber], [Icon], [IsActive], [Name]) VALUES 
(1, GETDATE(), N'General health consultations', 1, N'🏥', 1, N'General Medicine'),
(2, GETDATE(), N'Heart care', 2, N'❤️', 1, N'Cardiology'),
(3, GETDATE(), N'Brain care', 2, N'🧠', 1, N'Neurology'),
(4, GETDATE(), N'Bone care', 3, N'🦴', 1, N'Orthopedics'),
(5, GETDATE(), N'Children care', 1, N'👶', 1, N'Pediatrics');
SET IDENTITY_INSERT [Departments] OFF;
GO

-- 6️⃣ 👤 SEED SUPER ADMIN USER
SET IDENTITY_INSERT [Users] ON;
INSERT INTO [Users] ([Id], [FullName], [Email], [PasswordHash], [PhoneNumber], [IsActive], [CreatedAt])
VALUES (1, N'Jaswanth', N'jaswanth5464@gmail.com', N'$2a$11$KEybf9HE082BxsmAJ0xkBOGcxm5NDhwXF0X4jix7luT1u2PfcXwyO', N'9293405122', 1, GETDATE());
SET IDENTITY_INSERT [Users] OFF;

INSERT INTO [UserRoles] ([UserId], [RoleId]) VALUES (1, 1);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES (N'20260311132828_Initial', N'8.0.0');
GO
