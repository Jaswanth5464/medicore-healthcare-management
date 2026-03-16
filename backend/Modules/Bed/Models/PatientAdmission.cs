using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MediCore.API.Modules.Auth.Models;
using MediCore.API.Modules.Doctor.Models;
using MediCore.API.Modules.Patient.Models;

namespace MediCore.API.Modules.Bed.Models
{
    public class PatientAdmission
    {
        [Key]
        public int Id { get; set; }
        public string AdmissionNumber { get; set; } = string.Empty; // ADM + date + sequence
        
        public int PatientUserId { get; set; }
        [ForeignKey("PatientUserId")]
        public virtual User? PatientUser { get; set; }
        
        public int? BedId { get; set; }
        [ForeignKey("BedId")]
        public virtual BedAllocation? Bed { get; set; }
        
        public int RoomId { get; set; }
        [ForeignKey("RoomId")]
        public virtual Room? Room { get; set; }
        
        public int RoomTypeId { get; set; }
        [ForeignKey("RoomTypeId")]
        public virtual RoomType? RoomType { get; set; }
        
        public int AdmittingDoctorProfileId { get; set; }
        [ForeignKey("AdmittingDoctorProfileId")]
        public virtual DoctorProfile? AdmittingDoctor { get; set; }
        
        public int DepartmentId { get; set; }
        [ForeignKey("DepartmentId")]
        public virtual Department? Department { get; set; }
        
        public DateTime AdmissionDate { get; set; } = DateTime.UtcNow;
        public DateTime? ExpectedDischargeDate { get; set; }
        public DateTime? ActualDischargeDate { get; set; }
        
        public string AdmissionType { get; set; } = "Elective"; // Elective/Emergency/Transfer/Maternity
        public string? ChiefComplaints { get; set; }
        public string? InitialDiagnosis { get; set; }
        public string? FinalDiagnosis { get; set; }
        
        public string Status { get; set; } = "Admitted"; // Admitted/Discharged/Transferred/LAMA/Absconded
        
        public string? AttendantName { get; set; }
        public string? AttendantPhone { get; set; }
        public string? AttendantRelation { get; set; }
        
        public int TotalDays => ActualDischargeDate.HasValue 
            ? (int)Math.Max(1, (ActualDischargeDate.Value - AdmissionDate).TotalDays)
            : 0;

        public decimal DailyRoomCharge { get; set; }
        public decimal TotalRoomCharge => Math.Max(1, TotalDays) * DailyRoomCharge;
        
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public bool FeedbackEmailSent { get; set; } = false;
        
        public virtual ICollection<DailyIPDCharge> DailyCharges { get; set; } = new List<DailyIPDCharge>();
        public virtual DischargeNote? DischargeNote { get; set; }
        
        public int? DischargedByUserId { get; set; }
        [ForeignKey("DischargedByUserId")]
        public virtual User? DischargedByUser { get; set; }
    }
}
