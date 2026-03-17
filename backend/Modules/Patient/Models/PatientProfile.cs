using MediCore.API.Modules.Auth.Models;

namespace MediCore.API.Modules.Patient.Models
{
// This model stores additional details about a patient, such as their blood group and emergency contact.
    public class PatientProfile
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public string BloodGroup { get; set; } = string.Empty;
        public string Allergies { get; set; } = string.Empty;
        public string ChronicConditions { get; set; } = string.Empty;
        public string EmergencyContactName { get; set; } = string.Empty;
        public string EmergencyContactPhone { get; set; } = string.Empty;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
