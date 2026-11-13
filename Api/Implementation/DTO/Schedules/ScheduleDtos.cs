using System.ComponentModel.DataAnnotations;
using Implementation.DTO.Common;
using Infrustructure.Enums;

namespace Implementation.DTO.Schedules;

// Weekly Schedule DTOs
public class WeeklyScheduleSummaryDto
{
    public Guid Id { get; set; }
    public DateTime WeekStartDate { get; set; }
    public DateTime WeekEndDate { get; set; }

    // Compatibility aliases
    public DateTime StartDate => WeekStartDate;
    public DateTime EndDate => WeekEndDate;

    public int WeekNumber { get; set; }
    public int Year { get; set; }
    public WeeklyScheduleStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string? Notes { get; set; }
    public int TotalItems { get; set; }
    public int PendingItems { get; set; }
    public int CompletedItems { get; set; }
    public int SkippedItems { get; set; }

    // Compatibility aliases for frontend
    public int TotalSlots => TotalItems;
    public int CompletedSlots => CompletedItems;
    public int OverdueSlots => PendingItems;
    public bool IsPublished => Status == WeeklyScheduleStatus.Active || Status == WeeklyScheduleStatus.Completed;

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class WeeklyScheduleDetailsDto : WeeklyScheduleSummaryDto
{
    public List<ScheduleItemDto> Items { get; set; } = new();
}

public class CreateWeeklyScheduleDto
{
    private DateTime? _weekStartDate;
    private DateTime? _weekEndDate;

    public DateTime? WeekStartDate
    {
        get => _weekStartDate;
        set => _weekStartDate = value;
    }

    public DateTime? StartDate
    {
        get => _weekStartDate;
        set => _weekStartDate = value ?? _weekStartDate;
    }

    public DateTime? WeekEndDate
    {
        get => _weekEndDate;
        set => _weekEndDate = value;
    }

    public DateTime? EndDate
    {
        get => _weekEndDate;
        set => _weekEndDate = value ?? _weekEndDate;
    }

    public int? WeekNumber { get; set; }
    public int? Year { get; set; }
    public WeeklyScheduleStatus Status { get; set; } = WeeklyScheduleStatus.Draft;

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class UpdateWeeklyScheduleDto
{
    private DateTime? _weekStartDate;
    private DateTime? _weekEndDate;

    public DateTime? WeekStartDate
    {
        get => _weekStartDate;
        set => _weekStartDate = value;
    }

    public DateTime? StartDate
    {
        get => _weekStartDate;
        set => _weekStartDate = value ?? _weekStartDate;
    }

    public DateTime? WeekEndDate
    {
        get => _weekEndDate;
        set => _weekEndDate = value;
    }

    public DateTime? EndDate
    {
        get => _weekEndDate;
        set => _weekEndDate = value ?? _weekEndDate;
    }

    public WeeklyScheduleStatus Status { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class ScheduleFilterRequest : PaginationRequest
{
    public int? Year { get; set; }
    public int? WeekNumber { get; set; }
    public WeeklyScheduleStatus? Status { get; set; }
}

// Schedule Item DTOs
public class ScheduleItemDto
{
    public Guid Id { get; set; }
    public Guid WeeklyScheduleId { get; set; }
    public int WeekNumber { get; set; }
    public int Year { get; set; }

    public string AssignedUserId { get; set; } = string.Empty;
    public string AssignedUserName { get; set; } = string.Empty;
    public string AssignedUserFullName { get; set; } = string.Empty;

    // Compatibility aliases
    public string AgentName => !string.IsNullOrWhiteSpace(AssignedUserFullName) ? AssignedUserFullName : AssignedUserName;
    public DateTime? TargetDate => ScheduledDate;
    public string DayOfWeek => ScheduledDate.HasValue ? ScheduledDate.Value.ToString("dddd") : "Flexible";

    public Guid ContactPersonId { get; set; }
    public string ContactPersonName { get; set; } = string.Empty;
    public string ContactPersonPhone { get; set; } = string.Empty;
    public string? ContactPersonEmail { get; set; }
    public string? ContactPersonJobTitle { get; set; }

    public Guid OrganizationId { get; set; }
    public string OrganizationName { get; set; } = string.Empty;

    public Guid? ProjectId { get; set; }
    public string? ProjectName { get; set; }

    public Guid? ProjectModuleId { get; set; }
    public string? ModuleName { get; set; }

    public DateTime? ScheduledDate { get; set; }
    public ScheduleItemStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public DateTime? CompletedAt { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateScheduleItemDto
{
    [Required]
    public string AssignedUserId { get; set; } = string.Empty;

    [Required]
    public Guid ContactPersonId { get; set; }

    public DateTime? ScheduledDate { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class UpdateScheduleItemDto
{
    [Required]
    public string AssignedUserId { get; set; } = string.Empty;

    [Required]
    public Guid ContactPersonId { get; set; }

    public DateTime? ScheduledDate { get; set; }

    public ScheduleItemStatus Status { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class UpdateScheduleItemStatusDto
{
    [Required]
    public ScheduleItemStatus Status { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class ScheduleItemFilterRequest : PaginationRequest
{
    public Guid? WeeklyScheduleId { get; set; }
    public string? AssignedUserId { get; set; }
    public Guid? ProjectId { get; set; }
    public ScheduleItemStatus? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}

