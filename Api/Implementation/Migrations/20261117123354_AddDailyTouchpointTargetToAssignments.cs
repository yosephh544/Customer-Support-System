using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Implementation.Migrations
{
    /// <inheritdoc />
    public partial class AddDailyTouchpointTargetToAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Notifications table and the WeeklySchedules index already exist in the
            // database; this migration only introduces the per-assignment daily target.
            migrationBuilder.AddColumn<int>(
                name: "DailyTouchpointTarget",
                table: "SupportAssignments",
                type: "int",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DailyTouchpointTarget",
                table: "SupportAssignments");
        }
    }
}
