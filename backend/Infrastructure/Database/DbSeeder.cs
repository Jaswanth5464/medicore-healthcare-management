using MediCore.API.Infrastructure.Database.Context;
using MediCore.API.Modules.Auth.Models;
using MediCore.API.Modules.Doctor.Models;
using MediCore.API.Modules.Laboratory.Models;
using MediCore.API.Modules.OPD.Models;
using MediCore.API.Modules.Patient.Models;
using MediCore.API.Modules.Pharmacy.Models;
using MediCore.API.Modules.Bed.Models;
using Microsoft.EntityFrameworkCore;

namespace MediCore.API.Infrastructure.Database
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(MediCoreDbContext context)
        {
            // Note: user guard is now separate - we always seed medicines and lab tests if not present

            // 0. Seed Lab Tests and Medicines
            // 0. Seed Lab Tests
            var existingLabTests = await context.LabTestMasters.Select(t => t.TestName).ToListAsync();
            var labTestsToSeed = new List<LabTestMaster>
            {
                new LabTestMaster { TestName = "Complete Blood Count (CBC)", NormalRange = "HGB: 13-17 g/dL", Price = 400 },
                new LabTestMaster { TestName = "Lipid Profile", NormalRange = "Cholesterol < 200 mg/dL", Price = 800 },
                new LabTestMaster { TestName = "Liver Function Test (LFT)", NormalRange = "SGOT: 5-40 U/L", Price = 1000 },
                new LabTestMaster { TestName = "Kidney Function Test (KFT)", NormalRange = "Creatinine: 0.6-1.2 mg/dL", Price = 900 },
                new LabTestMaster { TestName = "Thyroid Profile (T3, T4, TSH)", NormalRange = "TSH: 0.4-4.0 mIU/L", Price = 1200 },
                new LabTestMaster { TestName = "Fasting Blood Sugar (FBS)", NormalRange = "70-100 mg/dL", Price = 150 },
                new LabTestMaster { TestName = "HbA1c", NormalRange = "4.0-5.6%", Price = 600 },
                new LabTestMaster { TestName = "Vitamin B12", NormalRange = "200-900 pg/mL", Price = 1100 },
                new LabTestMaster { TestName = "Vitamin D (25-OH)", NormalRange = "30-100 ng/mL", Price = 1400 },
                new LabTestMaster { TestName = "Urine Routine & Microscopy", NormalRange = "NIL", Price = 250 },
                new LabTestMaster { TestName = "C-Reactive Protein (CRP)", NormalRange = "< 10 mg/L", Price = 500 },
                new LabTestMaster { TestName = "Electrocardiogram (ECG)", NormalRange = "Normal Sinus Rhythm", Price = 400 },
                new LabTestMaster { TestName = "Chest X-Ray (PA View)", NormalRange = "Normal Study", Price = 600 },
                new LabTestMaster { TestName = "Ultrasound Whole Abdomen", NormalRange = "NAD", Price = 1500 },
                new LabTestMaster { TestName = "Dengue NS1 Antigen", NormalRange = "Negative", Price = 700 },
                new LabTestMaster { TestName = "Malaria Parasite (MP) Smear", NormalRange = "Not seen", Price = 200 },
                new LabTestMaster { TestName = "Typhoid Widal Test", NormalRange = "Negative", Price = 300 },
                new LabTestMaster { TestName = "Serum Iron Studies", NormalRange = "60-170 mcg/dL", Price = 950 },
                new LabTestMaster { TestName = "Uric Acid", NormalRange = "3.4-7.0 mg/dL", Price = 250 },
                new LabTestMaster { TestName = "Calcium (Total)", NormalRange = "8.6-10.3 mg/dL", Price = 350 },
                new LabTestMaster { TestName = "Prostate Specific Antigen (PSA)", NormalRange = "< 4 ng/mL", Price = 1100 },
                new LabTestMaster { TestName = "Electrolytes (Na+, K+, Cl-)", NormalRange = "Na: 135-145", Price = 550 },
                new LabTestMaster { TestName = "Blood Grouping & Rh Type", NormalRange = "N/A", Price = 150 },
                new LabTestMaster { TestName = "HIV 1/2 Antibody", NormalRange = "Non-reactive", Price = 450 },
                new LabTestMaster { TestName = "HBsAg (Hepatitis B)", NormalRange = "Non-reactive", Price = 450 },
                new LabTestMaster { TestName = "HCV (Hepatitis C)", NormalRange = "Non-reactive", Price = 600 },
                new LabTestMaster { TestName = "Serum Amylase", NormalRange = "28-100 U/L", Price = 850 },
                new LabTestMaster { TestName = "Troponin-I (Cardiac)", NormalRange = "< 0.04 ng/mL", Price = 1800 },
                new LabTestMaster { TestName = "Prothrombin Time (PT/INR)", NormalRange = "INR: 0.8-1.2", Price = 750 },
                new LabTestMaster { TestName = "Serum Ferritin", NormalRange = "12-300 ng/mL", Price = 1100 }
            };

            foreach (var test in labTestsToSeed)
            {
                if (!existingLabTests.Contains(test.TestName))
                {
                    context.LabTestMasters.Add(test);
                }
            }
            await context.SaveChangesAsync();

            var meds = new List<Medicine>
            {
                new Medicine { Name = "Augmentin 625mg", GenericName = "Amoxicillin + Clavulanic Acid", Category = "Tablet", Manufacturer = "GSK", Price = 450.00m, StockQuantity = 200, LowStockThreshold = 50, ExpiryDate = DateTime.UtcNow.AddMonths(18) },
                new Medicine { Name = "Panadol 500mg", GenericName = "Paracetamol", Category = "Tablet", Manufacturer = "GSK", Price = 30.00m, StockQuantity = 500, LowStockThreshold = 100, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Metformin 500mg", GenericName = "Metformin Hydrochloride", Category = "Tablet", Manufacturer = "Merck", Price = 120.00m, StockQuantity = 300, LowStockThreshold = 100, ExpiryDate = DateTime.UtcNow.AddMonths(20) },
                new Medicine { Name = "Lipitor 20mg", GenericName = "Atorvastatin", Category = "Tablet", Manufacturer = "Pfizer", Price = 850.00m, StockQuantity = 150, LowStockThreshold = 40, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Amlodipine 5mg", GenericName = "Amlodipine Besylate", Category = "Tablet", Manufacturer = "Sandoz", Price = 90.00m, StockQuantity = 400, LowStockThreshold = 80, ExpiryDate = DateTime.UtcNow.AddMonths(22) },
                new Medicine { Name = "Azithromycin 500mg", GenericName = "Azithromycin", Category = "Tablet", Manufacturer = "Pfizer", Price = 220.00m, StockQuantity = 250, LowStockThreshold = 60, ExpiryDate = DateTime.UtcNow.AddMonths(15) },
                new Medicine { Name = "Pantoprazole 40mg", GenericName = "Pantoprazole", Category = "Capsule", Manufacturer = "Takeda", Price = 180.00m, StockQuantity = 300, LowStockThreshold = 70, ExpiryDate = DateTime.UtcNow.AddMonths(12) },
                new Medicine { Name = "Cetirizine 10mg", GenericName = "Cetirizine Hydrochloride", Category = "Tablet", Manufacturer = "Dr. Reddy's", Price = 45.00m, StockQuantity = 400, LowStockThreshold = 50, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Ibuprofen 400mg", GenericName = "Ibuprofen", Category = "Tablet", Manufacturer = "Abbott", Price = 65.00m, StockQuantity = 350, LowStockThreshold = 50, ExpiryDate = DateTime.UtcNow.AddMonths(18) },
                new Medicine { Name = "Amoxicillin 500mg", GenericName = "Amoxicillin", Category = "Capsule", Manufacturer = "Sandoz", Price = 150.00m, StockQuantity = 200, LowStockThreshold = 50, ExpiryDate = DateTime.UtcNow.AddMonths(18) },
                new Medicine { Name = "Ciprofloxacin 500mg", GenericName = "Ciprofloxacin", Category = "Tablet", Manufacturer = "Bayer", Price = 280.00m, StockQuantity = 180, LowStockThreshold = 40, ExpiryDate = DateTime.UtcNow.AddMonths(18) },
                new Medicine { Name = "Omeprazole 20mg", GenericName = "Omeprazole", Category = "Capsule", Manufacturer = "AstraZeneca", Price = 140.00m, StockQuantity = 250, LowStockThreshold = 50, ExpiryDate = DateTime.UtcNow.AddMonths(12) },
                new Medicine { Name = "Losartan 50mg", GenericName = "Losartan Potassium", Category = "Tablet", Manufacturer = "Merck", Price = 110.00m, StockQuantity = 200, LowStockThreshold = 50, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Gabapentin 300mg", GenericName = "Gabapentin", Category = "Capsule", Manufacturer = "Pfizer", Price = 380.00m, StockQuantity = 100, LowStockThreshold = 30, ExpiryDate = DateTime.UtcNow.AddMonths(12) },
                new Medicine { Name = "Hydrochlorothiazide 25mg", GenericName = "Hydrochlorothiazide", Category = "Tablet", Manufacturer = "Sandoz", Price = 55.00m, StockQuantity = 300, LowStockThreshold = 100, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Sertraline 50mg", GenericName = "Sertraline Hydrochloride", Category = "Tablet", Manufacturer = "Pfizer", Price = 520.00m, StockQuantity = 120, LowStockThreshold = 30, ExpiryDate = DateTime.UtcNow.AddMonths(18) },
                new Medicine { Name = "Simvastatin 20mg", GenericName = "Simvastatin", Category = "Tablet", Manufacturer = "Merck", Price = 190.00m, StockQuantity = 180, LowStockThreshold = 40, ExpiryDate = DateTime.UtcNow.AddMonths(22) },
                new Medicine { Name = "Montelukast 10mg", GenericName = "Montelukast Sodium", Category = "Tablet", Manufacturer = "Merck", Price = 240.00m, StockQuantity = 200, LowStockThreshold = 50, ExpiryDate = DateTime.UtcNow.AddMonths(20) },
                new Medicine { Name = "Rosuvastatin 10mg", GenericName = "Rosuvastatin Calcium", Category = "Tablet", Manufacturer = "AstraZeneca", Price = 420.00m, StockQuantity = 150, LowStockThreshold = 40, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Ventolin Inhaler", GenericName = "Albuterol", Category = "Inhaler", Manufacturer = "GSK", Price = 650.00m, StockQuantity = 80, LowStockThreshold = 20, ExpiryDate = DateTime.UtcNow.AddMonths(12) },
                new Medicine { Name = "Metoprolol 50mg", GenericName = "Metoprolol Tartrate", Category = "Tablet", Manufacturer = "Novartis", Price = 135.00m, StockQuantity = 220, LowStockThreshold = 50, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Furosemide 40mg", GenericName = "Furosemide", Category = "Tablet", Manufacturer = "Sanofi", Price = 45.00m, StockQuantity = 300, LowStockThreshold = 80, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Prednisone 5mg", GenericName = "Prednisone", Category = "Tablet", Manufacturer = "Upjohn", Price = 75.00m, StockQuantity = 150, LowStockThreshold = 50, ExpiryDate = DateTime.UtcNow.AddMonths(18) },
                new Medicine { Name = "Levothyroxine 50mcg", GenericName = "Levothyroxine Sodium", Category = "Tablet", Manufacturer = "AbbVie", Price = 340.00m, StockQuantity = 250, LowStockThreshold = 50, ExpiryDate = DateTime.UtcNow.AddMonths(20) },
                new Medicine { Name = "Multivitamin Complex", GenericName = "Vitamin Supplement", Category = "Tablet", Manufacturer = "Centrum", Price = 950.00m, StockQuantity = 100, LowStockThreshold = 25, ExpiryDate = DateTime.UtcNow.AddMonths(12) },
                new Medicine { Name = "Clopilet 75mg", GenericName = "Clopidogrel", Category = "Tablet", Manufacturer = "Sun Pharma", Price = 210.00m, StockQuantity = 240, LowStockThreshold = 60, ExpiryDate = DateTime.UtcNow.AddMonths(18) },
                new Medicine { Name = "Humulin R", GenericName = "Insulin Regular", Category = "Injection", Manufacturer = "Eli Lilly", Price = 1200.00m, StockQuantity = 50, LowStockThreshold = 10, ExpiryDate = DateTime.UtcNow.AddMonths(6) },
                new Medicine { Name = "Dolo 650", GenericName = "Paracetamol", Category = "Tablet", Manufacturer = "Micro Labs", Price = 35.00m, StockQuantity = 1000, LowStockThreshold = 200, ExpiryDate = DateTime.UtcNow.AddMonths(36) },
                new Medicine { Name = "Allegra 120mg", GenericName = "Fexofenadine", Category = "Tablet", Manufacturer = "Sanofi", Price = 195.00m, StockQuantity = 300, LowStockThreshold = 50, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Vicks Action 500", GenericName = "Acetaminophen + Phenylephrine", Category = "Tablet", Manufacturer = "P&G", Price = 40.00m, StockQuantity = 600, LowStockThreshold = 100, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Digene Gel 200ml", GenericName = "Aluminium + Magnesium + Simethicone", Category = "Syrup", Manufacturer = "Abbott", Price = 165.00m, StockQuantity = 120, LowStockThreshold = 30, ExpiryDate = DateTime.UtcNow.AddMonths(18) },
                new Medicine { Name = "Combiflam", GenericName = "Ibuprofen + Paracetamol", Category = "Tablet", Manufacturer = "Sanofi", Price = 45.00m, StockQuantity = 800, LowStockThreshold = 150, ExpiryDate = DateTime.UtcNow.AddMonths(30) },
                new Medicine { Name = "Telma 40", GenericName = "Telmisartan", Category = "Tablet", Manufacturer = "Glenmark", Price = 195.00m, StockQuantity = 250, LowStockThreshold = 40, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Thyronorm 50mcg", GenericName = "Levothyroxine", Category = "Tablet", Manufacturer = "Abbott", Price = 220.00m, StockQuantity = 300, LowStockThreshold = 50, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Liv 52 DS", GenericName = "Herbal Liver Support", Category = "Tablet", Manufacturer = "Himalaya", Price = 180.00m, StockQuantity = 400, LowStockThreshold = 60, ExpiryDate = DateTime.UtcNow.AddMonths(36) },
                new Medicine { Name = "Crocin Advance", GenericName = "Paracetamol", Category = "Tablet", Manufacturer = "GSK", Price = 45.00m, StockQuantity = 500, LowStockThreshold = 100, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Limcee 500mg", GenericName = "Vitamin C", Category = "Tablet", Manufacturer = "Abbott", Price = 25.00m, StockQuantity = 1000, LowStockThreshold = 100, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Zyrtec 10mg", GenericName = "Cetirizine", Category = "Tablet", Manufacturer = "GSK", Price = 60.00m, StockQuantity = 300, LowStockThreshold = 50, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Claritin 10mg", GenericName = "Loratadine", Category = "Tablet", Manufacturer = "Bayer", Price = 75.00m, StockQuantity = 250, LowStockThreshold = 50, ExpiryDate = DateTime.UtcNow.AddMonths(18) },
                new Medicine { Name = "Gaviscon Liquid", GenericName = "Sodium Alginate", Category = "Syrup", Manufacturer = "Reckitt", Price = 290.00m, StockQuantity = 100, LowStockThreshold = 20, ExpiryDate = DateTime.UtcNow.AddMonths(12) },
                new Medicine { Name = "Vicks VapoRub 50g", GenericName = "Menthol + Camphor", Category = "Ointment", Manufacturer = "P&G", Price = 155.00m, StockQuantity = 200, LowStockThreshold = 40, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Sporlac DS", GenericName = "Lactic Acid Bacillus", Category = "Tablet", Manufacturer = "Sanofi", Price = 110.00m, StockQuantity = 400, LowStockThreshold = 80, ExpiryDate = DateTime.UtcNow.AddMonths(18) },
                new Medicine { Name = "Ecosprin 75", GenericName = "Aspirin", Category = "Tablet", Manufacturer = "USV", Price = 15.00m, StockQuantity = 1000, LowStockThreshold = 200, ExpiryDate = DateTime.UtcNow.AddMonths(36) },
                new Medicine { Name = "Atarax 25mg", GenericName = "Hydroxyzine", Category = "Tablet", Manufacturer = "UCB", Price = 145.00m, StockQuantity = 200, LowStockThreshold = 40, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Betadine 5% Solution", GenericName = "Povidone-Iodine", Category = "Syrup", Manufacturer = "Win-Medicare", Price = 125.00m, StockQuantity = 150, LowStockThreshold = 30, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Dettol Liquid 250ml", GenericName = "Chloroxylenol", Category = "Syrup", Manufacturer = "Reckitt", Price = 115.00m, StockQuantity = 250, LowStockThreshold = 50, ExpiryDate = DateTime.UtcNow.AddMonths(36) },
                new Medicine { Name = "Folvite 5mg", GenericName = "Folic Acid", Category = "Tablet", Manufacturer = "Pfizer", Price = 45.00m, StockQuantity = 500, LowStockThreshold = 100, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Shelcal 500", GenericName = "Calcium + Vitamin D3", Category = "Tablet", Manufacturer = "Torrent Pharma", Price = 135.00m, StockQuantity = 400, LowStockThreshold = 80, ExpiryDate = DateTime.UtcNow.AddMonths(18) },
                new Medicine { Name = "Becosules Capsule", GenericName = "Vitamin B-Complex", Category = "Capsule", Manufacturer = "Pfizer", Price = 55.00m, StockQuantity = 600, LowStockThreshold = 100, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Neurobion Forte", GenericName = "Vitamin B1+B6+B12", Category = "Tablet", Manufacturer = "P&G", Price = 38.00m, StockQuantity = 800, LowStockThreshold = 150, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Glycomet GP 1", GenericName = "Metformin + Glimepiride", Category = "Tablet", Manufacturer = "USV", Price = 165.00m, StockQuantity = 300, LowStockThreshold = 50, ExpiryDate = DateTime.UtcNow.AddMonths(18) },
                new Medicine { Name = "Gemcal Capsule", GenericName = "Calcitriol + Calcium", Category = "Capsule", Manufacturer = "Alkem", Price = 295.00m, StockQuantity = 200, LowStockThreshold = 40, ExpiryDate = DateTime.UtcNow.AddMonths(18) },
                new Medicine { Name = "Omez 20", GenericName = "Omeprazole", Category = "Capsule", Manufacturer = "Dr. Reddy's", Price = 115.00m, StockQuantity = 400, LowStockThreshold = 80, ExpiryDate = DateTime.UtcNow.AddMonths(24) },
                new Medicine { Name = "Nurokind LC", GenericName = "Levocarnitine + Mecobalamin", Category = "Tablet", Manufacturer = "Mankind", Price = 225.00m, StockQuantity = 150, LowStockThreshold = 30, ExpiryDate = DateTime.UtcNow.AddMonths(18) }
            };

            foreach (var med in meds)
            {
                if (!await context.Medicines.AnyAsync(m => m.Name == med.Name))
                {
                    context.Medicines.Add(med);
                }
            }
            
            await context.SaveChangesAsync();

            // ─── 0. Seed Departments ──────────────────────────────────
            if (!await context.Departments.AnyAsync())
            {
                var departments = new List<Department>
                {
                    new Department { Name = "General Medicine", Description = "General health consultations", Icon = "🏥", FloorNumber = 1 },
                    new Department { Id = 2, Name = "Cardiology", Description = "Heart care", Icon = "❤️", FloorNumber = 2 },
                    new Department { Id = 3, Name = "Neurology", Description = "Brain care", Icon = "🧠", FloorNumber = 2 },
                    new Department { Id = 4, Name = "Orthopedics", Description = "Bone care", Icon = "🦴", FloorNumber = 3 },
                    new Department { Id = 5, Name = "Pediatrics", Description = "Children care", Icon = "👶", FloorNumber = 1 },
                    new Department { Id = 6, Name = "Gynecology", Description = "Women health", Icon = "🌸", FloorNumber = 4 },
                    new Department { Id = 7, Name = "Dermatology", Description = "Skin care", Icon = "✨", FloorNumber = 2 },
                    new Department { Id = 8, Name = "Ophthalmology", Description = "Eye care", Icon = "👁️", FloorNumber = 1 },
                    new Department { Id = 9, Name = "ENT", Description = "Ear nose throat", Icon = "👂", FloorNumber = 3 },
                    new Department { Id = 10, Name = "Psychiatry", Description = "Mental health", Icon = "🧘", FloorNumber = 4 }
                };
                context.Departments.AddRange(departments);
                await context.SaveChangesAsync();
            }

            // 1. Seed Doctors
            var depts = await context.Departments.ToListAsync();
            if (depts.Any() && !await context.Users.AnyAsync(u => u.UserRoles.Any(ur => ur.RoleId == 4)))
            {

                for (int i = 0; i < doctorNames.Length; i++)
                {
                    var user = new User
                    {
                        FullName = doctorNames[i],
                        Email = $"doctor{i + 1}@medicore.com",
                        PhoneNumber = $"987654321{i}",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Pass@123"),
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UserRoles = new List<UserRole> { new UserRole { RoleId = 4 } }
                    };
                    context.Users.Add(user);
                    await context.SaveChangesAsync();

                    var doctor = new DoctorProfile
                    {
                        UserId = user.Id,
                        DepartmentId = depts[i % depts.Count].Id,
                        Specialization = specializations[i],
                        Qualification = "MD, MBBS",
                        ExperienceYears = 10 + i,
                        ConsultationFee = 500 + (i * 100),
                        AvailableDays = "Mon,Tue,Wed,Thu,Fri,Sat",
                        MorningStart = new TimeSpan(9, 0, 0),
                        MorningEnd = new TimeSpan(13, 0, 0),
                        HasEveningShift = true,
                        EveningStart = new TimeSpan(17, 0, 0),
                        EveningEnd = new TimeSpan(21, 0, 0),
                        SlotDurationMinutes = 15,
                        IsActive = true
                    };
                    context.DoctorProfiles.Add(doctor);
                }
                await context.SaveChangesAsync();
            }

            // 2. Seed Patients
            if (!await context.Users.AnyAsync(u => u.UserRoles.Any(ur => ur.RoleId == 10)))
            {
                var patientNames = new[] { "Rahul Kumar", "Sita Sharma", "John Doe", "Anita Gupta" };
                for (int i = 0; i < patientNames.Length; i++)
                {
                    var user = new User
                    {
                        FullName = patientNames[i],
                        Email = $"patient{i + 1}@example.com",
                        PhoneNumber = $"887766554{i}",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Pass@123"),
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UserRoles = new List<UserRole> { new UserRole { RoleId = 10 } }
                    };
                    context.Users.Add(user);
                }
                await context.SaveChangesAsync();
            }

            // 3. Seed Appointments (Extensive History + Future)
            if (!await context.Appointments.AnyAsync())
            {
                var doctors = await context.DoctorProfiles.ToListAsync();
                var patients = await context.Users.Where(u => u.UserRoles.Any(ur => ur.RoleId == 10)).ToListAsync();
                var today = DateTime.UtcNow.Date;

                foreach (var patient in patients)
                {
                    // Give each patient 10 past appointments spanning the last 6 months
                    for (int i = 1; i <= 10; i++)
                    {
                        var pastDate = today.AddDays(-(i * 15));
                        var doc = doctors[i % doctors.Count];

                        var prevAppt = new Appointment
                        {
                            TokenNumber = $"OPDPST{pastDate:yyyyMMdd}{patient.Id}{i}",
                            PatientUserId = patient.Id,
                            DoctorProfileId = doc.Id,
                            DepartmentId = doc.DepartmentId,
                            AppointmentDate = pastDate,
                            TimeSlot = new TimeSpan(10, 0, 0),
                            Status = "Completed",
                            VisitType = "Consultation",
                            ConsultationFee = doc.ConsultationFee,
                            PaymentStatus = "Paid",
                            CreatedAt = pastDate.AddDays(-2),
                            ConsultationStartedAt = pastDate.AddHours(10),
                            CompletedAt = pastDate.AddHours(10).AddMinutes(15)
                        };
                        context.Appointments.Add(prevAppt);
                    }

                    // Today's Appointment
                    var todayDoc = doctors[0];
                    var todayAppt = new Appointment
                    {
                        TokenNumber = $"OPD{today:yyyyMMdd}00{patient.Id}",
                        PatientUserId = patient.Id,
                        DoctorProfileId = todayDoc.Id,
                        DepartmentId = todayDoc.DepartmentId,
                        AppointmentDate = today,
                        TimeSlot = new TimeSpan(11, 0, 0),
                        Status = "Scheduled",
                        VisitType = "Consultation",
                        ConsultationFee = todayDoc.ConsultationFee,
                        PaymentStatus = "Pending",
                        CreatedAt = today.AddDays(-1)
                    };
                    context.Appointments.Add(todayAppt);

                    // Future Appointment (Tomorrow)
                    var tomDoc = doctors[1];
                    var futureAppt = new Appointment
                    {
                        TokenNumber = $"OPDFUT{today.AddDays(1):yyyyMMdd}00{patient.Id}",
                        PatientUserId = patient.Id,
                        DoctorProfileId = tomDoc.Id,
                        DepartmentId = tomDoc.DepartmentId,
                        AppointmentDate = today.AddDays(1),
                        TimeSlot = new TimeSpan(14, 0, 0),
                        Status = "Scheduled",
                        VisitType = "FollowUp",
                        ConsultationFee = tomDoc.ConsultationFee,
                        PaymentStatus = "Pending",
                        CreatedAt = today
                    };
                    context.Appointments.Add(futureAppt);
                }
                await context.SaveChangesAsync();
            }

            // 4. Seed Room Types
            var existingRoomTypes = await context.RoomTypes.ToListAsync();
            var roomTypesToSeed = new List<RoomType>
            {
                new RoomType { Name = "Emergency", Description = "Emergency Ward", PricePerDay = 2000, BedsPerRoom = 1 },
                new RoomType { Name = "ICU", Description = "Intensive Care Unit", PricePerDay = 8000, BedsPerRoom = 1 },
                new RoomType { Name = "NICU", Description = "Neonatal ICU", PricePerDay = 10000, BedsPerRoom = 1 },
                new RoomType { Name = "General Ward Male", Description = "General Ward for Male Patients", PricePerDay = 1200, BedsPerRoom = 6 },
                new RoomType { Name = "General Ward Female", Description = "General Ward for Female Patients", PricePerDay = 1200, BedsPerRoom = 6 },
                new RoomType { Name = "Semi-Private Room", Description = "Two beds per room with partition", PricePerDay = 2500, BedsPerRoom = 2 },
                new RoomType { Name = "Private Room", Description = "Single occupancy private room", PricePerDay = 4500, BedsPerRoom = 1 },
                new RoomType { Name = "Deluxe Room", Description = "Premium private room with amenities", PricePerDay = 7000, BedsPerRoom = 1 },
                new RoomType { Name = "Suite", Description = "Luxury suite with attendant room", PricePerDay = 12000, BedsPerRoom = 1 }
            };

            foreach (var rt in roomTypesToSeed)
            {
                if (!existingRoomTypes.Any(x => x.Name == rt.Name))
                {
                    context.RoomTypes.Add(rt);
                }
            }
            await context.SaveChangesAsync();

            // 5. Seed Rooms and Beds (IPD)
            var currentRoomTypes = await context.RoomTypes.ToListAsync();
            var existingRooms = await context.Rooms.Select(r => r.RoomNumber).ToListAsync();
            var roomsToAdd = new List<Room>();

            // Ground Floor: Emergency (6 beds), ICU (8 beds), NICU (4 beds)
            var emergencyType = currentRoomTypes.FirstOrDefault(t => t.Name == "Emergency");
            if (emergencyType != null)
            {
                for (int i = 1; i <= 6; i++)
                {
                    var num = $"E-10{i}";
                    if (!existingRooms.Contains(num))
                        roomsToAdd.Add(new Room { RoomNumber = num, RoomName = $"Emergency Room {i}", RoomTypeId = emergencyType.Id, FloorNumber = 0, IsActive = true });
                }
            }

            var icuType = currentRoomTypes.FirstOrDefault(t => t.Name == "ICU");
            if (icuType != null)
            {
                for (int i = 1; i <= 8; i++)
                {
                    var num = $"ICU-{i:D2}";
                    if (!existingRooms.Contains(num))
                        roomsToAdd.Add(new Room { RoomNumber = num, RoomName = $"ICU Ward {i}", RoomTypeId = icuType.Id, FloorNumber = 0, IsActive = true });
                }
            }

            var nicuType = currentRoomTypes.FirstOrDefault(t => t.Name == "NICU");
            if (nicuType != null)
            {
                for (int i = 1; i <= 4; i++)
                {
                    var num = $"NICU-{i:D2}";
                    if (!existingRooms.Contains(num))
                        roomsToAdd.Add(new Room { RoomNumber = num, RoomName = $"NICU Ward {i}", RoomTypeId = nicuType.Id, FloorNumber = 0, IsActive = true });
                }
            }

            // First Floor: General Wards
            var genMaleType = currentRoomTypes.FirstOrDefault(t => t.Name == "General Ward Male");
            if (genMaleType != null)
            {
                for (int i = 1; i <= 10; i++)
                {
                    var num = $"GM-1{i:D2}";
                    if (!existingRooms.Contains(num))
                        roomsToAdd.Add(new Room { RoomNumber = num, RoomName = $"General Male {num}", RoomTypeId = genMaleType.Id, FloorNumber = 1, IsActive = true });
                }
            }

            var genFemaleType = currentRoomTypes.FirstOrDefault(t => t.Name == "General Ward Female");
            if (genFemaleType != null)
            {
                for (int i = 1; i <= 10; i++)
                {
                    var num = $"GF-1{i:D2}";
                    if (!existingRooms.Contains(num))
                        roomsToAdd.Add(new Room { RoomNumber = num, RoomName = $"General Female {num}", RoomTypeId = genFemaleType.Id, FloorNumber = 1, IsActive = true });
                }
            }

            // Second Floor: Semi-Private
            var semiPrivateType = currentRoomTypes.FirstOrDefault(t => t.Name == "Semi-Private Room");
            if (semiPrivateType != null)
            {
                for (int i = 1; i <= 10; i++)
                {
                    var num = $"SP-2{i:D2}";
                    if (!existingRooms.Contains(num))
                        roomsToAdd.Add(new Room { RoomNumber = num, RoomName = $"Semi-Private {num}", RoomTypeId = semiPrivateType.Id, FloorNumber = 2, IsActive = true });
                }
            }

            // Third Floor: Private, Deluxe
            var privateType = currentRoomTypes.FirstOrDefault(t => t.Name == "Private Room");
            if (privateType != null)
            {
                for (int i = 1; i <= 8; i++)
                {
                    var num = $"PR-3{i:D2}";
                    if (!existingRooms.Contains(num))
                        roomsToAdd.Add(new Room { RoomNumber = num, RoomName = $"Private {num}", RoomTypeId = privateType.Id, FloorNumber = 3, IsActive = true });
                }
            }

            var deluxeType = currentRoomTypes.FirstOrDefault(t => t.Name == "Deluxe Room");
            if (deluxeType != null)
            {
                for (int i = 1; i <= 4; i++)
                {
                    var num = $"DX-3{i:D2}";
                    if (!existingRooms.Contains(num))
                        roomsToAdd.Add(new Room { RoomNumber = num, RoomName = $"Deluxe {num}", RoomTypeId = deluxeType.Id, FloorNumber = 3, IsActive = true });
                }
            }

            // Fourth Floor: Suite
            var suiteType = currentRoomTypes.FirstOrDefault(t => t.Name == "Suite");
            if (suiteType != null)
            {
                for (int i = 1; i <= 2; i++)
                {
                    var num = $"SU-4{i:D2}";
                    if (!existingRooms.Contains(num))
                        roomsToAdd.Add(new Room { RoomNumber = num, RoomName = $"Suite {num}", RoomTypeId = suiteType.Id, FloorNumber = 4, IsActive = true });
                }
            }

            if (roomsToAdd.Any())
            {
                context.Rooms.AddRange(roomsToAdd);
                await context.SaveChangesAsync();
            }

            // Now seed BedAllocations only for NEWLY added rooms or existing rooms without beds
            var allActiveRooms = await context.Rooms.Include(r => r.RoomType).ToListAsync();
            var existingBedsInRooms = await context.BedAllocations.GroupBy(b => b.RoomId).Select(g => g.Key).ToListAsync();
            var bedsToAdd = new List<BedAllocation>();

            foreach (var room in allActiveRooms)
            {
                if (!existingBedsInRooms.Contains(room.Id))
                {
                    int bedsPerRoom = room.RoomType?.BedsPerRoom ?? 1;
                    for (int i = 1; i <= bedsPerRoom; i++)
                    {
                        bedsToAdd.Add(new BedAllocation
                        {
                            BedNumber = $"{room.RoomNumber}-B{i}",
                            RoomId = room.Id,
                            RoomTypeId = room.RoomTypeId,
                            FloorNumber = room.FloorNumber,
                            Status = "Available",
                            IsActive = true
                        });
                    }
                }
            }

            if (bedsToAdd.Any())
            {
                context.BedAllocations.AddRange(bedsToAdd);
                await context.SaveChangesAsync();
            }
        }
    }
}
