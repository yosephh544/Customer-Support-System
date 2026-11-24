using System.ComponentModel.DataAnnotations;
using Implementation.DTO.Common;
using Infrustructure.Enums;

namespace Implementation.DTO.Commercial;

public class LeadDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string OrganizationName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;

    public LeadSource Source { get; set; }
    public string SourceName => Source.ToString();

    public LeadStage Stage { get; set; }
    public string StageName => Stage.ToString();

    public Guid? CampaignId { get; set; }
    public string? CampaignTitle { get; set; }

    public decimal EstimatedValueETB { get; set; }
    public string? InterestedModules { get; set; }
    public string? Notes { get; set; }
    public string? LostReason { get; set; }

    public string? AssignedSalesUserId { get; set; }
    public string? AssignedSalesUserName { get; set; }

    public Guid? ConvertedOrganizationId { get; set; }
    public DateTime? ConvertedDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateLeadDto
{
    [Required]
    [MaxLength(120)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string OrganizationName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string PhoneNumber { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Region { get; set; } = "Addis Ababa";

    public LeadSource Source { get; set; } = LeadSource.DirectReferral;

    public Guid? CampaignId { get; set; }

    [Range(0, 1000000000, ErrorMessage = "Estimated value must be non-negative.")]
    public decimal EstimatedValueETB { get; set; } = 0m;

    [MaxLength(500)]
    public string? InterestedModules { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }

    public string? AssignedSalesUserId { get; set; }
}

public class UpdateLeadDto
{
    [Required]
    [MaxLength(120)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string OrganizationName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string PhoneNumber { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Region { get; set; } = "Addis Ababa";

    public LeadSource Source { get; set; }

    public LeadStage Stage { get; set; }

    public Guid? CampaignId { get; set; }

    [Range(0, 1000000000, ErrorMessage = "Estimated value must be non-negative.")]
    public decimal EstimatedValueETB { get; set; }

    [MaxLength(500)]
    public string? InterestedModules { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }

    [MaxLength(500)]
    public string? LostReason { get; set; }

    public string? AssignedSalesUserId { get; set; }
}

public class LeadFilterRequest : PaginationRequest
{
    public LeadStage? Stage { get; set; }
    public LeadSource? Source { get; set; }
    public Guid? CampaignId { get; set; }
    public string? Region { get; set; }
    public string? AssignedSalesUserId { get; set; }
}

public class LeadPipelineSummaryDto
{
    public int TotalLeads { get; set; }
    public decimal TotalPipelineValueETB { get; set; }
    public decimal WonRevenueETB { get; set; }
    public double WinRatePercentage { get; set; }
    public Dictionary<string, int> StageCounts { get; set; } = new();
    public Dictionary<string, decimal> StageValuesETB { get; set; } = new();
    public Dictionary<string, int> SourceDistribution { get; set; } = new();
}

public class ConvertLeadDto
{
    public int SupportWindowMonths { get; set; } = 12;
    public string? PrimarySupportSpecialistUserId { get; set; }
}

public class ConvertLeadResultDto
{
    public Guid OrganizationId { get; set; }
    public string OrganizationName { get; set; } = string.Empty;
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public Guid ContactPersonId { get; set; }
    public string ContactPersonName { get; set; } = string.Empty;
    public int ModulesProvisionedCount { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class PublicLeadSubmissionDto
{
    [Required]
    [MaxLength(120)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string OrganizationName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string PhoneNumber { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Region { get; set; } = "Addis Ababa";

    [MaxLength(500)]
    public string? InterestedModules { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }

    public Guid? CampaignId { get; set; }
}
