using System;

namespace Infrustructure.Models;

public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "Info"; // ScheduleAssignment, ScheduleUpdate, NewOrganization, TaskIncomplete, CriticalFeedback
    public bool IsRead { get; set; } = false;
    public string? RelatedEntityId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }
}

