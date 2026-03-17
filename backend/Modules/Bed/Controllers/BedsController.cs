// This file (BedsController) handles all requests related to hospital beds in the IPD (In-Patient Department).
// Its main job is to let the hospital staff update a bed's status (like changing it from 'Cleaning' back to 'Available').
using MediCore.API.Infrastructure.Database.Context;
using MediCore.API.Modules.Bed.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MediCore.API.Modules.Bed.Controllers
{
    [ApiController]
    [Route("api/ipd/beds")]
    [Authorize]
    public class BedsController : ControllerBase
    {
        private readonly MediCoreDbContext _context;

        public BedsController(MediCoreDbContext context)
        {
            _context = context;
        }

        // This function searches for a bed by its ID and changes its status (like from 'Cleaning' to 'Available').
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateBedStatus(int id, [FromBody] UpdateBedStatusDto dto)
        {
            var bed = await _context.BedAllocations.FindAsync(id);
            if (bed == null)
            {
                return NotFound(new { success = false, message = "Bed not found." });
            }

            bed.Status = dto.Status;

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = $"Bed status updated to {dto.Status} successfully." });
        }

        public class UpdateBedStatusDto
        {
            public string Status { get; set; } = string.Empty;
        }
    }
}
