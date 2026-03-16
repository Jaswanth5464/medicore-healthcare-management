using MediCore.API.Modules.Pharmacy.Models;
using MediCore.API.Modules.Finance.Models;
using MediCore.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using MediCore.API.Infrastructure.Database.Context;

namespace MediCore.API.Modules.Pharmacy.Controllers
{
    [ApiController]
    [Route("api/pharmacy")]
    [Authorize(Roles = "SuperAdmin,HospitalAdmin,Pharmacist,Doctor")]
    public class PharmacyController : ControllerBase
    {
        private readonly MediCoreDbContext _context;
        private readonly IHubContext<MediCore.API.Hubs.MediCoreHub> _hubContext;
        private readonly IEmailService _emailService;

        public PharmacyController(
            MediCoreDbContext context,
            IHubContext<MediCore.API.Hubs.MediCoreHub> hubContext,
            IEmailService emailService)
        {
            _context = context;
            _hubContext = hubContext;
            _emailService = emailService;
        }

        // GET api/pharmacy/inventory
        [HttpGet("inventory")]
        public async Task<IActionResult> GetInventory()
        {
            var medicines = await _context.Medicines
                .OrderBy(m => m.Name)
                .ToListAsync();
            return Ok(new { success = true, data = medicines });
        }

        // POST api/pharmacy/inventory  (Add new medicine)
        [HttpPost("inventory")]
        public async Task<IActionResult> AddMedicine([FromBody] CreateMedicineDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Invalid medicine data" });

            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { success = false, message = "Medicine name is required" });

            // Check for duplicate
            var exists = await _context.Medicines.AnyAsync(m => m.Name.ToLower() == dto.Name.ToLower().Trim());
            if (exists)
                return Conflict(new { success = false, message = "A medicine with this name already exists" });

            var newMed = new Medicine
            {
                Name = dto.Name.Trim(),
                GenericName = dto.GenericName?.Trim() ?? string.Empty,
                Category = dto.Category?.Trim() ?? "Tablet",
                Manufacturer = dto.Manufacturer?.Trim() ?? string.Empty,
                Price = dto.Price,
                StockQuantity = dto.StockQuantity,
                LowStockThreshold = dto.LowStockThreshold > 0 ? dto.LowStockThreshold : 50,
                ExpiryDate = dto.ExpiryDate,
                CreatedAt = DateTime.UtcNow
            };

            _context.Medicines.Add(newMed);
            await _context.SaveChangesAsync();

            // Notify pharmacists of new stock item
            await _hubContext.Clients.Group(MediCore.API.Hubs.MediCoreHub.PharmacistGroup)
                .SendAsync("InventoryUpdated", new { action = "added", medicine = newMed.Name });

            return Ok(new { success = true, message = "Medicine added successfully", data = newMed });
        }

        [HttpPut("inventory/{id}")]
        public async Task<IActionResult> UpdateMedicine(int id, [FromBody] Medicine medicine)
        {
            var existing = await _context.Medicines.FindAsync(id);
            if (existing == null) return NotFound(new { success = false, message = "Medicine not found" });

            existing.Name = medicine.Name;
            existing.GenericName = medicine.GenericName;
            existing.Category = medicine.Category;
            existing.Manufacturer = medicine.Manufacturer;
            existing.Price = medicine.Price;
            existing.StockQuantity = medicine.StockQuantity;
            existing.LowStockThreshold = medicine.LowStockThreshold;
            existing.ExpiryDate = medicine.ExpiryDate;

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Medicine updated successfully" });
        }

        // DELETE api/pharmacy/inventory/{id}
        [HttpDelete("inventory/{id}")]
        public async Task<IActionResult> DeleteMedicine(int id)
        {
            var medicine = await _context.Medicines.FindAsync(id);
            if (medicine == null) return NotFound(new { success = false, message = "Medicine not found" });

            _context.Medicines.Remove(medicine);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Medicine deleted successfully" });
        }

        // GET api/pharmacy/queue
        [HttpGet("queue")]
        public async Task<IActionResult> GetDispensingQueue()
        {
            var today = DateTime.UtcNow.Date;
            var prescriptions = await _context.Prescriptions
                .Include(p => p.Appointment)
                .ThenInclude(a => a.PatientUser)
                .Include(p => p.Appointment)
                .ThenInclude(a => a.DoctorProfile)
                .ThenInclude(d => d.User)
                .Where(p => !p.IsDispensed && p.CreatedAt >= today.AddDays(-3)) // Last 3 days
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new {
                    id = p.Id,
                    appointmentId = p.AppointmentId,
                    patientName = _context.Users.Where(u => u.Id == p.PatientUserId).Select(u => u.FullName).FirstOrDefault() ?? "Unknown Patient",
                    doctorName = _context.Users.Where(u => u.Id == _context.DoctorProfiles.Where(d => d.Id == p.DoctorProfileId).Select(d => d.UserId).FirstOrDefault()).Select(u => u.FullName).FirstOrDefault() ?? "Staff Doctor",
                    medicinesJson = p.MedicinesJson,
                    advice = p.Advice,
                    createdAt = p.CreatedAt,
                    isDispensed = p.IsDispensed
                })
                .ToListAsync();

            return Ok(new { success = true, data = prescriptions });
        }

        // POST api/pharmacy/dispense/{prescriptionId}
        [HttpPost("dispense/{prescriptionId}")]
        public async Task<IActionResult> DispensePrescription(int prescriptionId)
        {
            var prescription = await _context.Prescriptions.FindAsync(prescriptionId);
            if (prescription == null) return NotFound(new { success = false, message = "Prescription not found" });

            if (prescription.IsDispensed) return BadRequest(new { success = false, message = "Already dispensed" });

            // Parse medicines and calculate total
            var medList = System.Text.Json.JsonSerializer.Deserialize<List<PrescribedMed>>(prescription.MedicinesJson ?? "[]") ?? new List<PrescribedMed>();
            decimal subTotal = 0;

            foreach (var pMed in medList)
            {
                var med = await _context.Medicines.FirstOrDefaultAsync(m => m.Name == pMed.name);
                if (med != null)
                {
                    int count = pMed.count > 0 ? pMed.count : 1; 
                    subTotal += med.Price * count;

                    // Deduct Stock
                    if (med.StockQuantity >= count)
                    {
                        med.StockQuantity -= count;
                    }
                }
            }

            decimal gstPercent = 18;
            decimal gstAmount = Math.Round(subTotal * (gstPercent / 100), 2);
            decimal totalBill = subTotal + gstAmount;

            // Mark dispensed
            prescription.IsDispensed = true;
            prescription.DispensedAt = DateTime.UtcNow;

            // Create Bill
            var bill = new Bill
            {
                BillNumber = $"PHARM-{DateTime.UtcNow:yyyyMMdd}-{prescription.Id}",
                PatientUserId = prescription.PatientUserId,
                DoctorProfileId = prescription.DoctorProfileId,
                BillSource = "Pharmacy",
                SourceReferenceId = prescription.Id,
                Items = prescription.MedicinesJson ?? "[]",
                SubTotal = subTotal,
                GSTPercent = gstPercent,
                GSTAmount = gstAmount,
                TotalAmount = totalBill,
                Status = "Paid", 
                PaymentMode = "Cash",
                PaidAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
            _context.Bills.Add(bill);

            await _context.SaveChangesAsync();

            // Notify Patient
            var appointment = await _context.Appointments.FindAsync(prescription.AppointmentId);
            if (appointment != null)
            {
                await _hubContext.Clients.Group($"user-{appointment.PatientUserId}")
                    .SendAsync("PrescriptionDispensed", new { 
                        prescriptionId = prescription.Id,
                        tokenNumber = appointment.TokenNumber,
                        billAmount = totalBill
                    });
            }

            return Ok(new { success = true, message = "Medicines dispensed and bill generated successfully", billAmount = totalBill });
        }

        // POST api/pharmacy/walk-in
        [HttpPost("walk-in")]
        public async Task<IActionResult> ProcessWalkInSale([FromBody] WalkInSaleDto dto)
        {
            if (dto.Items == null || !dto.Items.Any())
                return BadRequest(new { success = false, message = "No items in basket" });

            decimal subTotal = 0;
            var itemsSummary = new List<object>();

            foreach (var item in dto.Items)
            {
                var med = await _context.Medicines.FindAsync(item.MedicineId);
                if (med == null) continue;

                if (med.StockQuantity < item.Count)
                    return BadRequest(new { success = false, message = $"Insufficient stock for {med.Name}" });

                med.StockQuantity -= item.Count;
                subTotal += med.Price * item.Count;
                itemsSummary.Add(new { name = med.Name, count = item.Count, price = med.Price });
            }

            decimal gstPercent = 18;
            decimal gstAmount = Math.Round(subTotal * (gstPercent / 100), 2);
            decimal totalBill = subTotal + gstAmount;

            // Create Bill for Walk-in
            var bill = new Bill
            {
                BillNumber = $"WALK-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}",
                BillSource = "Pharmacy",
                Items = System.Text.Json.JsonSerializer.Serialize(itemsSummary),
                SubTotal = subTotal,
                GSTPercent = gstPercent,
                GSTAmount = gstAmount,
                TotalAmount = totalBill,
                Status = "Paid",
                PaymentMode = dto.PaymentMode ?? "Cash",
                PaidAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                PatientUserId = dto.PatientUserId
            };

            _context.Bills.Add(bill);
            await _context.SaveChangesAsync();

            if (dto.SendBillToEmail && !string.IsNullOrWhiteSpace(dto.CustomerEmail))
            {
                try
                {
                    await _emailService.SendInvoiceAsync(
                        dto.CustomerEmail.Trim(),
                        dto.CustomerName ?? "Customer",
                        bill.BillNumber,
                        totalBill,
                        DateTime.UtcNow.ToString("dd MMM yyyy HH:mm"),
                        "Paid");
                }
                catch { /* Log but don't fail the sale */ }
            }

            return Ok(new
            {
                success = true,
                message = "Sale completed successfully",
                billNumber = bill.BillNumber,
                billId = bill.Id,
                subTotal = subTotal,
                gstAmount = gstAmount,
                total = totalBill,
                items = itemsSummary,
                customerName = dto.CustomerName,
                customerEmail = dto.CustomerEmail,
                paymentMode = bill.PaymentMode
            });
        }

        public class PrescribedMed 
        {
            public string name { get; set; } = string.Empty;
            public int count { get; set; }
        }

        public class WalkInSaleDto
        {
            public string CustomerName { get; set; } = "Walk-in Customer";
            public string CustomerPhone { get; set; } = string.Empty;
            public string? CustomerEmail { get; set; }
            public string? PaymentMode { get; set; }
            public int? PatientUserId { get; set; }
            public bool SendBillToEmail { get; set; }
            public List<WalkInItemDto> Items { get; set; } = new();
        }

        public class WalkInItemDto
        {
            public int MedicineId { get; set; }
            public int Count { get; set; }
        }

        public class CreateMedicineDto
        {
            public string Name { get; set; } = string.Empty;
            public string? GenericName { get; set; }
            public string? Category { get; set; }
            public string? Manufacturer { get; set; }
            public decimal Price { get; set; }
            public int StockQuantity { get; set; }
            public int LowStockThreshold { get; set; }
            public DateTime? ExpiryDate { get; set; }
        }
    }
}
