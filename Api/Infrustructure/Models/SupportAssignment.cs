using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Infrustructure.Models;

public class SupportAssignment : BaseEntity
{
    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public Guid ProjectId { get; set; }

    public Guid? ProjectModuleId { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Number of touchpoints the auto-generator should schedule for this agent
    /// on each day of a cycle. Configured by the team lead per assignment.
    /// </summary>
    [Range(1, 10)]
    public int DailyTouchpointTarget { get; set; } = 1;

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation Properties
    [ForeignKey(nameof(UserId))]
    public ApplicationUser User { get; set; } = null!;

    [ForeignKey(nameof(ProjectId))]
    public Project Project { get; set; } = null!;

    [ForeignKey(nameof(ProjectModuleId))]
    public ProjectModule? ProjectModule { get; set; }
}

