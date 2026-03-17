using System.ComponentModel.DataAnnotations;

namespace MediCore.API.Modules.Bed.Models
{
// This model defines the Categories of rooms (e.g., Deluxe, Semi-Private, ICU).
// It sets the base price per day for any patient staying in this type of room.
    public class RoomType
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int FloorNumber { get; set; }
        public decimal PricePerDay { get; set; }
        public int BedsPerRoom { get; set; }
        public string? Amenities { get; set; }
        public string? ColorCode { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
