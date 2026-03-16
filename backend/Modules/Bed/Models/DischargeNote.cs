using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MediCore.API.Modules.Doctor.Models;

namespace MediCore.API.Modules.Bed.Models
{
    public class DischargeNote
    {
        [Key]
        public int Id { get; set; }
        
        public int AdmissionId { get; set; }
        [ForeignKey("AdmissionId")]
        public virtual PatientAdmission? Admission { get; set; }
        
        public string FinalDiagnosis { get; set; } = string.Empty;
        public string? TreatmentSummary { get; set; }
        public string? Complications { get; set; }
        
        public string? MedicinesAtDischarge { get; set; } // JSON array
        
        public string? DietInstructions { get; set; }
        public string? ActivityRestrictions { get; set; }
        
        public DateTime? FollowUpDate { get; set; }
        public int? FollowUpWithDoctorId { get; set; }
        
        [ForeignKey("FollowUpWithDoctorId")]
        public virtual DoctorProfile? FollowUpDoctor { get; set; }
        
        public string DischargeType { get; set; } = "Regular"; // Regular/LAMA/Transfer/Expired
        public string? DoctorNotes { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
