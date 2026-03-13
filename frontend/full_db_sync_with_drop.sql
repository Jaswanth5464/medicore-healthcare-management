-- ==========================================================
-- 🚀 MEDICORE FULL DATABASE SYNC SCRIPT
-- This script will:
-- 1. DROP all existing tables (CLEAN START)
-- 2. CREATE all tables according to the latest schema
-- 3. SEED default Roles and Departments
-- ==========================================================

-- 1️⃣ DROP EXISTING TABLES (Ordering matters for Foreign Keys)
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

-- 2️⃣ CREATE SCHEMA + SEED DATA (Generated from EF Core)
-- [Paste the content of full_db_sync.sql here or I will provide it as one big block]
