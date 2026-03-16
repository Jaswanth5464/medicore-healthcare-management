using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MediCore.API.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddExpensesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DischargeNotes_AdmissionId",
                table: "DischargeNotes");

            migrationBuilder.CreateTable(
                name: "Expenses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExpenseDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Expenses", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 59, 29, 217, DateTimeKind.Utc).AddTicks(354));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 59, 29, 217, DateTimeKind.Utc).AddTicks(364));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 59, 29, 217, DateTimeKind.Utc).AddTicks(366));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 4,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 59, 29, 217, DateTimeKind.Utc).AddTicks(368));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 5,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 59, 29, 217, DateTimeKind.Utc).AddTicks(370));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 6,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 59, 29, 217, DateTimeKind.Utc).AddTicks(372));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 7,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 59, 29, 217, DateTimeKind.Utc).AddTicks(375));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 8,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 59, 29, 217, DateTimeKind.Utc).AddTicks(377));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 9,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 59, 29, 217, DateTimeKind.Utc).AddTicks(379));

            migrationBuilder.UpdateData(
                table: "Departments",
                keyColumn: "Id",
                keyValue: 10,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 15, 19, 59, 29, 217, DateTimeKind.Utc).AddTicks(381));

            migrationBuilder.CreateIndex(
                name: "IX_DischargeNotes_AdmissionId",
                table: "DischargeNotes",
                column: "AdmissionId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Expenses");

            migrationBuilder.DropIndex(
                name: "IX_DischargeNotes_AdmissionId",
                table: "DischargeNotes");

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

            migrationBuilder.CreateIndex(
                name: "IX_DischargeNotes_AdmissionId",
                table: "DischargeNotes",
                column: "AdmissionId");
        }
    }
}
