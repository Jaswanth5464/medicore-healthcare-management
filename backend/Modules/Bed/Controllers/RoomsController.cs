using MediCore.API.Contracts.Responses;
using MediCore.API.Infrastructure.Database.Context;
using MediCore.API.Modules.Bed.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediCore.API.Modules.Bed.Controllers
{
    [ApiController]
    [Route("api/ipd/[controller]")]
    [Authorize]
    public class RoomsController : ControllerBase
    {
        private readonly MediCoreDbContext _context;

        public RoomsController(MediCoreDbContext context)
        {
            _context = context;
        }

        [HttpGet("room-types")]
        public async Task<IActionResult> GetRoomTypes()
        {
            var roomTypes = await _context.RoomTypes
                .Where(rt => rt.IsActive)
                .Select(rt => new RoomTypeResponse
                {
                    Id = rt.Id,
                    Name = rt.Name,
                    Description = rt.Description,
                    FloorNumber = rt.FloorNumber,
                    PricePerDay = rt.PricePerDay,
                    BedsPerRoom = rt.BedsPerRoom,
                    Amenities = !string.IsNullOrEmpty(rt.Amenities) 
                        ? rt.Amenities.Split(',', StringSplitOptions.RemoveEmptyEntries) 
                        : Array.Empty<string>(),
                    ColorCode = rt.ColorCode
                })
                .ToListAsync();

            return Ok(new { success = true, data = roomTypes });
        }

        [HttpGet("layout")]
        public async Task<IActionResult> GetHospitalLayout()
        {
            var rooms = await _context.Rooms
                .Include(r => r.RoomType)
                .Include(r => r.Beds)
                .ThenInclude(b => b.CurrentAdmission)
                .ThenInclude(a => a != null ? a.PatientUser : null)
                .Where(r => r.IsActive)
                .ToListAsync();

            var result = rooms
                .GroupBy(r => r.FloorNumber)
                .Select(g => new FloorLayoutResponse
                {
                    FloorNumber = g.Key,
                    Rooms = g.Select(r => new RoomDetailResponse
                    {
                        Id = r.Id,
                        RoomNumber = r.RoomNumber,
                        RoomName = r.RoomName,
                        RoomTypeId = r.RoomTypeId,
                        RoomTypeName = r.RoomType?.Name ?? "N/A",
                        FloorNumber = r.FloorNumber,
                        IsActive = r.IsActive,
                        Beds = r.Beds.Select(b => new BedStatusResponse
                        {
                            Id = b.Id,
                            BedNumber = b.BedNumber,
                            Status = b.Status,
                            CurrentAdmissionId = b.CurrentAdmissionId,
                            PatientName = b.CurrentAdmission?.PatientUser?.FullName,
                            AdmissionNumber = b.CurrentAdmission?.AdmissionNumber
                        }).ToList()
                    }).OrderBy(r => r.RoomNumber).ToList()
                })
                .OrderBy(f => f.FloorNumber)
                .ToList();

            return Ok(new { success = true, data = result });
        }

        [HttpGet("available-beds/{roomTypeId}")]
        public async Task<IActionResult> GetAvailableBeds(int roomTypeId)
        {
            var beds = await _context.BedAllocations
                .Include(b => b.Room)
                .Where(b => b.RoomTypeId == roomTypeId && b.Status == "Available" && b.IsActive)
                .Select(b => new
                {
                    b.Id,
                    b.BedNumber,
                    b.RoomId,
                    RoomNumber = b.Room.RoomNumber,
                    b.FloorNumber
                })
                .ToListAsync();

            return Ok(new { success = true, data = beds });
        }
    }
}
