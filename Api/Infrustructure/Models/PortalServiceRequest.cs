using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Infrustructure.Enums;

namespace Infrustructure.Models;

public class PortalServiceRequest : BaseEntity
{
    [Required]
    public Guid OrganizationId { get; set; }

    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    public PortalRequestType RequestType { get; set; } = PortalRequestType.AddonModule;

    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    public PortalRequestStatus Status { get; set; } = PortalRequestStatus.Pending;

    [Required]
    public string SubmittedByUserId { get; set; } = string.Empty;

    public Guid? GeneratedLeadId { get; set; }

    [MaxLength(1000)]
    public string? ReviewNotes { get; set; }

    // Navigation Properties
    [ForeignKey(nameof(OrganizationId))]
    public Organization Organization { get; set; } = null!;

    [ForeignKey(nameof(ProjectId))]
    public Project Project { get; set; } = null!;

    [ForeignKey(nameof(SubmittedByUserId))]
    public ApplicationUser SubmittedByUser { get; set; } = null!;

    [ForeignKey(nameof(GeneratedLeadId))]
    public Lead? GeneratedLead { get; set; }
}
