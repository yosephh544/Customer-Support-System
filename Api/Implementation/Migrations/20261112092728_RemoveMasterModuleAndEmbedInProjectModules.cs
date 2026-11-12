using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Implementation.Migrations
{
    /// <inheritdoc />
    public partial class RemoveMasterModuleAndEmbedInProjectModules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProjectModules_MasterModules_MasterModuleId",
                table: "ProjectModules");

            migrationBuilder.DropTable(
                name: "MasterModules");

            migrationBuilder.DropIndex(
                name: "IX_ProjectModules_MasterModuleId",
                table: "ProjectModules");

            migrationBuilder.DropIndex(
                name: "IX_ProjectModules_ProjectId_MasterModuleId",
                table: "ProjectModules");

            migrationBuilder.DropColumn(
                name: "MasterModuleId",
                table: "ProjectModules");

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "ProjectModules",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "ProjectModules",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "ProjectModules",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectModules_ProjectId",
                table: "ProjectModules",
                column: "ProjectId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ProjectModules_ProjectId",
                table: "ProjectModules");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "ProjectModules");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "ProjectModules");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "ProjectModules");

            migrationBuilder.AddColumn<Guid>(
                name: "MasterModuleId",
                table: "ProjectModules",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "MasterModules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MasterModules", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectModules_MasterModuleId",
                table: "ProjectModules",
                column: "MasterModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectModules_ProjectId_MasterModuleId",
                table: "ProjectModules",
                columns: new[] { "ProjectId", "MasterModuleId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MasterModules_Code",
                table: "MasterModules",
                column: "Code",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectModules_MasterModules_MasterModuleId",
                table: "ProjectModules",
                column: "MasterModuleId",
                principalTable: "MasterModules",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
