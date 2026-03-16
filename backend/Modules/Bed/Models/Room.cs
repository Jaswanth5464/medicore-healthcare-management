using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MediCore.API.Modules.Bed.Models
{
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
