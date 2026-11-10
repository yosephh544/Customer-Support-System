using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Infrustructure.Enums;

namespace Infrustructure.Models;

public class ScheduleItem : BaseEntity
{
    [Required]
    public Guid WeeklyScheduleId { get; set; }

    [Required]
    public string AssignedUserId { get; set; } = string.Empty;

    [Required]
    public Guid ContactPersonId { get; set; }

    public DateTime? ScheduledDate { get; set; }

    public ScheduleItemStatus Status { get; set; } = ScheduleItemStatus.Pending;

    public DateTime? CompletedAt { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation Properties
    [ForeignKey(nameof(WeeklyScheduleId))]
    public WeeklySchedule WeeklySchedule { get; set; } = null!;

    [ForeignKey(nameof(AssignedUserId))]
    public ApplicationUser AssignedUser { get; set; } = null!;

    [ForeignKey(nameof(ContactPersonId))]
    public ContactPerson ContactPerson { get; set; } = null!;

    public Feedback? Feedback { get; set; }
}

