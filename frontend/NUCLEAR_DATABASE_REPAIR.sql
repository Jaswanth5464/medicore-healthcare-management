-- ==========================================================
-- ☢️ NUCLEAR MEDICORE DATABASE REPAIR SCRIPT (FOR RDS)
-- ==========================================================
USE [MediCoreDB];
GO

-- 1️⃣ WIPE EVERYTHING (Strict Dependency Order)
PRINT '🧹 Wiping existing tables...';
IF OBJECT_ID(N'[dbo].[AuditLogs]') IS NOT NULL DROP TABLE [dbo].[AuditLogs];
IF OBJECT_ID(N'[dbo].[RefreshTokens]') IS NOT NULL DROP TABLE [dbo].[RefreshTokens];
IF OBJECT_ID(N'[dbo].[UserRoles]') IS NOT NULL DROP TABLE [dbo].[UserRoles];
IF OBJECT_ID(N'[dbo].[DoctorLeaves]') IS NOT NULL DROP TABLE [dbo].[DoctorLeaves];
IF OBJECT_ID(N'[dbo].[Medicines]') IS NOT NULL DROP TABLE [dbo].[Medicines];
IF OBJECT_ID(N'[dbo].[Vitals]') IS NOT NULL DROP TABLE [dbo].[Vitals];
IF OBJECT_ID(N'[dbo].[Prescriptions]') IS NOT NULL DROP TABLE [dbo].[Prescriptions];
IF OBJECT_ID(N'[dbo].[LabOrders]') IS NOT NULL DROP TABLE [dbo].[LabOrders];
IF OBJECT_ID(N'[dbo].[Bills]') IS NOT NULL DROP TABLE [dbo].[Bills];
IF OBJECT_ID(N'[dbo].[Appointments]') IS NOT NULL DROP TABLE [dbo].[Appointments];
IF OBJECT_ID(N'[dbo].[AppointmentRequests]') IS NOT NULL DROP TABLE [dbo].[AppointmentRequests];
IF OBJECT_ID(N'[dbo].[OtpRecords]') IS NOT NULL DROP TABLE [dbo].[OtpRecords];
IF OBJECT_ID(N'[dbo].[DoctorProfiles]') IS NOT NULL DROP TABLE [dbo].[DoctorProfiles];
IF OBJECT_ID(N'[dbo].[PatientProfiles]') IS NOT NULL DROP TABLE [dbo].[PatientProfiles];
IF OBJECT_ID(N'[dbo].[Departments]') IS NOT NULL DROP TABLE [dbo].[Departments];
IF OBJECT_ID(N'[dbo].[Users]') IS NOT NULL DROP TABLE [dbo].[Users];
IF OBJECT_ID(N'[dbo].[Roles]') IS NOT NULL DROP TABLE [dbo].[Roles];
IF OBJECT_ID(N'[dbo].[LabTestMasters]') IS NOT NULL DROP TABLE [dbo].[LabTestMasters];
IF OBJECT_ID(N'[dbo].[__EFMigrationsHistory]') IS NOT NULL DROP TABLE [dbo].[__EFMigrationsHistory];
GO

-- 2️⃣ CREATE ESSENTIAL TABLES
PRINT '🏗️ Rebuilding schema...';

CREATE TABLE [dbo].[__EFMigrationsHistory] (
    [MigrationId] nvarchar(150) NOT NULL,
    [ProductVersion] nvarchar(32) NOT NULL,
    CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
);

CREATE TABLE [dbo].[Roles] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
);

CREATE TABLE [dbo].[Users] (
    [Id] int NOT NULL IDENTITY,
    [FullName] nvarchar(max) NOT NULL,
    [Email] nvarchar(max) NOT NULL,
    [PasswordHash] nvarchar(max) NOT NULL,
    [PhoneNumber] nvarchar(max) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
);

CREATE TABLE [dbo].[UserRoles] (
    [UserId] int NOT NULL,
    [RoleId] int NOT NULL,
    CONSTRAINT [PK_UserRoles] PRIMARY KEY ([UserId], [RoleId]),
    CONSTRAINT [FK_UserRoles_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [dbo].[Roles] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_UserRoles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [dbo].[RefreshTokens] (
    [Id] int NOT NULL IDENTITY,
    [Token] nvarchar(max) NOT NULL,
    [UserId] int NOT NULL,
    [ExpiresAt] datetime2 NOT NULL,
    [IsRevoked] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_RefreshTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [dbo].[Departments] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [Icon] nvarchar(max) NOT NULL,
    [FloorNumber] int NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Departments] PRIMARY KEY ([Id])
);

CREATE TABLE [dbo].[DoctorProfiles] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [DepartmentId] int NOT NULL,
    [Specialization] nvarchar(max) NOT NULL,
    [Qualification] nvarchar(max) NOT NULL,
    [ExperienceYears] int NOT NULL,
    [Bio] nvarchar(max) NOT NULL,
    [ConsultationFee] decimal(18,2) NOT NULL,
    [MorningStart] time NOT NULL,
    [MorningEnd] time NOT NULL,
    [HasEveningShift] bit NOT NULL,
    [EveningStart] time NULL,
    [EveningEnd] time NULL,
    [SlotDurationMinutes] int NOT NULL,
    [MaxPatientsPerDay] int NOT NULL,
    [AvailableDays] nvarchar(max) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_DoctorProfiles] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_DoctorProfiles_Departments_DepartmentId] FOREIGN KEY ([DepartmentId]) REFERENCES [dbo].[Departments] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_DoctorProfiles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [dbo].[Appointments] (
    [Id] int NOT NULL IDENTITY,
    [PatientUserId] int NOT NULL,
    [DoctorProfileId] int NOT NULL,
    [DepartmentId] int NOT NULL,
    [AppointmentDate] datetime2 NOT NULL,
    [TimeSlot] time NOT NULL,
    [VisitType] nvarchar(max) NOT NULL,
    [Symptoms] nvarchar(max) NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [TokenNumber] nvarchar(max) NOT NULL,
    [QueuePosition] int NOT NULL,
    [ConsultationFee] decimal(18,2) NOT NULL,
    [PaymentStatus] nvarchar(max) NOT NULL,
    [PaymentMode] nvarchar(max) NULL,
    [RazorpayOrderId] nvarchar(max) NULL,
    [RazorpayPaymentId] nvarchar(max) NULL,
    [ReceptionistNotes] nvarchar(max) NULL,
    [DoctorNotes] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    [CheckedInAt] datetime2 NULL,
    [ConsultationStartedAt] datetime2 NULL,
    [CompletedAt] datetime2 NULL,
    [IsFirstVisit] bit NOT NULL,
    [AppointmentRequestId] int NULL,
    CONSTRAINT [PK_Appointments] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Appointments_Departments_DepartmentId] FOREIGN KEY ([DepartmentId]) REFERENCES [dbo].[Departments] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Appointments_DoctorProfiles_DoctorProfileId] FOREIGN KEY ([DoctorProfileId]) REFERENCES [dbo].[DoctorProfiles] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Appointments_Users_PatientUserId] FOREIGN KEY ([PatientUserId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE NO ACTION
);

-- ADDING REMAINING TABLES FOR SAFETY
CREATE TABLE [dbo].[AuditLogs] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NULL,
    [Action] nvarchar(max) NOT NULL,
    [Module] nvarchar(max) NOT NULL,
    [Details] nvarchar(max) NOT NULL,
    [IPAddress] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
);

CREATE TABLE [dbo].[AppointmentRequests] (
    [Id] int NOT NULL IDENTITY,
    [FullName] nvarchar(max) NOT NULL,
    [Email] nvarchar(max) NOT NULL,
    [Phone] nvarchar(max) NOT NULL,
    [Age] int NOT NULL,
    [Gender] nvarchar(max) NOT NULL,
    [PreferredDepartmentId] int NULL,
    [PreferredDate] datetime2 NULL,
    [Symptoms] nvarchar(max) NOT NULL,
    [VisitType] nvarchar(max) NOT NULL,
    [IsFirstVisit] bit NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [ReferenceNumber] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [HandledByUserId] int NULL,
    [HandledAt] datetime2 NULL,
    [ReceptionistNotes] nvarchar(max) NULL,
    [RejectionReason] nvarchar(max) NULL,
    CONSTRAINT [PK_AppointmentRequests] PRIMARY KEY ([Id])
);

CREATE TABLE [dbo].[DoctorLeaves] (
    [Id] int NOT NULL IDENTITY,
    [DoctorProfileId] int NOT NULL,
    [StartDate] datetime2 NOT NULL,
    [EndDate] datetime2 NOT NULL,
    [Reason] nvarchar(max) NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_DoctorLeaves] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_DoctorLeaves_DoctorProfiles_DoctorProfileId] FOREIGN KEY ([DoctorProfileId]) REFERENCES [dbo].[DoctorProfiles] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [dbo].[LabTestMasters] (
    [Id] int NOT NULL IDENTITY,
    [TestName] nvarchar(200) NOT NULL,
    [NormalRange] nvarchar(200) NOT NULL,
    [Price] decimal(18,2) NOT NULL,
    [TurnaroundTimeHours] int NOT NULL,
    [IsActive] bit NOT NULL,
    CONSTRAINT [PK_LabTestMasters] PRIMARY KEY ([Id])
);

CREATE TABLE [dbo].[LabOrders] (
    [Id] int NOT NULL IDENTITY,
    [AppointmentId] int NOT NULL,
    [PatientUserId] int NOT NULL,
    [DoctorProfileId] int NOT NULL,
    [TestType] nvarchar(max) NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [Notes] nvarchar(max) NULL,
    [ResultNotes] nvarchar(max) NULL,
    [ReportUrl] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [CompletedAt] datetime2 NULL,
    [CriticalAlert] bit NOT NULL,
    CONSTRAINT [PK_LabOrders] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_LabOrders_Appointments_AppointmentId] FOREIGN KEY ([AppointmentId]) REFERENCES [dbo].[Appointments] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [dbo].[Prescriptions] (
    [Id] int NOT NULL IDENTITY,
    [AppointmentId] int NOT NULL,
    [PatientUserId] int NOT NULL,
    [DoctorProfileId] int NOT NULL,
    [Diagnosis] nvarchar(max) NOT NULL,
    [MedicinesJson] nvarchar(max) NOT NULL,
    [DietPlan] nvarchar(max) NULL,
    [Advice] nvarchar(max) NULL,
    [FollowUpDate] datetime2 NULL,
    [Notes] nvarchar(max) NULL,
    [IsDispensed] bit NOT NULL,
    [DispensedAt] datetime2 NULL,
    [PdfUrl] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Prescriptions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Prescriptions_Appointments_AppointmentId] FOREIGN KEY ([AppointmentId]) REFERENCES [dbo].[Appointments] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [dbo].[Bills] (
    [Id] int NOT NULL IDENTITY,
    [BillNumber] nvarchar(max) NOT NULL,
    [AppointmentId] int NOT NULL,
    [PatientUserId] int NOT NULL,
    [DoctorProfileId] int NOT NULL,
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
    [Items] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_Bills] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Bills_Appointments_AppointmentId] FOREIGN KEY ([AppointmentId]) REFERENCES [dbo].[Appointments] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [dbo].[Medicines] (
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

CREATE TABLE [dbo].[OtpRecords] (
    [Id] int NOT NULL IDENTITY,
    [Email] nvarchar(max) NOT NULL,
    [OtpCode] nvarchar(max) NOT NULL,
    [ExpiryTime] datetime2 NOT NULL,
    [IsUsed] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_OtpRecords] PRIMARY KEY ([Id])
);

CREATE TABLE [dbo].[Vitals] (
    [Id] int NOT NULL IDENTITY,
    [AppointmentId] int NOT NULL,
    [PatientUserId] int NOT NULL,
    [RecordedById] int NOT NULL,
    [RecordedAt] datetime2 NOT NULL,
    [Temperature] decimal(18,2) NULL,
    [BloodPressureSystolic] int NULL,
    [BloodPressureDiastolic] int NULL,
    [Pulse] int NULL,
    [SpO2] int NULL,
    [Weight] decimal(18,2) NULL,
    [Height] decimal(18,2) NULL,
    CONSTRAINT [PK_Vitals] PRIMARY KEY ([Id])
);

CREATE TABLE [dbo].[PatientProfiles] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [BloodGroup] nvarchar(max) NOT NULL,
    [Allergies] nvarchar(max) NOT NULL,
    [ChronicConditions] nvarchar(max) NOT NULL,
    [EmergencyContactName] nvarchar(max) NOT NULL,
    [EmergencyContactPhone] nvarchar(max) NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_PatientProfiles] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PatientProfiles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE CASCADE
);
GO

-- 3️⃣ SEED DATA
PRINT '🌱 Seeding definitive data...';

SET IDENTITY_INSERT [dbo].[Roles] ON;
INSERT INTO [dbo].[Roles] ([Id], [Description], [Name]) VALUES 
(1, N'Full system access', N'SuperAdmin'),
(2, N'Hospital management access', N'HospitalAdmin'),
(3, N'Front desk operations', N'Receptionist'),
(4, N'Medical consultation access', N'Doctor'),
(5, N'Ward management access', N'Nurse'),
(6, N'Pharmacist management access', N'Pharmacist'),
(7, N'Laboratory access', N'LabTechnician'),
(8, N'Billing and finance access', N'FinanceStaff'),
(9, N'Patient mentoring access', N'Mentor'),
(10, N'Patient portal access', N'Patient');
SET IDENTITY_INSERT [dbo].[Roles] OFF;

SET IDENTITY_INSERT [dbo].[Departments] ON;
INSERT INTO [dbo].[Departments] ([Id], [CreatedAt], [Description], [FloorNumber], [Icon], [IsActive], [Name]) VALUES 
(1, GETDATE(), N'General health consultations', 1, N'🏥', 1, N'General Medicine'),
(2, GETDATE(), N'Heart care', 2, N'❤️', 1, N'Cardiology'),
(3, GETDATE(), N'Brain care', 2, N'🧠', 1, N'Neurology'),
(4, GETDATE(), N'Bone care', 3, N'🦴', 1, N'Orthopedics'),
(5, GETDATE(), N'Children care', 1, N'👶', 1, N'Pediatrics'),
(6, GETDATE(), N'Women health', 4, N'🌸', 1, N'Gynecology'),
(7, GETDATE(), N'Skin care', 2, N'✨', 1, N'Dermatology'),
(8, GETDATE(), N'Eye care', 1, N'👁️', 1, N'Ophthalmology'),
(9, GETDATE(), N'Ear nose throat', 3, N'👂', 1, N'ENT'),
(10, GETDATE(), N'Mental health', 4, N'🧘', 1, N'Psychiatry');
SET IDENTITY_INSERT [dbo].[Departments] OFF;

SET IDENTITY_INSERT [dbo].[Users] ON;
INSERT INTO [dbo].[Users] ([Id], [FullName], [Email], [PasswordHash], [PhoneNumber], [IsActive], [CreatedAt])
VALUES (1, N'Jaswanth', N'jaswanth@medicore.com', N'$2a$11$KEybf9HE082BxsmAJ0xkBOGcxm5NDhwXF0X4jix7luT1u2PfcXwyO', N'9293405122', 1, GETDATE());
-- Password is 'Admin@123'
SET IDENTITY_INSERT [dbo].[Users] OFF;

INSERT INTO [dbo].[UserRoles] ([UserId], [RoleId]) VALUES (1, 1);

INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES 
(N'20260306080014_InitialCreate', N'8.0.0'),
(N'20260309105228_AddMultiRoleSupport', N'8.0.0'),
(N'20260311132828_Phase2EntitiesFixed', N'8.0.0');
GO

PRINT '✅ NUCLEAR REPAIR COMPLETE! 🚀';
SELECT Table_Name FROM INFORMATION_SCHEMA.TABLES WHERE Table_Type = 'BASE TABLE' ORDER BY Table_Name;
GO
