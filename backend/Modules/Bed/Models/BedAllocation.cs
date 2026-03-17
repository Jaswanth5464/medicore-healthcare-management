using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MediCore.API.Modules.Bed.Models
{
// This model represents a specific Bed in the hospital.
// It tracks which room the bed is in, its current status (Occupied, Cleaning, etc.), and which patient is currently using it.
    public class BedAllocation
    {
        [Key]
        public int Id { get; set; }
        public string BedNumber { get; set; } = string.Empty;
        public int RoomId { get; set; }
        
        [ForeignKey("RoomId")]
        public virtual Room? Room { get; set; }
        
        public int FloorNumber { get; set; }
        public int RoomTypeId { get; set; }

        [ForeignKey("RoomTypeId")]
        public virtual RoomType? RoomType { get; set; }

        public string Status { get; set; } = "Available"; // Available/Occupied/Cleaning/Reserved/Maintenance
        
        public int? CurrentAdmissionId { get; set; }
        public virtual PatientAdmission? CurrentAdmission { get; set; }

        public DateTime? LastCleanedAt { get; set; }
        public string? MaintenanceNotes { get; set; }
        public bool IsActive { get; set; } = true;

        [NotMapped]
        public bool IsOccupied => Status == "Occupied";

        public virtual ICollection<PatientAdmission> AllAdmissions { get; set; } = new List<PatientAdmission>();
    }
}
