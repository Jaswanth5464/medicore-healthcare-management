IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306080014_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260306080014_InitialCreate', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306082302_AuthTables'
)
BEGIN
    CREATE TABLE [Roles] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NOT NULL,
        CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306082302_AuthTables'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] int NOT NULL IDENTITY,
        [FullName] nvarchar(max) NOT NULL,
        [Email] nvarchar(max) NOT NULL,
        [PasswordHash] nvarchar(max) NOT NULL,
        [PhoneNumber] nvarchar(max) NOT NULL,
        [RoleId] int NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Users_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306082302_AuthTables'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306082302_AuthTables'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_UserId] ON [RefreshTokens] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306082302_AuthTables'
)
BEGIN
    CREATE INDEX [IX_Users_RoleId] ON [Users] ([RoleId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306082302_AuthTables'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260306082302_AuthTables', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306082357_AddAuthTables'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260306082357_AddAuthTables', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306090533_adddetails'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Description', N'Name') AND [object_id] = OBJECT_ID(N'[Roles]'))
        SET IDENTITY_INSERT [Roles] ON;
    EXEC(N'INSERT INTO [Roles] ([Id], [Description], [Name])
    VALUES (1, N''Full system access'', N''SuperAdmin''),
    (2, N''Hospital management access'', N''HospitalAdmin''),
    (3, N''Front desk operations'', N''Receptionist''),
    (4, N''Medical consultation access'', N''Doctor''),
    (5, N''Ward management access'', N''Nurse''),
    (6, N''Pharmacy management access'', N''Pharmacist''),
    (7, N''Laboratory access'', N''LabTechnician''),
    (8, N''Billing and finance access'', N''FinanceStaff''),
    (9, N''Patient mentoring access'', N''Mentor''),
    (10, N''Patient portal access'', N''Patient'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Description', N'Name') AND [object_id] = OBJECT_ID(N'[Roles]'))
        SET IDENTITY_INSERT [Roles] OFF;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306090533_adddetails'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260306090533_adddetails', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306194903_new'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306194903_new'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306194903_new'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedAt', N'Description', N'FloorNumber', N'Icon', N'IsActive', N'Name') AND [object_id] = OBJECT_ID(N'[Departments]'))
        SET IDENTITY_INSERT [Departments] ON;
    EXEC(N'INSERT INTO [Departments] ([Id], [CreatedAt], [Description], [FloorNumber], [Icon], [IsActive], [Name])
    VALUES (1, ''2026-03-06T19:48:59.2844389Z'', N''General health consultations'', 1, N''🏥'', CAST(1 AS bit), N''General Medicine''),
    (2, ''2026-03-06T19:48:59.2844399Z'', N''Heart care'', 2, N''❤️'', CAST(1 AS bit), N''Cardiology''),
    (3, ''2026-03-06T19:48:59.2844403Z'', N''Brain care'', 2, N''🧠'', CAST(1 AS bit), N''Neurology''),
    (4, ''2026-03-06T19:48:59.2844406Z'', N''Bone care'', 3, N''🦴'', CAST(1 AS bit), N''Orthopedics''),
    (5, ''2026-03-06T19:48:59.2844409Z'', N''Children care'', 1, N''👶'', CAST(1 AS bit), N''Pediatrics''),
    (6, ''2026-03-06T19:48:59.2844412Z'', N''Women health'', 4, N''🌸'', CAST(1 AS bit), N''Gynecology''),
    (7, ''2026-03-06T19:48:59.2844415Z'', N''Skin care'', 2, N''✨'', CAST(1 AS bit), N''Dermatology''),
    (8, ''2026-03-06T19:48:59.2844418Z'', N''Eye care'', 1, N''👁️'', CAST(1 AS bit), N''Ophthalmology''),
    (9, ''2026-03-06T19:48:59.2844420Z'', N''Ear nose throat'', 3, N''👂'', CAST(1 AS bit), N''ENT''),
    (10, ''2026-03-06T19:48:59.2844423Z'', N''Mental health'', 4, N''🧘'', CAST(1 AS bit), N''Psychiatry'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedAt', N'Description', N'FloorNumber', N'Icon', N'IsActive', N'Name') AND [object_id] = OBJECT_ID(N'[Departments]'))
        SET IDENTITY_INSERT [Departments] OFF;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306194903_new'
)
BEGIN
    CREATE INDEX [IX_DoctorProfiles_DepartmentId] ON [DoctorProfiles] ([DepartmentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306194903_new'
)
BEGIN
    CREATE INDEX [IX_DoctorProfiles_UserId] ON [DoctorProfiles] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260306194903_new'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260306194903_new', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308060616_AppointmentRequestsAndAppointments'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308060616_AppointmentRequestsAndAppointments'
)
BEGIN
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
        CONSTRAINT [PK_Appointments] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308060616_AppointmentRequestsAndAppointments'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T06:06:14.8330071Z''
    WHERE [Id] = 1;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308060616_AppointmentRequestsAndAppointments'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T06:06:14.8330082Z''
    WHERE [Id] = 2;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308060616_AppointmentRequestsAndAppointments'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T06:06:14.8330086Z''
    WHERE [Id] = 3;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308060616_AppointmentRequestsAndAppointments'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T06:06:14.8330089Z''
    WHERE [Id] = 4;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308060616_AppointmentRequestsAndAppointments'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T06:06:14.8330092Z''
    WHERE [Id] = 5;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308060616_AppointmentRequestsAndAppointments'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T06:06:14.8330095Z''
    WHERE [Id] = 6;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308060616_AppointmentRequestsAndAppointments'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T06:06:14.8330098Z''
    WHERE [Id] = 7;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308060616_AppointmentRequestsAndAppointments'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T06:06:14.8330101Z''
    WHERE [Id] = 8;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308060616_AppointmentRequestsAndAppointments'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T06:06:14.8330104Z''
    WHERE [Id] = 9;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308060616_AppointmentRequestsAndAppointments'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T06:06:14.8330107Z''
    WHERE [Id] = 10;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308060616_AppointmentRequestsAndAppointments'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260308060616_AppointmentRequestsAndAppointments', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308095929_AddOtpRecord'
)
BEGIN
    CREATE TABLE [OtpRecords] (
        [Id] int NOT NULL IDENTITY,
        [PhoneNumber] nvarchar(max) NOT NULL,
        [OtpCode] nvarchar(max) NOT NULL,
        [ExpiryTime] datetime2 NOT NULL,
        [IsUsed] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_OtpRecords] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308095929_AddOtpRecord'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T09:59:28.2365792Z''
    WHERE [Id] = 1;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308095929_AddOtpRecord'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T09:59:28.2365798Z''
    WHERE [Id] = 2;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308095929_AddOtpRecord'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T09:59:28.2365800Z''
    WHERE [Id] = 3;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308095929_AddOtpRecord'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T09:59:28.2365802Z''
    WHERE [Id] = 4;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308095929_AddOtpRecord'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T09:59:28.2365803Z''
    WHERE [Id] = 5;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308095929_AddOtpRecord'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T09:59:28.2365805Z''
    WHERE [Id] = 6;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308095929_AddOtpRecord'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T09:59:28.2365807Z''
    WHERE [Id] = 7;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308095929_AddOtpRecord'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T09:59:28.2365808Z''
    WHERE [Id] = 8;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308095929_AddOtpRecord'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T09:59:28.2365810Z''
    WHERE [Id] = 9;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308095929_AddOtpRecord'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-08T09:59:28.2365811Z''
    WHERE [Id] = 10;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260308095929_AddOtpRecord'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260308095929_AddOtpRecord', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309105228_AddMultiRoleSupport'
)
BEGIN
    CREATE TABLE [UserRoles] (
        [UserId] int NOT NULL,
        [RoleId] int NOT NULL,
        CONSTRAINT [PK_UserRoles] PRIMARY KEY ([UserId], [RoleId]),
        CONSTRAINT [FK_UserRoles_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]),
        CONSTRAINT [FK_UserRoles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309105228_AddMultiRoleSupport'
)
BEGIN
    INSERT INTO UserRoles (UserId, RoleId) SELECT Id, RoleId FROM Users
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309105228_AddMultiRoleSupport'
)
BEGIN
    ALTER TABLE [Users] DROP CONSTRAINT [FK_Users_Roles_RoleId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309105228_AddMultiRoleSupport'
)
BEGIN
    DROP INDEX [IX_Users_RoleId] ON [Users];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309105228_AddMultiRoleSupport'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Users]') AND [c].[name] = N'RoleId');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Users] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [Users] DROP COLUMN [RoleId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309105228_AddMultiRoleSupport'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T10:52:27.4933134Z''
    WHERE [Id] = 1;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309105228_AddMultiRoleSupport'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T10:52:27.4933143Z''
    WHERE [Id] = 2;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309105228_AddMultiRoleSupport'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T10:52:27.4933146Z''
    WHERE [Id] = 3;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309105228_AddMultiRoleSupport'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T10:52:27.4933148Z''
    WHERE [Id] = 4;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309105228_AddMultiRoleSupport'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T10:52:27.4933150Z''
    WHERE [Id] = 5;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309105228_AddMultiRoleSupport'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T10:52:27.4933151Z''
    WHERE [Id] = 6;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309105228_AddMultiRoleSupport'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T10:52:27.4933153Z''
    WHERE [Id] = 7;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309105228_AddMultiRoleSupport'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T10:52:27.4933155Z''
    WHERE [Id] = 8;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309105228_AddMultiRoleSupport'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T10:52:27.4933156Z''
    WHERE [Id] = 9;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309105228_AddMultiRoleSupport'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T10:52:27.4933158Z''
    WHERE [Id] = 10;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309105228_AddMultiRoleSupport'
)
BEGIN
    CREATE INDEX [IX_UserRoles_RoleId] ON [UserRoles] ([RoleId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309105228_AddMultiRoleSupport'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260309105228_AddMultiRoleSupport', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309113643_12134'
)
BEGIN
    EXEC sp_rename N'[OtpRecords].[PhoneNumber]', N'Email', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309113643_12134'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T11:36:43.3185247Z''
    WHERE [Id] = 1;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309113643_12134'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T11:36:43.3185253Z''
    WHERE [Id] = 2;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309113643_12134'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T11:36:43.3185254Z''
    WHERE [Id] = 3;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309113643_12134'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T11:36:43.3185256Z''
    WHERE [Id] = 4;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309113643_12134'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T11:36:43.3185257Z''
    WHERE [Id] = 5;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309113643_12134'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T11:36:43.3185258Z''
    WHERE [Id] = 6;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309113643_12134'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T11:36:43.3185260Z''
    WHERE [Id] = 7;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309113643_12134'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T11:36:43.3185261Z''
    WHERE [Id] = 8;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309113643_12134'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T11:36:43.3185262Z''
    WHERE [Id] = 9;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309113643_12134'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T11:36:43.3185263Z''
    WHERE [Id] = 10;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309113643_12134'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260309113643_12134', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309121658_EmailOtpRefactor'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T12:16:58.2359617Z''
    WHERE [Id] = 1;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309121658_EmailOtpRefactor'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T12:16:58.2359622Z''
    WHERE [Id] = 2;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309121658_EmailOtpRefactor'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T12:16:58.2359623Z''
    WHERE [Id] = 3;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309121658_EmailOtpRefactor'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T12:16:58.2359624Z''
    WHERE [Id] = 4;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309121658_EmailOtpRefactor'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T12:16:58.2359625Z''
    WHERE [Id] = 5;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309121658_EmailOtpRefactor'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T12:16:58.2359627Z''
    WHERE [Id] = 6;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309121658_EmailOtpRefactor'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T12:16:58.2359628Z''
    WHERE [Id] = 7;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309121658_EmailOtpRefactor'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T12:16:58.2359629Z''
    WHERE [Id] = 8;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309121658_EmailOtpRefactor'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T12:16:58.2359630Z''
    WHERE [Id] = 9;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309121658_EmailOtpRefactor'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-09T12:16:58.2359631Z''
    WHERE [Id] = 10;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260309121658_EmailOtpRefactor'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260309121658_EmailOtpRefactor', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310110551_SyncPhaseA'
)
BEGIN
    ALTER TABLE [Appointments] ADD [CheckedInAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310110551_SyncPhaseA'
)
BEGIN
    ALTER TABLE [Appointments] ADD [CompletedAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310110551_SyncPhaseA'
)
BEGIN
    ALTER TABLE [Appointments] ADD [ConsultationStartedAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310110551_SyncPhaseA'
)
BEGIN
    ALTER TABLE [Appointments] ADD [QueuePosition] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310110551_SyncPhaseA'
)
BEGIN
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
        [PaymentStatus] nvarchar(max) NOT NULL,
        [PaymentMode] nvarchar(max) NULL,
        [RazorpayOrderId] nvarchar(max) NULL,
        [RazorpayPaymentId] nvarchar(max) NULL,
        [PaidAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Bills] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310110551_SyncPhaseA'
)
BEGIN
    CREATE TABLE [LabOrders] (
        [Id] int NOT NULL IDENTITY,
        [AppointmentId] int NOT NULL,
        [PatientUserId] int NOT NULL,
        [DoctorProfileId] int NOT NULL,
        [Tests] nvarchar(max) NOT NULL,
        [Status] nvarchar(max) NOT NULL,
        [ReportUrl] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [CompletedAt] datetime2 NULL,
        CONSTRAINT [PK_LabOrders] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310110551_SyncPhaseA'
)
BEGIN
    CREATE TABLE [Prescriptions] (
        [Id] int NOT NULL IDENTITY,
        [AppointmentId] int NOT NULL,
        [PatientUserId] int NOT NULL,
        [DoctorProfileId] int NOT NULL,
        [Diagnosis] nvarchar(max) NOT NULL,
        [Items] nvarchar(max) NOT NULL,
        [FollowUpDate] datetime2 NULL,
        [Notes] nvarchar(max) NULL,
        [PdfUrl] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_Prescriptions] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310110551_SyncPhaseA'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310110551_SyncPhaseA'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:05:51.1913099Z''
    WHERE [Id] = 1;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310110551_SyncPhaseA'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:05:51.1913104Z''
    WHERE [Id] = 2;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310110551_SyncPhaseA'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:05:51.1913105Z''
    WHERE [Id] = 3;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310110551_SyncPhaseA'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:05:51.1913106Z''
    WHERE [Id] = 4;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310110551_SyncPhaseA'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:05:51.1913108Z''
    WHERE [Id] = 5;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310110551_SyncPhaseA'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:05:51.1913109Z''
    WHERE [Id] = 6;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310110551_SyncPhaseA'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:05:51.1913110Z''
    WHERE [Id] = 7;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310110551_SyncPhaseA'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:05:51.1913111Z''
    WHERE [Id] = 8;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310110551_SyncPhaseA'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:05:51.1913112Z''
    WHERE [Id] = 9;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310110551_SyncPhaseA'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:05:51.1913115Z''
    WHERE [Id] = 10;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310110551_SyncPhaseA'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260310110551_SyncPhaseA', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    EXEC sp_rename N'[Prescriptions].[Items]', N'MedicinesJson', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    EXEC sp_rename N'[LabOrders].[Tests]', N'TestType', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    EXEC sp_rename N'[Bills].[PaymentStatus]', N'Status', N'COLUMN';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    ALTER TABLE [Prescriptions] ADD [Advice] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    ALTER TABLE [Prescriptions] ADD [DispensedAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    ALTER TABLE [Prescriptions] ADD [IsDispensed] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    ALTER TABLE [LabOrders] ADD [Notes] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    ALTER TABLE [LabOrders] ADD [ResultNotes] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:30:58.9151484Z''
    WHERE [Id] = 1;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:30:58.9151488Z''
    WHERE [Id] = 2;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:30:58.9151490Z''
    WHERE [Id] = 3;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:30:58.9151491Z''
    WHERE [Id] = 4;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:30:58.9151493Z''
    WHERE [Id] = 5;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:30:58.9151494Z''
    WHERE [Id] = 6;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:30:58.9151495Z''
    WHERE [Id] = 7;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:30:58.9151496Z''
    WHERE [Id] = 8;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:30:58.9151498Z''
    WHERE [Id] = 9;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-10T11:30:58.9151499Z''
    WHERE [Id] = 10;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    CREATE INDEX [IX_Bills_AppointmentId] ON [Bills] ([AppointmentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    ALTER TABLE [Bills] ADD CONSTRAINT [FK_Bills_Appointments_AppointmentId] FOREIGN KEY ([AppointmentId]) REFERENCES [Appointments] ([Id]) ON DELETE CASCADE;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310113059_1'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260310113059_1', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311101236_AddDoctorLeaveAndPatientProfile'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311101236_AddDoctorLeaveAndPatientProfile'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311101236_AddDoctorLeaveAndPatientProfile'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T10:12:34.7816266Z''
    WHERE [Id] = 1;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311101236_AddDoctorLeaveAndPatientProfile'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T10:12:34.7816273Z''
    WHERE [Id] = 2;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311101236_AddDoctorLeaveAndPatientProfile'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T10:12:34.7816275Z''
    WHERE [Id] = 3;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311101236_AddDoctorLeaveAndPatientProfile'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T10:12:34.7816276Z''
    WHERE [Id] = 4;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311101236_AddDoctorLeaveAndPatientProfile'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T10:12:34.7816277Z''
    WHERE [Id] = 5;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311101236_AddDoctorLeaveAndPatientProfile'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T10:12:34.7816278Z''
    WHERE [Id] = 6;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311101236_AddDoctorLeaveAndPatientProfile'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T10:12:34.7816279Z''
    WHERE [Id] = 7;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311101236_AddDoctorLeaveAndPatientProfile'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T10:12:34.7816281Z''
    WHERE [Id] = 8;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311101236_AddDoctorLeaveAndPatientProfile'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T10:12:34.7816282Z''
    WHERE [Id] = 9;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311101236_AddDoctorLeaveAndPatientProfile'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T10:12:34.7816283Z''
    WHERE [Id] = 10;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311101236_AddDoctorLeaveAndPatientProfile'
)
BEGIN
    CREATE INDEX [IX_DoctorLeaves_DoctorProfileId] ON [DoctorLeaves] ([DoctorProfileId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311101236_AddDoctorLeaveAndPatientProfile'
)
BEGIN
    CREATE INDEX [IX_PatientProfiles_UserId] ON [PatientProfiles] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311101236_AddDoctorLeaveAndPatientProfile'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260311101236_AddDoctorLeaveAndPatientProfile', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311113524_123456'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311113524_123456'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:35:19.4916820Z''
    WHERE [Id] = 1;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311113524_123456'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:35:19.4916838Z''
    WHERE [Id] = 2;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311113524_123456'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:35:19.4916844Z''
    WHERE [Id] = 3;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311113524_123456'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:35:19.4916850Z''
    WHERE [Id] = 4;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311113524_123456'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:35:19.4916854Z''
    WHERE [Id] = 5;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311113524_123456'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:35:19.4916859Z''
    WHERE [Id] = 6;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311113524_123456'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:35:19.4916863Z''
    WHERE [Id] = 7;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311113524_123456'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:35:19.4916867Z''
    WHERE [Id] = 8;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311113524_123456'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:35:19.4916871Z''
    WHERE [Id] = 9;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311113524_123456'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:35:19.4916876Z''
    WHERE [Id] = 10;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311113524_123456'
)
BEGIN
    CREATE INDEX [IX_Appointments_DepartmentId] ON [Appointments] ([DepartmentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311113524_123456'
)
BEGIN
    ALTER TABLE [Appointments] ADD CONSTRAINT [FK_Appointments_Departments_DepartmentId] FOREIGN KEY ([DepartmentId]) REFERENCES [Departments] ([Id]) ON DELETE CASCADE;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311113524_123456'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260311113524_123456', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311114822_1359'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:48:18.3694376Z''
    WHERE [Id] = 1;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311114822_1359'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:48:18.3694384Z''
    WHERE [Id] = 2;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311114822_1359'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:48:18.3694387Z''
    WHERE [Id] = 3;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311114822_1359'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:48:18.3694390Z''
    WHERE [Id] = 4;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311114822_1359'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:48:18.3694393Z''
    WHERE [Id] = 5;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311114822_1359'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:48:18.3694396Z''
    WHERE [Id] = 6;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311114822_1359'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:48:18.3694471Z''
    WHERE [Id] = 7;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311114822_1359'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:48:18.3694474Z''
    WHERE [Id] = 8;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311114822_1359'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:48:18.3694476Z''
    WHERE [Id] = 9;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311114822_1359'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T11:48:18.3694479Z''
    WHERE [Id] = 10;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311114822_1359'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260311114822_1359', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    ALTER TABLE [Prescriptions] ADD [DietPlan] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    ALTER TABLE [LabOrders] ADD [CriticalAlert] bit NOT NULL DEFAULT CAST(0 AS bit);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    CREATE TABLE [LabTestMasters] (
        [Id] int NOT NULL IDENTITY,
        [TestName] nvarchar(200) NOT NULL,
        [NormalRange] nvarchar(200) NOT NULL,
        [Price] decimal(18,2) NOT NULL,
        [TurnaroundTimeHours] int NOT NULL,
        [IsActive] bit NOT NULL,
        CONSTRAINT [PK_LabTestMasters] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
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
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T13:28:27.3049360Z''
    WHERE [Id] = 1;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T13:28:27.3049365Z''
    WHERE [Id] = 2;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T13:28:27.3049367Z''
    WHERE [Id] = 3;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T13:28:27.3049369Z''
    WHERE [Id] = 4;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T13:28:27.3049370Z''
    WHERE [Id] = 5;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T13:28:27.3049372Z''
    WHERE [Id] = 6;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T13:28:27.3049373Z''
    WHERE [Id] = 7;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T13:28:27.3049375Z''
    WHERE [Id] = 8;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T13:28:27.3049377Z''
    WHERE [Id] = 9;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-11T13:28:27.3049378Z''
    WHERE [Id] = 10;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    CREATE INDEX [IX_Prescriptions_AppointmentId] ON [Prescriptions] ([AppointmentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    CREATE INDEX [IX_LabOrders_AppointmentId] ON [LabOrders] ([AppointmentId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    CREATE INDEX [IX_Appointments_DoctorProfileId] ON [Appointments] ([DoctorProfileId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    CREATE INDEX [IX_Appointments_PatientUserId] ON [Appointments] ([PatientUserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    ALTER TABLE [Appointments] ADD CONSTRAINT [FK_Appointments_DoctorProfiles_DoctorProfileId] FOREIGN KEY ([DoctorProfileId]) REFERENCES [DoctorProfiles] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    ALTER TABLE [Appointments] ADD CONSTRAINT [FK_Appointments_Users_PatientUserId] FOREIGN KEY ([PatientUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    ALTER TABLE [LabOrders] ADD CONSTRAINT [FK_LabOrders_Appointments_AppointmentId] FOREIGN KEY ([AppointmentId]) REFERENCES [Appointments] ([Id]) ON DELETE CASCADE;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    ALTER TABLE [Prescriptions] ADD CONSTRAINT [FK_Prescriptions_Appointments_AppointmentId] FOREIGN KEY ([AppointmentId]) REFERENCES [Appointments] ([Id]) ON DELETE CASCADE;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311132828_Phase2EntitiesFixed'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260311132828_Phase2EntitiesFixed', N'8.0.0');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315154310_ReApplyMakePatientUserIdNullable'
)
BEGIN
    ALTER TABLE [Bills] DROP CONSTRAINT [FK_Bills_Appointments_AppointmentId];
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315154310_ReApplyMakePatientUserIdNullable'
)
BEGIN
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Bills]') AND [c].[name] = N'PatientUserId');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [Bills] DROP CONSTRAINT [' + @var1 + '];');
    ALTER TABLE [Bills] ALTER COLUMN [PatientUserId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315154310_ReApplyMakePatientUserIdNullable'
)
BEGIN
    DECLARE @var2 sysname;
    SELECT @var2 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Bills]') AND [c].[name] = N'DoctorProfileId');
    IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [Bills] DROP CONSTRAINT [' + @var2 + '];');
    ALTER TABLE [Bills] ALTER COLUMN [DoctorProfileId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315154310_ReApplyMakePatientUserIdNullable'
)
BEGIN
    DECLARE @var3 sysname;
    SELECT @var3 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Bills]') AND [c].[name] = N'AppointmentId');
    IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [Bills] DROP CONSTRAINT [' + @var3 + '];');
    ALTER TABLE [Bills] ALTER COLUMN [AppointmentId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315154310_ReApplyMakePatientUserIdNullable'
)
BEGIN
    ALTER TABLE [Bills] ADD [BillSource] nvarchar(max) NOT NULL DEFAULT N'';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315154310_ReApplyMakePatientUserIdNullable'
)
BEGIN
    ALTER TABLE [Bills] ADD [SourceReferenceId] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315154310_ReApplyMakePatientUserIdNullable'
)
BEGIN
    CREATE TABLE [ChatMessages] (
        [Id] int NOT NULL IDENTITY,
        [FromUserId] nvarchar(max) NOT NULL,
        [ToUserId] nvarchar(max) NOT NULL,
        [Message] nvarchar(max) NOT NULL,
        [SentAt] datetime2 NOT NULL,
        [IsRead] bit NOT NULL,
        [GroupName] nvarchar(max) NULL,
        [ImageUrl] nvarchar(max) NULL,
        CONSTRAINT [PK_ChatMessages] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315154310_ReApplyMakePatientUserIdNullable'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-15T15:43:09.8287360Z''
    WHERE [Id] = 1;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315154310_ReApplyMakePatientUserIdNullable'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-15T15:43:09.8287370Z''
    WHERE [Id] = 2;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315154310_ReApplyMakePatientUserIdNullable'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-15T15:43:09.8287372Z''
    WHERE [Id] = 3;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315154310_ReApplyMakePatientUserIdNullable'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-15T15:43:09.8287373Z''
    WHERE [Id] = 4;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315154310_ReApplyMakePatientUserIdNullable'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-15T15:43:09.8287376Z''
    WHERE [Id] = 5;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315154310_ReApplyMakePatientUserIdNullable'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-15T15:43:09.8287378Z''
    WHERE [Id] = 6;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315154310_ReApplyMakePatientUserIdNullable'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-15T15:43:09.8287379Z''
    WHERE [Id] = 7;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315154310_ReApplyMakePatientUserIdNullable'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-15T15:43:09.8287380Z''
    WHERE [Id] = 8;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315154310_ReApplyMakePatientUserIdNullable'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-15T15:43:09.8287383Z''
    WHERE [Id] = 9;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315154310_ReApplyMakePatientUserIdNullable'
)
BEGIN
    EXEC(N'UPDATE [Departments] SET [CreatedAt] = ''2026-03-15T15:43:09.8287384Z''
    WHERE [Id] = 10;
    SELECT @@ROWCOUNT');
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315154310_ReApplyMakePatientUserIdNullable'
)
BEGIN
    ALTER TABLE [Bills] ADD CONSTRAINT [FK_Bills_Appointments_AppointmentId] FOREIGN KEY ([AppointmentId]) REFERENCES [Appointments] ([Id]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260315154310_ReApplyMakePatientUserIdNullable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260315154310_ReApplyMakePatientUserIdNullable', N'8.0.0');
END;
GO

COMMIT;
GO

