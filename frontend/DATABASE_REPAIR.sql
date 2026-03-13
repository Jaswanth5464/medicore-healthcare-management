-- ==========================================================
-- 🛠️ MEDICORE DATABASE REPAIR SCRIPT (FOR RDS)
-- This script FORCES the use of MediCoreDB and rebuilds it.
-- ==========================================================

-- 1️⃣ FORCE SELECTION OF MEDICOREDB
-- If you get an error here, it means the database name is different in AWS!
USE [MediCoreDB];
GO

-- 2️⃣ PRINT INFO FOR VERIFICATION
PRINT 'Current Database: ' + DB_NAME();
PRINT 'Current Schema: ' + SCHEMA_NAME();
GO

-- 3️⃣ WIPE EVERYTHING (Strict Order)
IF OBJECT_ID(N'[dbo].[AuditLogs]') IS NOT NULL DROP TABLE [dbo].[AuditLogs];
IF OBJECT_ID(N'[dbo].[RefreshTokens]') IS NOT NULL DROP TABLE [dbo].[RefreshTokens];
IF OBJECT_ID(N'[dbo].[UserRoles]') IS NOT NULL DROP TABLE [dbo].[UserRoles];
IF OBJECT_ID(N'[dbo].[DoctorLeaves]') IS NOT NULL DROP TABLE [dbo].[DoctorLeaves];
IF OBJECT_ID(N'[dbo].[PatientProfiles]') IS NOT NULL DROP TABLE [dbo].[PatientProfiles];
IF OBJECT_ID(N'[dbo].[Medicines]') IS NOT NULL DROP TABLE [dbo].[Medicines];
IF OBJECT_ID(N'[dbo].[Vitals]') IS NOT NULL DROP TABLE [dbo].[Vitals];
IF OBJECT_ID(N'[dbo].[Prescriptions]') IS NOT NULL DROP TABLE [dbo].[Prescriptions];
IF OBJECT_ID(N'[dbo].[LabOrders]') IS NOT NULL DROP TABLE [dbo].[LabOrders];
IF OBJECT_ID(N'[dbo].[Bills]') IS NOT NULL DROP TABLE [dbo].[Bills];
IF OBJECT_ID(N'[dbo].[Appointments]') IS NOT NULL DROP TABLE [dbo].[Appointments];
IF OBJECT_ID(N'[dbo].[AppointmentRequests]') IS NOT NULL DROP TABLE [dbo].[AppointmentRequests];
IF OBJECT_ID(N'[dbo].[OtpRecords]') IS NOT NULL DROP TABLE [dbo].[OtpRecords];
IF OBJECT_ID(N'[dbo].[DoctorProfiles]') IS NOT NULL DROP TABLE [dbo].[DoctorProfiles];
IF OBJECT_ID(N'[dbo].[Departments]') IS NOT NULL DROP TABLE [dbo].[Departments];
IF OBJECT_ID(N'[dbo].[Users]') IS NOT NULL DROP TABLE [dbo].[Users];
IF OBJECT_ID(N'[dbo].[Roles]') IS NOT NULL DROP TABLE [dbo].[Roles];
IF OBJECT_ID(N'[dbo].[LabTestMasters]') IS NOT NULL DROP TABLE [dbo].[LabTestMasters];
IF OBJECT_ID(N'[dbo].[__EFMigrationsHistory]') IS NOT NULL DROP TABLE [dbo].[__EFMigrationsHistory];
GO

-- 4️⃣ CREATE TABLES (Explicit dbo schema)
CREATE TABLE [dbo].[__EFMigrationsHistory] (
    [MigrationId] nvarchar(150) NOT NULL,
    [ProductVersion] nvarchar(32) NOT NULL,
    CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
);
GO

CREATE TABLE [dbo].[Roles] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
);
GO

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
GO

CREATE TABLE [dbo].[UserRoles] (
    [UserId] int NOT NULL,
    [RoleId] int NOT NULL,
    CONSTRAINT [PK_UserRoles] PRIMARY KEY ([UserId], [RoleId]),
    CONSTRAINT [FK_UserRoles_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [dbo].[Roles] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_UserRoles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users] ([Id]) ON DELETE CASCADE
);
GO

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
GO

-- 5️⃣ SEED METADATA
SET IDENTITY_INSERT [dbo].[Roles] ON;
INSERT INTO [dbo].[Roles] ([Id], [Description], [Name]) VALUES 
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
SET IDENTITY_INSERT [dbo].[Roles] OFF;
GO

SET IDENTITY_INSERT [dbo].[Departments] ON;
INSERT INTO [dbo].[Departments] ([Id], [CreatedAt], [Description], [FloorNumber], [Icon], [IsActive], [Name]) VALUES 
(1, GETDATE(), N'General health consultations', 1, N'🏥', 1, N'General Medicine'),
(2, GETDATE(), N'Heart care', 2, N'❤️', 1, N'Cardiology'),
(3, GETDATE(), N'Brain care', 2, N'🧠', 1, N'Neurology'),
(4, GETDATE(), N'Bone care', 3, N'🦴', 1, N'Orthopedics'),
(5, GETDATE(), N'Children care', 1, N'👶', 1, N'Pediatrics');
SET IDENTITY_INSERT [dbo].[Departments] OFF;
GO

-- 6️⃣ 👤 SEED SUPER ADMIN
SET IDENTITY_INSERT [dbo].[Users] ON;
INSERT INTO [dbo].[Users] ([Id], [FullName], [Email], [PasswordHash], [PhoneNumber], [IsActive], [CreatedAt])
VALUES (1, N'Jaswanth', N'jaswanth5464@gmail.com', N'$2a$11$KEybf9HE082BxsmAJ0xkBOGcxm5NDhwXF0X4jix7luT1u2PfcXwyO', N'9293405122', 1, GETDATE());
SET IDENTITY_INSERT [dbo].[Users] OFF;

INSERT INTO [dbo].[UserRoles] ([UserId], [RoleId]) VALUES (1, 1);
GO

-- 7️⃣ VERIFY
PRINT '✅ Tables created successfully in ' + DB_NAME();
SELECT Table_Name FROM INFORMATION_SCHEMA.TABLES WHERE Table_Type = 'BASE TABLE';
GO
