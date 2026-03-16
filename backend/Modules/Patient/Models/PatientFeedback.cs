using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MediCore.API.Modules.Auth.Models;
using MediCore.API.Modules.Doctor.Models;
using MediCore.API.Modules.OPD.Models;

namespace MediCore.API.Modules.Patient.Models
{
    public class PatientFeedback
    {
        [Key]
        public int Id { get; set; }
        
        public int AppointmentId { get; set; }
        [ForeignKey("AppointmentId")]
        public virtual Appointment? Appointment { get; set; }
        
        public int PatientUserId { get; set; }
        [ForeignKey("PatientUserId")]
        public virtual User? PatientUser { get; set; }
        
        public int DoctorProfileId { get; set; }
        [ForeignKey("DoctorProfileId")]
        public virtual DoctorProfile? DoctorProfile { get; set; }
        
        public int OverallRating { get; set; } // 1-5
        public int DoctorRating { get; set; } // 1-5
        public int StaffRating { get; set; } // 1-5
        public int FacilityRating { get; set; } // 1-5
        
        public string? Comment { get; set; }
        public bool WouldRecommend { get; set; }
        public bool IsAnonymous { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
