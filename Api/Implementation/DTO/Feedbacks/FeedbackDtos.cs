using System.ComponentModel.DataAnnotations;
using Implementation.DTO.Common;
using Infrustructure.Enums;

namespace Implementation.DTO.Feedbacks;

public class FeedbackDto
{
    public Guid Id { get; set; }
    public Guid ScheduleItemId { get; set; }
    public int Rating { get; set; }
    public FeedbackPriority Priority { get; set; }
    public string PriorityName => Priority.ToString();
    public FeedbackStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string Remarks { get; set; } = string.Empty;
    public string? ResolutionNotes { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Enriched touchpoint & account metadata
    public Guid? OrganizationId { get; set; }
    public string? OrganizationName { get; set; }
    public Guid? ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public Guid? ProjectModuleId { get; set; }
    public string? ModuleName { get; set; }
    public string? ContactPersonName { get; set; }
    public string? ContactPersonPhone { get; set; }
    public string? ContactPersonEmail { get; set; }
    public string? ContactPersonJobTitle { get; set; }
    public string? AssignedUserId { get; set; }
    public string? AssignedUserFullName { get; set; }
    public string? AssignedUserEmail { get; set; }
    public DateTime? ScheduledDate { get; set; }
}

public class CreateFeedbackDto
{
    [Required]
    public Guid ScheduleItemId { get; set; }

    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5.")]
    public int Rating { get; set; } = 5;

    public FeedbackPriority Priority { get; set; } = FeedbackPriority.Medium;

    public FeedbackStatus Status { get; set; } = FeedbackStatus.Open;

    [Required]
    [MaxLength(1000)]
    public string Remarks { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? ResolutionNotes { get; set; }
}

public class UpdateFeedbackDto
{
    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5.")]
    public int Rating { get; set; }

    public FeedbackPriority Priority { get; set; }

    public FeedbackStatus Status { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Remarks { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? ResolutionNotes { get; set; }
}

public class FeedbackFilterRequest : PaginationRequest
{
    public Guid? OrganizationId { get; set; }
    public Guid? ProjectId { get; set; }
    public Guid? ProjectModuleId { get; set; }
    public string? AssignedUserId { get; set; }
    public Guid? ScheduleItemId { get; set; }
    public int? Rating { get; set; }
    public FeedbackPriority? Priority { get; set; }
    public FeedbackStatus? Status { get; set; }
}

public class FeedbackAnalyticsDto
{
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public double PositivePercentage { get; set; }
    public Dictionary<int, int> RatingDistribution { get; set; } = new();
    public Dictionary<string, int> PriorityDistribution { get; set; } = new();
    public Dictionary<string, int> StatusDistribution { get; set; } = new();
    public List<FeedbackDto> RecentFeedbacks { get; set; } = new();
}
