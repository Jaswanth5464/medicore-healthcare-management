using MediCore.API.Infrastructure.Database.Context;
using MediCore.API.Migrations;
using MediCore.API.Modules.Auth.Models;
using MediCore.API.Modules.Doctor.Models;
using MediCore.API.Modules.Finance.Models;
using MediCore.API.Modules.Laboratory.Models;
using MediCore.API.Modules.OPD.Models;
using MediCore.API.Modules.Patient.Models;
using MediCore.API.Services;
using MediCore.API.Modules.Communication.Models;
using MediCore.API.Modules.Bed.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;

namespace MediCore.API.Infrastructure.Database.Context
{
    public class MediCoreDbContext : DbContext
    {
        public MediCoreDbContext(DbContextOptions<MediCoreDbContext> options)
            : base(options)
        {
        }

        // Auth Tables
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }

        public DbSet<Department> Departments { get; set; }
        public DbSet<DoctorProfile> DoctorProfiles { get; set; }

        public DbSet<AppointmentRequest> AppointmentRequests { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<OtpRecord> OtpRecords { get; set; }
        public DbSet<Bill> Bills { get; set; }
        public DbSet<Vitals> Vitals { get; set; }
        public DbSet<Prescription> Prescriptions { get; set; }
        public DbSet<LabOrder> LabOrders { get; set; }
        public DbSet<LabTestMaster> LabTestMasters { get; set; }
        public DbSet<DoctorLeave> DoctorLeaves { get; set; }
        public DbSet<PatientProfile> PatientProfiles { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<MediCore.API.Modules.Pharmacy.Models.Medicine> Medicines { get; set; }

        // IPD and Bed Allocation
        public DbSet<RoomType> RoomTypes { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<BedAllocation> BedAllocations { get; set; }
        public DbSet<PatientAdmission> PatientAdmissions { get; set; }
        public DbSet<DailyIPDCharge> DailyIPDCharges { get; set; }
        public DbSet<DischargeNote> DischargeNotes { get; set; }

        // Feedbacks
        public DbSet<PatientFeedback> PatientFeedbacks { get; set; }
        public DbSet<Expense> Expenses { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(
                typeof(MediCoreDbContext).Assembly);

            // Configure Many-to-Many UserRoles
            modelBuilder.Entity<UserRole>()
                .HasKey(ur => new { ur.UserId, ur.RoleId });

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId);

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId);

            // Prevent cascade cycles for Appointments
            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.PatientUser)
                .WithMany()
                .HasForeignKey(a => a.PatientUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Appointment>()
                .HasOne(a => a.DoctorProfile)
                .WithMany()
                .HasForeignKey(a => a.DoctorProfileId)
                .OnDelete(DeleteBehavior.Restrict);

            // IPD Configuration
            modelBuilder.Entity<PatientAdmission>()
                .HasOne(pa => pa.PatientUser)
                .WithMany()
                .HasForeignKey(pa => pa.PatientUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PatientAdmission>()
                .HasOne(pa => pa.Bed)
                .WithMany(b => b.AllAdmissions)
                .HasForeignKey(pa => pa.BedId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<PatientAdmission>()
                .HasOne(pa => pa.Room)
                .WithMany(r => r.PatientAdmissions)
                .HasForeignKey(pa => pa.RoomId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PatientAdmission>()
                .HasOne(pa => pa.AdmittingDoctor)
                .WithMany()
                .HasForeignKey(pa => pa.AdmittingDoctorProfileId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PatientAdmission>()
                .HasOne(pa => pa.DischargedByUser)
                .WithMany()
                .HasForeignKey(pa => pa.DischargedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<BedAllocation>()
                .HasOne(b => b.CurrentAdmission)
                .WithOne()
                .HasForeignKey<BedAllocation>(b => b.CurrentAdmissionId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<DailyIPDCharge>()
                .HasOne(d => d.AddedByUser)
                .WithMany()
                .HasForeignKey(d => d.AddedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DischargeNote>()
                .HasOne(dn => dn.FollowUpDoctor)
                .WithMany()
                .HasForeignKey(dn => dn.FollowUpWithDoctorId)
                .OnDelete(DeleteBehavior.SetNull);

            // Feedback Config
            modelBuilder.Entity<PatientFeedback>()
                .HasOne(pf => pf.PatientUser)
                .WithMany()
                .HasForeignKey(pf => pf.PatientUserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PatientFeedback>()
                .HasOne(pf => pf.DoctorProfile)
                .WithMany()
                .HasForeignKey(pf => pf.DoctorProfileId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Department>().HasData(
    new Department { Id = 1, Name = "General Medicine", Description = "General health consultations", Icon = "🏥", FloorNumber = 1 },
    new Department { Id = 2, Name = "Cardiology", Description = "Heart care", Icon = "❤️", FloorNumber = 2 },
    new Department { Id = 3, Name = "Neurology", Description = "Brain care", Icon = "🧠", FloorNumber = 2 },
    new Department { Id = 4, Name = "Orthopedics", Description = "Bone care", Icon = "🦴", FloorNumber = 3 },
    new Department { Id = 5, Name = "Pediatrics", Description = "Children care", Icon = "👶", FloorNumber = 1 },
    new Department { Id = 6, Name = "Gynecology", Description = "Women health", Icon = "🌸", FloorNumber = 4 },
    new Department { Id = 7, Name = "Dermatology", Description = "Skin care", Icon = "✨", FloorNumber = 2 },
    new Department { Id = 8, Name = "Ophthalmology", Description = "Eye care", Icon = "👁️", FloorNumber = 1 },
    new Department { Id = 9, Name = "ENT", Description = "Ear nose throat", Icon = "👂", FloorNumber = 3 },
    new Department { Id = 10, Name = "Psychiatry", Description = "Mental health", Icon = "🧘", FloorNumber = 4 }
);

            // Seed RoomTypes
            modelBuilder.Entity<RoomType>().HasData(
                new RoomType { Id = 1, Name = "Emergency Ward", Description = "Emergency care with basic monitoring", FloorNumber = 0, PricePerDay = 2000, BedsPerRoom = 1, Amenities = "Basic bed, monitor, oxygen", ColorCode = "#ef4444" },
                new RoomType { Id = 2, Name = "ICU", Description = "Intensive Care Unit with advanced equipment", FloorNumber = 0, PricePerDay = 8000, BedsPerRoom = 1, Amenities = "ICU equipment, ventilator, advanced monitoring", ColorCode = "#dc2626" },
                new RoomType { Id = 3, Name = "NICU", Description = "Neonatal Intensive Care Unit", FloorNumber = 0, PricePerDay = 10000, BedsPerRoom = 1, Amenities = "Neonatal equipment, incubator, advanced care", ColorCode = "#f97316" },
                new RoomType { Id = 4, Name = "General Ward Male", Description = "General male ward", FloorNumber = 1, PricePerDay = 1200, BedsPerRoom = 1, Amenities = "Basic amenities, bed, locker", ColorCode = "#3b82f6" },
                new RoomType { Id = 5, Name = "General Ward Female", Description = "General female ward", FloorNumber = 1, PricePerDay = 1200, BedsPerRoom = 1, Amenities = "Basic amenities, bed, locker", ColorCode = "#8b5cf6" },
                new RoomType { Id = 6, Name = "Semi-Private Room", Description = "Semi-private accommodation", FloorNumber = 2, PricePerDay = 2500, BedsPerRoom = 2, Amenities = "AC, TV, shared bathroom", ColorCode = "#6366f1" },
                new RoomType { Id = 7, Name = "Private Room", Description = "Private accommodation", FloorNumber = 3, PricePerDay = 4500, BedsPerRoom = 1, Amenities = "AC, TV, refrigerator, sofa", ColorCode = "#22c55e" },
                new RoomType { Id = 8, Name = "Deluxe Room", Description = "Deluxe private accommodation", FloorNumber = 3, PricePerDay = 7000, BedsPerRoom = 1, Amenities = "AC, TV, refrigerator, sofa, attendant bed", ColorCode = "#10b981" },
                new RoomType { Id = 9, Name = "Suite", Description = "Full suite with living area", FloorNumber = 4, PricePerDay = 12000, BedsPerRoom = 1, Amenities = "Full suite, living area, kitchenette", ColorCode = "#0d9488" }
            );

            // Precision for decimals
            modelBuilder.Entity<Vitals>()
                .Property(v => v.Weight).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Vitals>()
                .Property(v => v.Height).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Vitals>()
                .Property(v => v.Temperature).HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Expense>()
                .Property(e => e.Amount).HasColumnType("decimal(18,2)");

            modelBuilder.Entity<Bill>()
                .Property(b => b.TotalAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Bill>()
                .Property(b => b.SubTotal).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Bill>()
                .Property(b => b.GSTAmount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Bill>()
                .Property(b => b.Discount).HasColumnType("decimal(18,2)");
            modelBuilder.Entity<Bill>()
                .Property(b => b.InsuranceDeduction).HasColumnType("decimal(18,2)");

            base.OnModelCreating(modelBuilder);
        }
    }
}
//```

//---

//## Step 6 — Create the Database

//Go to** Package Manager Console** and run these two commands one by one:
//```
//Add - Migration AuthTables
//```

//Wait for it to finish then run:
//```
//Update - Database
//```

//---

//## What Just Happened
//```
//Add - Migration    →    EF Core reads your models
//                      Generates SQL to create tables
//                      Creates a file in Migrations folder

//Update-Database  →    Runs that SQL against SQL Server
//                      Creates Users, Roles, RefreshTokens tables
//                      Seeds the 10 default roles automatically
//```

//---

//Go to **SQL Server Object Explorer** in Visual Studio, expand your SQL Server, expand MediCoreDB, expand Tables. You should see:
//```
//dbo.Roles
//dbo.Users
//dbo.RefreshTokens