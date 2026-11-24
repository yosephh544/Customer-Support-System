using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Infrustructure.Enums;

namespace Infrustructure.Models;

public class Campaign : BaseEntity
{
    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public CampaignType Type { get; set; } = CampaignType.Digital;

    [Column(TypeName = "decimal(18,2)")]
    public decimal BudgetETB { get; set; } = 0m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal ActualSpendETB { get; set; } = 0m;

    [Required]
    [MaxLength(100)]
    public string TargetRegion { get; set; } = "Addis Ababa";

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public CampaignStatus Status { get; set; } = CampaignStatus.Planning;

    [MaxLength(1000)]
    public string? Description { get; set; }

    // Navigation Properties
    public ICollection<Lead> Leads { get; set; } = new List<Lead>();
}
