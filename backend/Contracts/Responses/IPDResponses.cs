namespace MediCore.API.Contracts.Responses
{
    public class RoomTypeResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int FloorNumber { get; set; }
        public decimal PricePerDay { get; set; }
        public int BedsPerRoom { get; set; }
        public string[] Amenities { get; set; } = Array.Empty<string>();
        public string? ColorCode { get; set; }
    }

    public class BedStatusResponse
    {
        public int Id { get; set; }
        public string BedNumber { get; set; } = string.Empty;
        public string Status { get; set; } = "Available"; // Available, Occupied, Cleaning, Maintenance
        public int? CurrentAdmissionId { get; set; }
        public string? PatientName { get; set; }
        public string? AdmissionNumber { get; set; }
    }

    public class RoomDetailResponse
    {
        public int Id { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public string RoomName { get; set; } = string.Empty;
        public int RoomTypeId { get; set; }
        public string RoomTypeName { get; set; } = string.Empty;
        public int FloorNumber { get; set; }
        public bool IsActive { get; set; }
        public List<BedStatusResponse> Beds { get; set; } = new();
    }

    public class FloorLayoutResponse
    {
        public int FloorNumber { get; set; }
        public List<RoomDetailResponse> Rooms { get; set; } = new();
    }

    public class AdmissionResponse
    {
        public int Id { get; set; }
        public string AdmissionNumber { get; set; } = string.Empty;
        public int PatientId { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public DateTime AdmissionDate { get; set; }
        public string Status { get; set; } = "Admitted";
        public string? BedNumber { get; set; }
        public string? RoomNumber { get; set; }
        public string? DoctorName { get; set; }
        public string? DepartmentName { get; set; }
    }
}
