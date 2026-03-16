using System.ComponentModel.DataAnnotations;

namespace MediCore.API.Contracts.Requests
{
    public class AdmissionRequest
    {
        [Required]
        public int PatientUserId { get; set; }
        
        [Required]
        public int RoomTypeId { get; set; }
        
        [Required]
        public int RoomId { get; set; }
        
        public int? BedId { get; set; }
        
        [Required]
        public int AdmittingDoctorProfileId { get; set; }
        
        [Required]
        public int DepartmentId { get; set; }
        
        public string AdmissionType { get; set; } = "Regular"; // Emergency, Regular, Transfer
        
        public string? ChiefComplaints { get; set; }
        public string? InitialDiagnosis { get; set; }
        
        public string? AttendantName { get; set; }
        public string? AttendantPhone { get; set; }
        public string? AttendantRelation { get; set; }
    }

    public class AddDailyChargeRequest
    {
        [Required]
        public int AdmissionId { get; set; }
        
        public decimal DoctorVisitCharge { get; set; }
        public decimal NursingCharge { get; set; }
        public decimal MedicineCharge { get; set; }
        public decimal LabCharge { get; set; }
        public decimal ProcedureCharge { get; set; }
        public decimal OtherCharges { get; set; }
        public string? Notes { get; set; }
    }

    public class DischargeRequest
    {
        [Required]
        public int AdmissionId { get; set; }
        
        [Required]
        public string FinalDiagnosis { get; set; } = string.Empty;
        
        public string? TreatmentSummary { get; set; }
        public string? MedicinesAtDischarge { get; set; }
        public string? DietInstructions { get; set; }
        public DateTime? FollowUpDate { get; set; }
        public int? FollowUpWithDoctorId { get; set; }
        
        public string DischargeType { get; set; } = "Normal"; // Normal, AMA (Against Medical Advice), Referred, Deceased
    }
}
