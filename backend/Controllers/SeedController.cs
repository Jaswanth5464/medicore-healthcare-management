using MediCore.API.Infrastructure.Database;
using MediCore.API.Infrastructure.Database.Context;
using MediCore.API.Modules.Pharmacy.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MediCore.API.Controllers
{
    [ApiController]
    [Route("api/seed")]
    [AllowAnonymous]
    public class SeedController : ControllerBase
    {
        private readonly MediCoreDbContext _context;

        public SeedController(MediCoreDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Seed()
        {
            await DbSeeder.SeedAsync(_context);
            return Ok(new { success = true, message = "Database seeded with default data" });
        }

        [HttpPost("medicines")]
        public async Task<IActionResult> SeedMedicines()
        {
            var meds = new List<Medicine>
            {
                new() { Name = "Paracetamol 500mg", GenericName = "Acetaminophen", Category = "Tablet", Price = 5.50m, StockQuantity = 500, LowStockThreshold = 50, Manufacturer = "GSK" },
                new() { Name = "Amoxicillin 250mg", GenericName = "Amoxicillin", Category = "Capsule", Price = 12.00m, StockQuantity = 200, LowStockThreshold = 20, Manufacturer = "Novartis" },
                new() { Name = "Ibuprofen 400mg", GenericName = "Ibuprofen", Category = "Tablet", Price = 8.75m, StockQuantity = 300, LowStockThreshold = 30, Manufacturer = "Pfizer" },
                new() { Name = "Metformin 500mg", GenericName = "Metformin", Category = "Tablet", Price = 4.20m, StockQuantity = 450, LowStockThreshold = 40, Manufacturer = "Merck" },
                new() { Name = "Cetirizine 10mg", GenericName = "Cetirizine", Category = "Tablet", Price = 3.50m, StockQuantity = 600, LowStockThreshold = 50, Manufacturer = "J&J" },
                new() { Name = "Azithromycin 500mg", GenericName = "Azithromycin", Category = "Tablet", Price = 45.00m, StockQuantity = 100, LowStockThreshold = 15, Manufacturer = "Sandoz" },
                new() { Name = "Omeprazole 20mg", GenericName = "Omeprazole", Category = "Capsule", Price = 15.30m, StockQuantity = 250, LowStockThreshold = 25, Manufacturer = "AstraZeneca" },
                new() { Name = "Atorvastatin 10mg", GenericName = "Atorvastatin", Category = "Tablet", Price = 22.00m, StockQuantity = 180, LowStockThreshold = 20, Manufacturer = "Pfizer" },
                new() { Name = "Amlodipine 5mg", GenericName = "Amlodipine", Category = "Tablet", Price = 6.80m, StockQuantity = 400, LowStockThreshold = 35, Manufacturer = "Lupin" },
                new() { Name = "Ciprofloxacin 500mg", GenericName = "Ciprofloxacin", Category = "Tablet", Price = 18.50m, StockQuantity = 150, LowStockThreshold = 20, Manufacturer = "Bayer" },
                new() { Name = "Losartan 50mg", GenericName = "Losartan", Category = "Tablet", Price = 14.20m, StockQuantity = 220, LowStockThreshold = 25, Manufacturer = "Aurobindo" },
                new() { Name = "Pantoprazole 40mg", GenericName = "Pantoprazole", Category = "Tablet", Price = 11.50m, StockQuantity = 330, LowStockThreshold = 30, Manufacturer = "Sun Pharma" },
                new() { Name = "Dolo 650", GenericName = "Paracetamol", Category = "Tablet", Price = 3.20m, StockQuantity = 1000, LowStockThreshold = 100, Manufacturer = "Micro Labs" },
                new() { Name = "Combiflam", GenericName = "Ibuprofen + Paracetamol", Category = "Tablet", Price = 4.50m, StockQuantity = 800, LowStockThreshold = 80, Manufacturer = "Sanofi" },
                new() { Name = "Saridon", GenericName = "Propyphenazone + Paracetamol", Category = "Tablet", Price = 5.00m, StockQuantity = 500, LowStockThreshold = 50, Manufacturer = "Bayer" },
                new() { Name = "Digene Gel", GenericName = "Magnesium Hydroxide", Category = "Syrup", Price = 125.00m, StockQuantity = 50, LowStockThreshold = 5, Manufacturer = "Abbott" },
                new() { Name = "Benadryl DR", GenericName = "Dextromethorphan", Category = "Syrup", Price = 115.00m, StockQuantity = 40, LowStockThreshold = 10, Manufacturer = "J&J" },
                new() { Name = "Zyrtec", GenericName = "Cetirizine", Category = "Tablet", Price = 18.00m, StockQuantity = 200, LowStockThreshold = 20, Manufacturer = "GSK" },
                new() { Name = "Lisinopril 10mg", GenericName = "Lisinopril", Category = "Tablet", Price = 9.50m, StockQuantity = 120, LowStockThreshold = 15, Manufacturer = "Mylan" },
                new() { Name = "Gabapentin 300mg", GenericName = "Gabapentin", Category = "Capsule", Price = 28.00m, StockQuantity = 90, LowStockThreshold = 10, Manufacturer = "Pfizer" },
                new() { Name = "Salbutamol Inhaler", GenericName = "Albuterol", Category = "Inhaler", Price = 245.00m, StockQuantity = 30, LowStockThreshold = 5, Manufacturer = "Cipla" },
                new() { Name = "Vicks Action 500", GenericName = "Paracetamol + Caffeine", Category = "Tablet", Price = 2.50m, StockQuantity = 1200, LowStockThreshold = 100, Manufacturer = "P&G" },
                new() { Name = "Crocin Advance", GenericName = "Paracetamol", Category = "Tablet", Price = 3.50m, StockQuantity = 900, LowStockThreshold = 90, Manufacturer = "GSK" },
                new() { Name = "Augmentin 625 Duo", GenericName = "Amoxicillin + Clavulanic Acid", Category = "Tablet", Price = 180.00m, StockQuantity = 60, LowStockThreshold = 10, Manufacturer = "GSK" },
                new() { Name = "Thyronorm 50", GenericName = "Levothyroxine", Category = "Tablet", Price = 145.00m, StockQuantity = 50, LowStockThreshold = 5, Manufacturer = "Abbott" },
                new() { Name = "Allegra 120mg", GenericName = "Fexofenadine", Category = "Tablet", Price = 165.00m, StockQuantity = 75, LowStockThreshold = 10, Manufacturer = "Sanofi" },
                new() { Name = "Montair LC", GenericName = "Montelukast + Levocetirizine", Category = "Tablet", Price = 195.00m, StockQuantity = 80, LowStockThreshold = 15, Manufacturer = "Cipla" },
                new() { Name = "Glycomet GP1", GenericName = "Metformin + Glimepiride", Category = "Tablet", Price = 85.00m, StockQuantity = 150, LowStockThreshold = 20, Manufacturer = "USV" },
                new() { Name = "Liv.52", GenericName = "Himalaya Herbal", Category = "Tablet", Price = 135.00m, StockQuantity = 100, LowStockThreshold = 10, Manufacturer = "Himalaya" },
                new() { Name = "Shelcal 500", GenericName = "Calcium + Vitamin D3", Category = "Tablet", Price = 95.00m, StockQuantity = 200, LowStockThreshold = 20, Manufacturer = "Torrent" },
                new() { Name = "Volini Gel", GenericName = "Diclofenac", Category = "Ointment", Price = 145.00m, StockQuantity = 60, LowStockThreshold = 10, Manufacturer = "Sun Pharma" },
                new() { Name = "Moov", GenericName = "Herbal Pain Relief", Category = "Ointment", Price = 120.00m, StockQuantity = 50, LowStockThreshold = 10, Manufacturer = "Reckitt" },
                new() { Name = "Dettol 500ml", GenericName = "Antiseptic Liquid", Category = "Liquid", Price = 185.00m, StockQuantity = 40, LowStockThreshold = 5, Manufacturer = "Reckitt" },
                new() { Name = "Savlon 500ml", GenericName = "Antiseptic Liquid", Category = "Liquid", Price = 165.00m, StockQuantity = 40, LowStockThreshold = 5, Manufacturer = "ITC" },
                new() { Name = "ORSL Lemon", GenericName = "Rehydration Salts", Category = "Liquid", Price = 45.00m, StockQuantity = 150, LowStockThreshold = 20, Manufacturer = "J&J" },
                new() { Name = "Limcee", GenericName = "Vitamin C", Category = "Tablet", Price = 25.00m, StockQuantity = 400, LowStockThreshold = 50, Manufacturer = "Abbott" },
                new() { Name = "B-Complex", GenericName = "Vitamin B", Category = "Capsule", Price = 35.00m, StockQuantity = 300, LowStockThreshold = 30, Manufacturer = "Pfizer" },
                new() { Name = "Becosules", GenericName = "Vitamin B-Complex + C", Category = "Capsule", Price = 45.00m, StockQuantity = 350, LowStockThreshold = 35, Manufacturer = "Pfizer" },
                new() { Name = "Azee 500", GenericName = "Azithromycin", Category = "Tablet", Price = 115.00m, StockQuantity = 90, LowStockThreshold = 10, Manufacturer = "Cipla" },
                new() { Name = "Taxim-O 200", GenericName = "Cefixime", Category = "Tablet", Price = 105.00m, StockQuantity = 80, LowStockThreshold = 15, Manufacturer = "Alkem" },
                new() { Name = "Voveran SR 100", GenericName = "Diclofenac", Category = "Tablet", Price = 95.00m, StockQuantity = 100, LowStockThreshold = 10, Manufacturer = "Novartis" },
                new() { Name = "Telma 40", GenericName = "Telmisartan", Category = "Tablet", Price = 110.00m, StockQuantity = 120, LowStockThreshold = 20, Manufacturer = "Glenmark" },
                new() { Name = "Clexane 40mg", GenericName = "Enoxaparin", Category = "Injection", Price = 450.00m, StockQuantity = 20, LowStockThreshold = 5, Manufacturer = "Sanofi" },
                new() { Name = "Moxikind-CV 625", GenericName = "Amoxicillin + Clavulanic Acid", Category = "Tablet", Price = 165.00m, StockQuantity = 70, LowStockThreshold = 10, Manufacturer = "Mankind" },
                new() { Name = "Candiforce 200", GenericName = "Itraconazole", Category = "Capsule", Price = 185.00m, StockQuantity = 40, LowStockThreshold = 8, Manufacturer = "Mankind" },
                new() { Name = "Oflomac 200", GenericName = "Ofloxacin", Category = "Tablet", Price = 65.00m, StockQuantity = 110, LowStockThreshold = 20, Manufacturer = "Macleods" },
                new() { Name = "Rantac 150", GenericName = "Ranitidine", Category = "Tablet", Price = 35.00m, StockQuantity = 300, LowStockThreshold = 50, Manufacturer = "JB Chemicals" },
                new() { Name = "Aciloc 150", GenericName = "Ranitidine", Category = "Tablet", Price = 32.00m, StockQuantity = 250, LowStockThreshold = 40, Manufacturer = "Cadila" },
                new() { Name = "Vomikind 4mg", GenericName = "Ondansetron", Category = "Tablet", Price = 45.00m, StockQuantity = 100, LowStockThreshold = 20, Manufacturer = "Mankind" },
                new() { Name = "Perinorm", GenericName = "Metoclopramide", Category = "Tablet", Price = 25.00m, StockQuantity = 150, LowStockThreshold = 30, Manufacturer = "Ipca" }
            };

            foreach (var med in meds)
            {
                var exists = await _context.Medicines.AnyAsync(m => m.Name == med.Name);
                if (!exists)
                {
                    _context.Medicines.Add(med);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Seed complete: 50 medicines added." });
        }
    }
}
