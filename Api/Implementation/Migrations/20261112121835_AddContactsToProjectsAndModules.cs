using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Implementation.Migrations
{
    /// <inheritdoc />
    public partial class AddContactsToProjectsAndModules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContactPersonName",
                table: "Projects",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPersonPhone",
                table: "Projects",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SecondaryContactPersonName",
                table: "Projects",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SecondaryContactPersonPhone",
                table: "Projects",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPersonName",
                table: "ProjectModules",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPersonPhone",
                table: "ProjectModules",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SecondaryContactPersonName",
                table: "ProjectModules",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SecondaryContactPersonPhone",
                table: "ProjectModules",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContactPersonName",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ContactPersonPhone",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "SecondaryContactPersonName",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "SecondaryContactPersonPhone",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ContactPersonName",
                table: "ProjectModules");

            migrationBuilder.DropColumn(
                name: "ContactPersonPhone",
                table: "ProjectModules");

            migrationBuilder.DropColumn(
                name: "SecondaryContactPersonName",
                table: "ProjectModules");

            migrationBuilder.DropColumn(
                name: "SecondaryContactPersonPhone",
                table: "ProjectModules");
        }
    }
}
