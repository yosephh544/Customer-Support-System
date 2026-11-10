using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Infrustructure.Enums;

namespace Infrustructure.Models;

public class Feedback : BaseEntity
{
    [Required]
    public Guid ScheduleItemId { get; set; }

    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5.")]
    public int Rating { get; set; }

    [Required]
    public FeedbackPriority Priority { get; set; } = FeedbackPriority.Medium;

    [Required]
    public FeedbackStatus Status { get; set; } = FeedbackStatus.Open;

    [Required]
    public string Remarks { get; set; } = string.Empty;

    public string? ResolutionNotes { get; set; }

    public DateTime? ResolvedAt { get; set; }

    // Navigation Properties (Strict 1-to-1 link with ScheduleItem)
    [ForeignKey(nameof(ScheduleItemId))]
    public ScheduleItem ScheduleItem { get; set; } = null!;
}

