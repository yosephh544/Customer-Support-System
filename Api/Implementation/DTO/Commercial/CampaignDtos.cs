using System.ComponentModel.DataAnnotations;
using Infrustructure.Enums;

namespace Implementation.DTO.Commercial;

public class CampaignDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public CampaignType Type { get; set; }
    public string TypeName => Type.ToString();
    public decimal BudgetETB { get; set; }
    public decimal ActualSpendETB { get; set; }
    public string TargetRegion { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public CampaignStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string? Description { get; set; }

    public int LeadCount { get; set; }
    public int WonLeadCount { get; set; }
    public decimal WonRevenueETB { get; set; }
    public double RoiPercentage { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCampaignDto
{
    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    public CampaignType Type { get; set; } = CampaignType.Digital;

    [Range(0, 100000000, ErrorMessage = "Budget must be non-negative.")]
    public decimal BudgetETB { get; set; }

    [Required]
    [MaxLength(100)]
    public string TargetRegion { get; set; } = "Addis Ababa";

    public DateTime StartDate { get; set; } = DateTime.UtcNow;

    public DateTime EndDate { get; set; } = DateTime.UtcNow.AddMonths(1);

    [MaxLength(1000)]
    public string? Description { get; set; }
}

public class UpdateCampaignDto
{
    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    public CampaignType Type { get; set; }

    [Range(0, 100000000, ErrorMessage = "Budget must be non-negative.")]
    public decimal BudgetETB { get; set; }

    [Range(0, 100000000, ErrorMessage = "Actual spend must be non-negative.")]
    public decimal ActualSpendETB { get; set; }

    [Required]
    [MaxLength(100)]
    public string TargetRegion { get; set; } = "Addis Ababa";

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public CampaignStatus Status { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }
}
