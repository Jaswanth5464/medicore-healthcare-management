using System;

namespace MediCore.API.Modules.Finance.Models
{
// This model records any money the hospital spends (like buying medicines or paying electricity).
    public class Expense
    {
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Category { get; set; } = "General"; // Salary, Supplies, Utilities, Maintenance, Rent, Medical Equipment
        public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;
        
        // Audit
        public int? CreatedByUserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
