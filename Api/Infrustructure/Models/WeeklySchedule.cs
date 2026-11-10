using System.ComponentModel.DataAnnotations;
using Infrustructure.Enums;

namespace Infrustructure.Models;

public class WeeklySchedule : BaseEntity
{
    [Required]
    public DateTime WeekStartDate { get; set; }

    [Required]
    public DateTime WeekEndDate { get; set; }

    public int WeekNumber { get; set; }

    public int Year { get; set; }

    public WeeklyScheduleStatus Status { get; set; } = WeeklyScheduleStatus.Draft;

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation Properties
    public ICollection<ScheduleItem> ScheduleItems { get; set; } = new List<ScheduleItem>();
}

