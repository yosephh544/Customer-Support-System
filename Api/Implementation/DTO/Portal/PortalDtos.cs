using System.ComponentModel.DataAnnotations;
using Implementation.DTO.Tickets;
using Infrustructure.Enums;

namespace Implementation.DTO.Portal;

public class PortalDashboardDto
{
    public Guid OrganizationId { get; set; }
    public string OrganizationName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }

    public int ActiveTicketsCount { get; set; }
    public int PendingRequestsCount { get; set; }
    public int BreachedTicketsCount { get; set; }

    public List<PortalProjectSummaryDto> ActiveProjects { get; set; } = new();
    public List<TicketDto> RecentTickets { get; set; } = new();
}

public class PortalProjectSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? StartDate { get; set; }
    public int SupportWindowMonths { get; set; }
    public DateTime WarrantyExpiryDate { get; set; }
    public bool IsWarrantyActive { get; set; }
    public int DaysRemainingInWarranty { get; set; }
    public List<string> ModuleNames { get; set; } = new();
}

public class CreatePortalTicketDto
{
    [Required]
    public Guid ProjectId { get; set; }

    public Guid? ProjectModuleId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(4000)]
    public string Description { get; set; } = string.Empty;

    public TicketCategory Category { get; set; } = TicketCategory.SoftwareBug;

    public FailureType FailureType { get; set; } = FailureType.MinorBug;

    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
}

public class PortalServiceRequestDto
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    public string OrganizationName { get; set; } = string.Empty;
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public PortalRequestType RequestType { get; set; }
    public string RequestTypeName => RequestType.ToString();
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public PortalRequestStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public string SubmittedByUserId { get; set; } = string.Empty;
    public string SubmittedByUserName { get; set; } = string.Empty;
    public string? ReviewNotes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePortalServiceRequestDto
{
    [Required]
    public Guid ProjectId { get; set; }

    public PortalRequestType RequestType { get; set; } = PortalRequestType.AddonModule;

    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;
}

public class ReviewPortalServiceRequestDto
{
    public PortalRequestStatus Status { get; set; } = PortalRequestStatus.InReview;

    [MaxLength(1000)]
    public string? ReviewNotes { get; set; }

    // If true, automatically generates a Commercial Lead for the sales team!
    public bool GenerateCommercialOpportunity { get; set; } = true;
    public decimal EstimatedOpportunityValueETB { get; set; } = 0m;
}
