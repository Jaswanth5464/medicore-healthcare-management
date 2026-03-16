using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MediCore.API.Modules.Auth.Models;

namespace MediCore.API.Modules.Bed.Models
{
    public class DailyIPDCharge
    {
        [Key]
        public int Id { get; set; }
        
        public int AdmissionId { get; set; }
        [ForeignKey("AdmissionId")]
        public virtual PatientAdmission? Admission { get; set; }
        
        public DateTime ChargeDate { get; set; }
        
        public decimal RoomCharge { get; set; }
        public decimal DoctorVisitCharge { get; set; }
        public decimal NursingCharge { get; set; }
        public decimal MedicineCharge { get; set; }
        public decimal LabCharge { get; set; }
        public decimal ProcedureCharge { get; set; }
        public decimal OtherCharges { get; set; }
        
        public decimal TotalDayCharge => RoomCharge + DoctorVisitCharge + NursingCharge + MedicineCharge + LabCharge + ProcedureCharge + OtherCharges;
        
        public string? Notes { get; set; }
        
        public int AddedByUserId { get; set; }
        [ForeignKey("AddedByUserId")]
        public virtual User? AddedByUser { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
