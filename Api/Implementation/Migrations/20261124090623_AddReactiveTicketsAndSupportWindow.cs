using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Implementation.Migrations
{
    /// <inheritdoc />
    public partial class AddReactiveTicketsAndSupportWindow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SupportWindowMonths",
                table: "Projects",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Tickets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TicketNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProjectId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProjectModuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ContactPersonId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    Category = table.Column<int>(type: "int", nullable: false),
                    FailureType = table.Column<int>(type: "int", nullable: false),
                    Priority = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Channel = table.Column<int>(type: "int", nullable: false),
                    AssignedToUserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    SlaDeadline = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SlaBreached = table.Column<bool>(type: "bit", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ResolutionSummary = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    IsWarrantyCovered = table.Column<bool>(type: "bit", nullable: false),
                    OutOfScopeQuoteETB = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    OutOfScopeQuoteApproved = table.Column<bool>(type: "bit", nullable: false),
                    EscalatedFromFeedbackId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tickets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tickets_ContactPersons_ContactPersonId",
                        column: x => x.ContactPersonId,
                        principalTable: "ContactPersons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Feedbacks_EscalatedFromFeedbackId",
                        column: x => x.EscalatedFromFeedbackId,
                        principalTable: "Feedbacks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Tickets_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_ProjectModules_ProjectModuleId",
                        column: x => x.ProjectModuleId,
                        principalTable: "ProjectModules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Users_AssignedToUserId",
                        column: x => x.AssignedToUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TicketMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TicketId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SenderUserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    IsInternalNote = table.Column<bool>(type: "bit", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    AttachmentUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TicketMessages_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TicketMessages_Users_SenderUserId",
                        column: x => x.SenderUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TicketMessages_SenderUserId",
                table: "TicketMessages",
                column: "SenderUserId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketMessages_TicketId",
                table: "TicketMessages",
                column: "TicketId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_AssignedToUserId",
                table: "Tickets",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_ContactPersonId",
                table: "Tickets",
                column: "ContactPersonId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_EscalatedFromFeedbackId",
                table: "Tickets",
                column: "EscalatedFromFeedbackId",
                unique: true,
                filter: "[EscalatedFromFeedbackId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_OrganizationId",
                table: "Tickets",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Priority",
                table: "Tickets",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_ProjectId",
                table: "Tickets",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_ProjectModuleId",
                table: "Tickets",
                column: "ProjectModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_SlaDeadline",
                table: "Tickets",
                column: "SlaDeadline");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Status",
                table: "Tickets",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_TicketNumber",
                table: "Tickets",
                column: "TicketNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TicketMessages");

            migrationBuilder.DropTable(
                name: "Tickets");

            migrationBuilder.DropColumn(
                name: "SupportWindowMonths",
                table: "Projects");
        }
    }
}
