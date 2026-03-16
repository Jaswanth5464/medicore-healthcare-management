using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MediCore.API.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class IPDAndBedAllocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
/*
            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: 10);
*/

            migrationBuilder.AddColumn<bool>(
                name: "FeedbackEmailSent",
                table: "Appointments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "FeedbackSubmitted",
                table: "Appointments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "FollowUpAppointmentId",
                table: "Appointments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "FollowUpBooked",
                table: "Appointments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "FollowUpDate",
                table: "Appointments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "FollowUpReminderSent",
                table: "Appointments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsVideoConsultation",
                table: "Appointments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "VideoEndedAt",
                table: "Appointments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "VideoJoinedByPatientAt",
                table: "Appointments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideoRoomUrl",
                table: "Appointments",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "VideoStartedAt",
                table: "Appointments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PatientFeedbacks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AppointmentId = table.Column<int>(type: "int", nullable: false),
                    PatientUserId = table.Column<int>(type: "int", nullable: false),
                    DoctorProfileId = table.Column<int>(type: "int", nullable: false),
                    OverallRating = table.Column<int>(type: "int", nullable: false),
                    DoctorRating = table.Column<int>(type: "int", nullable: false),
                    StaffRating = table.Column<int>(type: "int", nullable: false),
                    FacilityRating = table.Column<int>(type: "int", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    WouldRecommend = table.Column<bool>(type: "bit", nullable: false),
                    IsAnonymous = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientFeedbacks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PatientFeedbacks_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.NoAction);
                    table.ForeignKey(
                        name: "FK_PatientFeedbacks_DoctorProfiles_DoctorProfileId",
                        column: x => x.DoctorProfileId,
                        principalTable: "DoctorProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PatientFeedbacks_Users_PatientUserId",
                        column: x => x.PatientUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RoomTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FloorNumber = table.Column<int>(type: "int", nullable: false),
                    PricePerDay = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BedsPerRoom = table.Column<int>(type: "int", nullable: false),
                    Amenities = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ColorCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoomTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Rooms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoomNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RoomName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RoomTypeId = table.Column<int>(type: "int", nullable: false),
                    FloorNumber = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rooms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Rooms_RoomTypes_RoomTypeId",
                        column: x => x.RoomTypeId,
                        principalTable: "RoomTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.NoAction);
                });

            migrationBuilder.CreateTable(
                name: "BedAllocations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BedNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RoomId = table.Column<int>(type: "int", nullable: false),
                    FloorNumber = table.Column<int>(type: "int", nullable: false),
                    RoomTypeId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CurrentAdmissionId = table.Column<int>(type: "int", nullable: true),
                    LastCleanedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MaintenanceNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BedAllocations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BedAllocations_RoomTypes_RoomTypeId",
                        column: x => x.RoomTypeId,
                        principalTable: "RoomTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.NoAction);
                    table.ForeignKey(
                        name: "FK_BedAllocations_Rooms_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Rooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.NoAction);
                });

            migrationBuilder.CreateTable(
                name: "PatientAdmissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AdmissionNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PatientUserId = table.Column<int>(type: "int", nullable: false),
                    BedId = table.Column<int>(type: "int", nullable: true),
                    RoomId = table.Column<int>(type: "int", nullable: false),
                    RoomTypeId = table.Column<int>(type: "int", nullable: false),
                    AdmittingDoctorProfileId = table.Column<int>(type: "int", nullable: false),
                    DepartmentId = table.Column<int>(type: "int", nullable: false),
                    AdmissionDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpectedDischargeDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ActualDischargeDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AdmissionType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ChiefComplaints = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    InitialDiagnosis = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FinalDiagnosis = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AttendantName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AttendantPhone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AttendantRelation = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DailyRoomCharge = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DischargedByUserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientAdmissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PatientAdmissions_BedAllocations_BedId",
                        column: x => x.BedId,
                        principalTable: "BedAllocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PatientAdmissions_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PatientAdmissions_DoctorProfiles_AdmittingDoctorProfileId",
                        column: x => x.AdmittingDoctorProfileId,
                        principalTable: "DoctorProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PatientAdmissions_RoomTypes_RoomTypeId",
                        column: x => x.RoomTypeId,
                        principalTable: "RoomTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.NoAction);
                    table.ForeignKey(
                        name: "FK_PatientAdmissions_Rooms_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Rooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PatientAdmissions_Users_DischargedByUserId",
                        column: x => x.DischargedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PatientAdmissions_Users_PatientUserId",
                        column: x => x.PatientUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DailyIPDCharges",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AdmissionId = table.Column<int>(type: "int", nullable: false),
                    ChargeDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RoomCharge = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DoctorVisitCharge = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    NursingCharge = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MedicineCharge = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    LabCharge = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ProcedureCharge = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    OtherCharges = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AddedByUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyIPDCharges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DailyIPDCharges_PatientAdmissions_AdmissionId",
                        column: x => x.AdmissionId,
                        principalTable: "PatientAdmissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.NoAction);
                    table.ForeignKey(
                        name: "FK_DailyIPDCharges_Users_AddedByUserId",
                        column: x => x.AddedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DischargeNotes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AdmissionId = table.Column<int>(type: "int", nullable: false),
                    FinalDiagnosis = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TreatmentSummary = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Complications = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MedicinesAtDischarge = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DietInstructions = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ActivityRestrictions = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FollowUpDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FollowUpWithDoctorId = table.Column<int>(type: "int", nullable: true),
                    DischargeType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DoctorNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DischargeNotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DischargeNotes_DoctorProfiles_FollowUpWithDoctorId",
                        column: x => x.FollowUpWithDoctorId,
                        principalTable: "DoctorProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_DischargeNotes_PatientAdmissions_AdmissionId",
                        column: x => x.AdmissionId,
                        principalTable: "PatientAdmissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.NoAction);
                });

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 24, 37, 668, DateTimeKind.Utc).AddTicks(7414));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 24, 37, 668, DateTimeKind.Utc).AddTicks(7426));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 24, 37, 668, DateTimeKind.Utc).AddTicks(7430));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 4,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 24, 37, 668, DateTimeKind.Utc).AddTicks(7434));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 5,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 24, 37, 668, DateTimeKind.Utc).AddTicks(7438));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 6,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 24, 37, 668, DateTimeKind.Utc).AddTicks(7442));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 7,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 24, 37, 668, DateTimeKind.Utc).AddTicks(7446));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 8,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 24, 37, 668, DateTimeKind.Utc).AddTicks(7450));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 9,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 24, 37, 668, DateTimeKind.Utc).AddTicks(7454));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 10,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 24, 37, 668, DateTimeKind.Utc).AddTicks(7457));

            migrationBuilder.InsertData(
                table: "RoomTypes",
                columns: new[] { "Id", "Amenities", "BedsPerRoom", "ColorCode", "Description", "FloorNumber", "IsActive", "Name", "PricePerDay" },
                values: new object[,]
                {
                    { 1, "Basic bed, monitor, oxygen", 1, "#ef4444", "Emergency care with basic monitoring", 0, true, "Emergency Ward", 2000m },
                    { 2, "ICU equipment, ventilator, advanced monitoring", 1, "#dc2626", "Intensive Care Unit with advanced equipment", 0, true, "ICU", 8000m },
                    { 3, "Neonatal equipment, incubator, advanced care", 1, "#f97316", "Neonatal Intensive Care Unit", 0, true, "NICU", 10000m },
                    { 4, "Basic amenities, bed, locker", 1, "#3b82f6", "General male ward", 1, true, "General Ward Male", 1200m },
                    { 5, "Basic amenities, bed, locker", 1, "#8b5cf6", "General female ward", 1, true, "General Ward Female", 1200m },
                    { 6, "AC, TV, shared bathroom", 2, "#6366f1", "Semi-private accommodation", 2, true, "Semi-Private Room", 2500m },
                    { 7, "AC, TV, refrigerator, sofa", 1, "#22c55e", "Private accommodation", 3, true, "Private Room", 4500m },
                    { 8, "AC, TV, refrigerator, sofa, attendant bed", 1, "#10b981", "Deluxe private accommodation", 3, true, "Deluxe Room", 7000m },
                    { 9, "Full suite, living area, kitchenette", 1, "#0d9488", "Full suite with living area", 4, true, "Suite", 12000m }
                });

            migrationBuilder.CreateIndex(
                name: "IX_BedAllocations_CurrentAdmissionId",
                table: "BedAllocations",
                column: "CurrentAdmissionId",
                unique: true,
                filter: "[CurrentAdmissionId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_BedAllocations_RoomId",
                table: "BedAllocations",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_BedAllocations_RoomTypeId",
                table: "BedAllocations",
                column: "RoomTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_DailyIPDCharges_AddedByUserId",
                table: "DailyIPDCharges",
                column: "AddedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DailyIPDCharges_AdmissionId",
                table: "DailyIPDCharges",
                column: "AdmissionId");

            migrationBuilder.CreateIndex(
                name: "IX_DischargeNotes_AdmissionId",
                table: "DischargeNotes",
                column: "AdmissionId");

            migrationBuilder.CreateIndex(
                name: "IX_DischargeNotes_FollowUpWithDoctorId",
                table: "DischargeNotes",
                column: "FollowUpWithDoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientAdmissions_AdmittingDoctorProfileId",
                table: "PatientAdmissions",
                column: "AdmittingDoctorProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientAdmissions_BedId",
                table: "PatientAdmissions",
                column: "BedId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientAdmissions_DepartmentId",
                table: "PatientAdmissions",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientAdmissions_DischargedByUserId",
                table: "PatientAdmissions",
                column: "DischargedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientAdmissions_PatientUserId",
                table: "PatientAdmissions",
                column: "PatientUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientAdmissions_RoomId",
                table: "PatientAdmissions",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientAdmissions_RoomTypeId",
                table: "PatientAdmissions",
                column: "RoomTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientFeedbacks_AppointmentId",
                table: "PatientFeedbacks",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientFeedbacks_DoctorProfileId",
                table: "PatientFeedbacks",
                column: "DoctorProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_PatientFeedbacks_PatientUserId",
                table: "PatientFeedbacks",
                column: "PatientUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Rooms_RoomTypeId",
                table: "Rooms",
                column: "RoomTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_BedAllocations_PatientAdmissions_CurrentAdmissionId",
                table: "BedAllocations",
                column: "CurrentAdmissionId",
                principalTable: "PatientAdmissions",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BedAllocations_PatientAdmissions_CurrentAdmissionId",
                table: "BedAllocations");

            migrationBuilder.DropTable(
                name: "DailyIPDCharges");

            migrationBuilder.DropTable(
                name: "DischargeNotes");

            migrationBuilder.DropTable(
                name: "PatientFeedbacks");

            migrationBuilder.DropTable(
                name: "PatientAdmissions");

            migrationBuilder.DropTable(
                name: "BedAllocations");

            migrationBuilder.DropTable(
                name: "Rooms");

            migrationBuilder.DropTable(
                name: "RoomTypes");

            migrationBuilder.DropColumn(
                name: "FeedbackEmailSent",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "FeedbackSubmitted",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "FollowUpAppointmentId",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "FollowUpBooked",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "FollowUpDate",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "FollowUpReminderSent",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "IsVideoConsultation",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "VideoEndedAt",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "VideoJoinedByPatientAt",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "VideoRoomUrl",
                table: "Appointments");

            migrationBuilder.DropColumn(
                name: "VideoStartedAt",
                table: "Appointments");

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 16, 29, 19, 272, DateTimeKind.Utc).AddTicks(6347));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 16, 29, 19, 272, DateTimeKind.Utc).AddTicks(6353));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 16, 29, 19, 272, DateTimeKind.Utc).AddTicks(6355));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 4,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 16, 29, 19, 272, DateTimeKind.Utc).AddTicks(6356));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 5,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 16, 29, 19, 272, DateTimeKind.Utc).AddTicks(6358));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 6,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 16, 29, 19, 272, DateTimeKind.Utc).AddTicks(6359));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 7,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 16, 29, 19, 272, DateTimeKind.Utc).AddTicks(6361));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 8,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 16, 29, 19, 272, DateTimeKind.Utc).AddTicks(6363));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 9,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 16, 29, 19, 272, DateTimeKind.Utc).AddTicks(6365));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 10,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 16, 29, 19, 272, DateTimeKind.Utc).AddTicks(6367));

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "Description", "Name" },
                values: new object[,]
                {
                    { 1, "Full system access", "SuperAdmin" },
                    { 2, "Hospital management access", "HospitalAdmin" },
                    { 3, "Front desk operations", "Receptionist" },
                    { 4, "Medical consultation access", "Doctor" },
                    { 5, "Ward management access", "Nurse" },
                    { 6, "Pharmacy management access", "Pharmacist" },
                    { 7, "Laboratory access", "LabTechnician" },
                    { 8, "Billing and finance access", "FinanceStaff" },
                    { 9, "Patient mentoring access", "Mentor" },
                    { 10, "Patient portal access", "Patient" }
                });
        }
    }
}
