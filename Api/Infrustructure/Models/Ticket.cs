using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Infrustructure.Enums;

namespace Infrustructure.Models;

public class Ticket : BaseEntity
{
    [Required]
    [MaxLength(50)]
    public string TicketNumber { get; set; } = string.Empty;

    [Required]
    public Guid OrganizationId { get; set; }

    [Required]
    public Guid ProjectId { get; set; }

    public Guid? ProjectModuleId { get; set; }

    public Guid? ContactPersonId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(4000)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public TicketCategory Category { get; set; } = TicketCategory.SoftwareBug;

    [Required]
    public FailureType FailureType { get; set; } = FailureType.MinorBug;

    [Required]
    public TicketPriority Priority { get; set; } = TicketPriority.Medium;

    [Required]
    public TicketStatus Status { get; set; } = TicketStatus.New;

    [Required]
    public SupportChannel Channel { get; set; } = SupportChannel.WebPortal;

    public string? AssignedToUserId { get; set; }

    public DateTime SlaDeadline { get; set; }

    public bool SlaBreached { get; set; } = false;

    public DateTime? ResolvedAt { get; set; }

    [MaxLength(2000)]
    public string? ResolutionSummary { get; set; }

    public bool IsWarrantyCovered { get; set; } = true;

    [Column(TypeName = "decimal(18,2)")]
    public decimal? OutOfScopeQuoteETB { get; set; }

    public bool OutOfScopeQuoteApproved { get; set; } = false;

    public Guid? EscalatedFromFeedbackId { get; set; }

    // Navigation Properties
    [ForeignKey(nameof(OrganizationId))]
    public Organization Organization { get; set; } = null!;

    [ForeignKey(nameof(ProjectId))]
    public Project Project { get; set; } = null!;

    [ForeignKey(nameof(ProjectModuleId))]
    public ProjectModule? ProjectModule { get; set; }

    [ForeignKey(nameof(ContactPersonId))]
    public ContactPerson? ContactPerson { get; set; }

    [ForeignKey(nameof(AssignedToUserId))]
    public ApplicationUser? AssignedToUser { get; set; }

    [ForeignKey(nameof(EscalatedFromFeedbackId))]
    public Feedback? EscalatedFromFeedback { get; set; }

    public ICollection<TicketMessage> Messages { get; set; } = new List<TicketMessage>();
}
