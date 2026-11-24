using System.ComponentModel.DataAnnotations;
using Implementation.DTO.Common;
using Infrustructure.Enums;

namespace Implementation.DTO.Tickets;

public class TicketDto
{
    public Guid Id { get; set; }
    public string TicketNumber { get; set; } = string.Empty;

    public Guid OrganizationId { get; set; }
    public string OrganizationName { get; set; } = string.Empty;

    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;

    public Guid? ProjectModuleId { get; set; }
    public string? ModuleName { get; set; }

    public Guid? ContactPersonId { get; set; }
    public string? ContactPersonName { get; set; }
    public string? ContactPersonPhone { get; set; }
    public string? ContactPersonEmail { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    public TicketCategory Category { get; set; }
    public string CategoryName => Category.ToString();

    public FailureType FailureType { get; set; }
    public string FailureTypeName => FailureType.ToString();

    public TicketPriority Priority { get; set; }
    public string PriorityName => Priority.ToString();

    public TicketStatus Status { get; set; }
    public string StatusName => Status.ToString();

    public SupportChannel Channel { get; set; }
    public string ChannelName => Channel.ToString();

    public string? AssignedToUserId { get; set; }
    public string? AssignedToUserName { get; set; }
    public string? AssignedToUserEmail { get; set; }

    public DateTime SlaDeadline { get; set; }
    public bool SlaBreached { get; set; }
    public double SlaConsumedPercent { get; set; }
    public double RemainingWorkingHours { get; set; }

    public DateTime? ResolvedAt { get; set; }
    public string? ResolutionSummary { get; set; }

    public bool IsWarrantyCovered { get; set; }
    public decimal? OutOfScopeQuoteETB { get; set; }
    public bool OutOfScopeQuoteApproved { get; set; }

    public Guid? EscalatedFromFeedbackId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public int MessageCount { get; set; }
    public List<TicketMessageDto> RecentMessages { get; set; } = new();
}

public class CreateTicketDto
{
    [Required]
    public Guid OrganizationId { get; set; }

    [Required]
    public Guid ProjectId { get; set; }

    public Guid? ProjectModuleId { get; set; }

    public Guid? ContactPersonId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(4000)]
    public string Description { get; set; } = string.Empty;

    public TicketCategory Category { get; set; } = TicketCategory.SoftwareBug;

    public FailureType FailureType { get; set; } = FailureType.MinorBug;

    public TicketPriority Priority { get; set; } = TicketPriority.Medium;

    public SupportChannel Channel { get; set; } = SupportChannel.WebPortal;

    public string? AssignedToUserId { get; set; }

    public Guid? EscalatedFromFeedbackId { get; set; }
}

public class UpdateTicketDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(4000)]
    public string Description { get; set; } = string.Empty;

    public TicketCategory Category { get; set; }

    public FailureType FailureType { get; set; }

    public TicketPriority Priority { get; set; }

    public TicketStatus Status { get; set; }

    public string? AssignedToUserId { get; set; }

    [MaxLength(2000)]
    public string? ResolutionSummary { get; set; }
}

public class AssignTicketDto
{
    [Required]
    public string AssignedToUserId { get; set; } = string.Empty;
}

public class ResolveTicketDto
{
    [Required]
    [MaxLength(2000)]
    public string ResolutionSummary { get; set; } = string.Empty;
}

public class TicketMessageDto
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public string SenderUserId { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string SenderRole { get; set; } = string.Empty;
    public bool IsInternalNote { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateTicketMessageDto
{
    [Required]
    [MaxLength(4000)]
    public string Message { get; set; } = string.Empty;

    public bool IsInternalNote { get; set; } = false;

    [MaxLength(1000)]
    public string? AttachmentUrl { get; set; }
}

public class TicketFilterRequest : PaginationRequest
{
    public Guid? OrganizationId { get; set; }
    public Guid? ProjectId { get; set; }
    public Guid? ProjectModuleId { get; set; }
    public string? AssignedToUserId { get; set; }
    public TicketStatus? Status { get; set; }
    public TicketPriority? Priority { get; set; }
    public TicketCategory? Category { get; set; }
    public bool? IsWarrantyCovered { get; set; }
    public bool? SlaBreachedOnly { get; set; }
}

public class TicketAnalyticsDto
{
    public int TotalTickets { get; set; }
    public int OpenTickets { get; set; }
    public int InProgressTickets { get; set; }
    public int ResolvedTickets { get; set; }
    public int BreachedTickets { get; set; }
    public int CriticalTickets { get; set; } // High + Blocker
    public double SlaComplianceRate { get; set; } // % resolved within SLA
    public Dictionary<string, int> StatusDistribution { get; set; } = new();
    public Dictionary<string, int> PriorityDistribution { get; set; } = new();
    public Dictionary<string, int> CategoryDistribution { get; set; } = new();
}

public class EscalateFeedbackRequest
{
    public TicketPriority? OverridePriority { get; set; }
    public string? AdditionalNotes { get; set; }
    public string? AssignedToUserId { get; set; }
}
