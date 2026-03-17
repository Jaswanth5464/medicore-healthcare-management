using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MediCore.API.Modules.Bed.Models
{
// This model represents a Hospital Room. 
// A room can have multiple beds and belongs to a specific Room Type (like General Ward or Private Suite).
    public class Room
    {
        [Key]
        public int Id { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public string RoomName { get; set; } = string.Empty;
        public int RoomTypeId { get; set; }
        
        [ForeignKey("RoomTypeId")]
        public virtual RoomType? RoomType { get; set; }
        
        public int FloorNumber { get; set; }
        public bool IsActive { get; set; } = true;
        public string? Notes { get; set; }

        public virtual ICollection<BedAllocation> Beds { get; set; } = new List<BedAllocation>();
        public virtual ICollection<PatientAdmission> PatientAdmissions { get; set; } = new List<PatientAdmission>();
    }
}
