using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Infrustructure.Enums;

namespace Infrustructure.Models;

public class Lead : BaseEntity
{
    [Required]
    [MaxLength(120)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string OrganizationName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Region { get; set; } = "Addis Ababa";

    public LeadSource Source { get; set; } = LeadSource.Website;

    public LeadStage Stage { get; set; } = LeadStage.New;

    public Guid? CampaignId { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal EstimatedValueETB { get; set; } = 0m;

    [MaxLength(500)]
    public string? InterestedModules { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }

    [MaxLength(500)]
    public string? LostReason { get; set; }

    public string? AssignedSalesUserId { get; set; }

    // 1-Click Conversion Bridge Audit Links
    public Guid? ConvertedOrganizationId { get; set; }
    public DateTime? ConvertedDate { get; set; }

    // Navigation Properties
    [ForeignKey(nameof(CampaignId))]
    public Campaign? Campaign { get; set; }

    [ForeignKey(nameof(ConvertedOrganizationId))]
    public Organization? ConvertedOrganization { get; set; }

    [ForeignKey(nameof(AssignedSalesUserId))]
    public ApplicationUser? AssignedSalesUser { get; set; }
}
