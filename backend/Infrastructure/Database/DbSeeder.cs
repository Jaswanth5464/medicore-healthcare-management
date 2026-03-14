using MediCore.API.Infrastructure.Database.Context;
using MediCore.API.Modules.Auth.Models;
using MediCore.API.Modules.Doctor.Models;
using MediCore.API.Modules.Laboratory.Models;
using MediCore.API.Modules.OPD.Models;
using MediCore.API.Modules.Pharmacy.Models;
using Microsoft.EntityFrameworkCore;

namespace MediCore.API.Infrastructure.Database
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(MediCoreDbContext context)
        {
            // Note: user guard is now separate - we always seed medicines and lab tests if not present

            // 0. Seed Lab Tests and Medicines
            if (!await context.LabTestMasters.AnyAsync())
            {
                var labTests = new List<LabTestMaster>
                {
                    new LabTestMaster { TestName = "Complete Blood Count (CBC)", NormalRange = "Varies", Price = 400 },
                    new LabTestMaster { TestName = "Lipid Profile", NormalRange = "Cholesterol < 200 mg/dL", Price = 800 },
                    new LabTestMaster { TestName = "Liver Function Test (LFT)", NormalRange = "SGOT: 5-40 U/L", Price = 1000 },
                    new LabTestMaster { TestName = "Kidney Function Test (KFT)", NormalRange = "Creatinine: 0.6-1.2 mg/dL", Price = 900 },
                    new LabTestMaster { TestName = "Thyroid Profile (T3, T4, TSH)", NormalRange = "TSH: 0.4-4.0 mIU/L", Price = 1200 },
                    new LabTestMaster { TestName = "Fasting Blood Sugar (FBS)", NormalRange = "70-100 mg/dL", Price = 150 },
                    new LabTestMaster { TestName = "HbA1c", NormalRange = "4.0-5.6%", Price = 600 },
                    new LabTestMaster { TestName = "Vitamin B12", NormalRange = "200-900 pg/mL", Price = 1100 },
                    new LabTestMaster { TestName = "Vitamin D (25-OH)", NormalRange = "30-100 ng/mL", Price = 1400 },
                    new LabTestMaster { TestName = "Urine Routine & Microscopy", NormalRange = "Pus cells: 0-5 /HPF", Price = 250 },
                    new LabTestMaster { TestName = "C-Reactive Protein (CRP)", NormalRange = "< 10 mg/L", Price = 500 },
                    new LabTestMaster { TestName = "Electrocardiogram (ECG)", NormalRange = "Normal Sinus Rhythm", Price = 400 },
                    new LabTestMaster { TestName = "Chest X-Ray (PA View)", NormalRange = "Normal Study", Price = 600 },
                    new LabTestMaster { TestName = "Ultrasound Whole Abdomen", NormalRange = "NAD", Price = 1500 },
                    new LabTestMaster { TestName = "Dengue NS1 Antigen", NormalRange = "Negative", Price = 700 },
                    new LabTestMaster { TestName = "Malaria Parasite (MP) Smear", NormalRange = "Not seen", Price = 200 },
                    new LabTestMaster { TestName = "Typhoid Widal Test", NormalRange = "< 1:80", Price = 300 },
                    new LabTestMaster { TestName = "Serum Iron Studies", NormalRange = "Iron: 60-170 mcg/dL", Price = 950 },
                    new LabTestMaster { TestName = "Uric Acid", NormalRange = "3.4-7.0 mg/dL", Price = 250 },
                    new LabTestMaster { TestName = "Calcium (Total)", NormalRange = "8.6-10.3 mg/dL", Price = 350 }
                };
                context.LabTestMasters.AddRange(labTests);
            }

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
                new Medicine { Name = "Telma 40", GenericName = "Telmisartan", Category = "Tablet", Manufacturer = "Glenmark", Price = 195.00m, StockQuantity = 250, LowStockThreshold = 40, ExpiryDate = DateTime.UtcNow.AddMonths(24) }
            };

            foreach (var med in meds)
            {
                if (!await context.Medicines.AnyAsync(m => m.Name == med.Name))
                {
                    context.Medicines.Add(med);
                }
            }
            
            await context.SaveChangesAsync();

            // 1. Seed Doctors
            var doctorNames = new[] { "Dr. Rajesh Khanna", "Dr. Shalini Singh", "Dr. Amit Verma", "Dr. Priya Reddy", "Dr. Vikram Seth" };
            var specializations = new[] { "Cardiology", "Neurology", "General Medicine", "Pediatrics", "Orthopedics" };
            var depts = await context.Departments.ToListAsync();

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

            // 2. Seed Patients
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

            // 3. Seed Appointments (Extensive History + Future)
            var doctors = await context.DoctorProfiles.ToListAsync();
            var patients = await context.Users.Where(u => u.UserRoles.Any(ur => ur.RoleId == 10)).ToListAsync();
            var today = DateTime.UtcNow.Date;

            foreach (var patient in patients)
            {
                // Give each patient 10 past appointments spanning the last 6 months
                for(int i=1; i<=10; i++) 
                {
                    var pastDate = today.AddDays(- (i * 15));
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
    }
}
