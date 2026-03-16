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

        [HttpGet("test-db")]
        [AllowAnonymous]
        public async Task<IActionResult> TestDb()
        {
            var results = new Dictionary<string, object>();
            var tablesToCheck = new[] { "Rooms", "RoomTypes", "BedAllocations", "PatientAdmissions", "Departments", "Users" };

            try
            {
                using var command = _context.Database.GetDbConnection().CreateCommand();
                await _context.Database.OpenConnectionAsync();

                foreach (var table in tablesToCheck)
                {
                    var tableStatus = new Dictionary<string, object>();
                    try
                    {
                        command.CommandText = $"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '{table}'";
                        var exists = (int)await command.ExecuteScalarAsync() > 0;
                        tableStatus["exists"] = exists;

                        if (exists)
                        {
                            command.CommandText = $"SELECT COUNT(*) FROM [{table}]";
                            tableStatus["count"] = await command.ExecuteScalarAsync();
                        }
                    }
                    catch (Exception ex)
                    {
                        tableStatus["error"] = ex.Message;
                    }
                    results[table] = tableStatus;
                }

                // Check Migration History
                var appliedMigrations = (await _context.Database.GetAppliedMigrationsAsync()).ToList();
                var pendingMigrations = (await _context.Database.GetPendingMigrationsAsync()).ToList();

                return Ok(new 
                { 
                    success = true, 
                    database = _context.Database.GetDbConnection().Database,
                    dataSource = _context.Database.GetDbConnection().DataSource,
                    appliedMigrations,
                    pendingMigrations,
                    tables = results 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message, inner = ex.InnerException?.Message });
            }
            finally
            {
                await _context.Database.CloseConnectionAsync();
            }
        }

        [HttpGet("db-diagnostics")]
        [AllowAnonymous]
        public async Task<IActionResult> DbDiagnostics()
        {
            var results = new List<object>();
            try
            {
                using var command = _context.Database.GetDbConnection().CreateCommand();
                await _context.Database.OpenConnectionAsync();

                // Get all tables
                command.CommandText = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME != '__EFMigrationsHistory'";
                var tableNames = new List<string>();
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        tableNames.Add(reader.GetString(0));
                    }
                }

                foreach (var tableName in tableNames)
                {
                    var tableInfo = new { Table = tableName, Count = -1, Error = (string?)null };
                    try
                    {
                        command.CommandText = $"SELECT COUNT(*) FROM [{tableName}]";
                        var count = await command.ExecuteScalarAsync();
                        tableInfo = new { Table = tableName, Count = Convert.ToInt32(count), Error = (string?)null };
                    }
                    catch (Exception ex)
                    {
                        tableInfo = new { Table = tableName, Count = -1, Error = ex.Message };
                    }
                    results.Add(tableInfo);
                }

                return Ok(new
                {
                    success = true,
                    timestamp = DateTime.UtcNow,
                    database = _context.Database.GetDbConnection().Database,
                    tables = results.OrderBy(r => ((dynamic)r).Table).ToList()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
            finally
            {
                await _context.Database.CloseConnectionAsync();
            }
        }

        [HttpGet("force-sync-migrations")]
        [AllowAnonymous]
        public async Task<IActionResult> ForceSyncMigrations()
        {
            var migrationsToSync = new[]
            {
                "20260306082302_AuthTables",
                "20260306082357_AddAuthTables",
                "20260306090533_adddetails",
                "20260306194903_new",
                "20260308060616_AppointmentRequestsAndAppointments",
                "20260308095929_AddOtpRecord",
                "20260309113643_12134",
                "20260309121658_EmailOtpRefactor",
                "20260310110551_SyncPhaseA",
                "20260310113059_1",
                "20260311101236_AddDoctorLeaveAndPatientProfile",
                "20260311113524_123456",
                "20260311114822_1359"
            };

            try
            {
                using var command = _context.Database.GetDbConnection().CreateCommand();
                await _context.Database.OpenConnectionAsync();

                foreach (var m in migrationsToSync)
                {
                    command.CommandText = $"IF NOT EXISTS (SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = '{m}') " +
                                         $"INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ('{m}', '8.0.2')";
                    await command.ExecuteNonQueryAsync();
                }

                return Ok(new { success = true, message = "Inconsistent migration history synced. Now redeploy/restart the app to apply the IPD tables." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
            finally
            {
                await _context.Database.CloseConnectionAsync();
            }
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
                .ThenInclude(a => a.PatientUser)
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
