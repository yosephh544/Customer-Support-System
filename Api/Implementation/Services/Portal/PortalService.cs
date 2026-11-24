using Implementation.Datas;
using Implementation.DTO.Common;
using Implementation.DTO.Portal;
using Implementation.DTO.Tickets;
using Implementation.Exceptions;
using Implementation.Interfaces.Notifications;
using Implementation.Interfaces.Portal;
using Implementation.Interfaces.Tickets;
using Infrustructure.Enums;
using Infrustructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Implementation.Services.Portal;

public class PortalService : IPortalService
{
    private readonly ApplicationDbContext _context;
    private readonly ITicketService _ticketService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<PortalService> _logger;

    public PortalService(
        ApplicationDbContext context,
        ITicketService ticketService,
        INotificationService notificationService,
        ILogger<PortalService> logger)
    {
        _context = context;
        _ticketService = ticketService;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<PortalDashboardDto> GetClientDashboardAsync(Guid organizationId)
    {
        var org = await _context.Organizations
            .AsNoTracking()
            .Include(o => o.Projects)
                .ThenInclude(p => p.ProjectModules)
            .FirstOrDefaultAsync(o => o.Id == organizationId);

        if (org == null)
            throw new NotFoundException("Client organization profile not found.");

        var nowUtc = DateTime.UtcNow;

        // Active Projects & Warranty Coverage
        var projectSummaries = org.Projects.Select(p =>
        {
            var warrantyStart = p.StartDate ?? p.CreatedAt;
            var warrantyExpiry = warrantyStart.AddMonths(p.SupportWindowMonths > 0 ? p.SupportWindowMonths : 12);
            bool isWarrantyActive = nowUtc <= warrantyExpiry;
            int daysRemaining = isWarrantyActive ? (int)(warrantyExpiry - nowUtc).TotalDays : 0;

            return new PortalProjectSummaryDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                StartDate = p.StartDate,
                SupportWindowMonths = p.SupportWindowMonths,
                WarrantyExpiryDate = warrantyExpiry,
                IsWarrantyActive = isWarrantyActive,
                DaysRemainingInWarranty = daysRemaining,
                ModuleNames = p.ProjectModules.Select(m => m.Name).ToList()
            };
        }).ToList();

        // Ticket counts strictly scoped to this organization
        var orgTickets = await _context.Tickets
            .AsNoTracking()
            .Where(t => t.OrganizationId == organizationId)
            .ToListAsync();

        int activeTickets = orgTickets.Count(t => t.Status != TicketStatus.Resolved && t.Status != TicketStatus.Closed);
        int breachedTickets = orgTickets.Count(t => t.Status != TicketStatus.Resolved && t.Status != TicketStatus.Closed && nowUtc > t.SlaDeadline);

        int pendingRequests = await _context.PortalServiceRequests
            .AsNoTracking()
            .CountAsync(r => r.OrganizationId == organizationId && r.Status == PortalRequestStatus.Pending);

        // Recent 5 tickets (messages will have internal notes filtered)
        var recentTicketDtos = await _ticketService.GetTicketsAsync(new TicketFilterRequest
        {
            OrganizationId = organizationId,
            PageNumber = 1,
            PageSize = 5
        });

        return new PortalDashboardDto
        {
            OrganizationId = org.Id,
            OrganizationName = org.Name,
            Email = org.Email,
            Phone = org.Phone,
            Address = org.Address,
            ActiveTicketsCount = activeTickets,
            PendingRequestsCount = pendingRequests,
            BreachedTicketsCount = breachedTickets,
            ActiveProjects = projectSummaries,
            RecentTickets = recentTicketDtos.Items.ToList()
        };
    }

    public async Task<PagedResult<TicketDto>> GetClientTicketsAsync(Guid organizationId, TicketFilterRequest filter)
    {
        // Enforce organization multi-tenant constraint
        filter.OrganizationId = organizationId;
        return await _ticketService.GetTicketsAsync(filter);
    }

    public async Task<TicketDto> SubmitClientTicketAsync(Guid organizationId, string userId, CreatePortalTicketDto request)
    {
        var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId && p.OrganizationId == organizationId);
        if (project == null)
            throw new BadRequestException("Selected project does not belong to your organization.");

        var createDto = new CreateTicketDto
        {
            OrganizationId = organizationId,
            ProjectId = request.ProjectId,
            ProjectModuleId = request.ProjectModuleId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Category = request.Category,
            FailureType = request.FailureType,
            Priority = request.Priority,
            Channel = SupportChannel.WebPortal
        };

        var ticket = await _ticketService.CreateTicketAsync(createDto, userId);

        // Notify support team of new client ticket
        try
        {
            await _notificationService.CreateNotificationForRoleAsync(
                UserRole.TeamLead,
                "New Client Portal Ticket",
                $"Client logged ticket {ticket.TicketNumber} ({ticket.Priority}): '{ticket.Title}'",
                "ClientTicketSubmitted");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send notification for client portal ticket");
        }

        return ticket;
    }

    public async Task<TicketDto> GetClientTicketByIdAsync(Guid organizationId, Guid ticketId)
    {
        var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == ticketId && t.OrganizationId == organizationId);
        if (ticket == null)
            throw new NotFoundException("Support ticket not found.");

        var ticketDto = await _ticketService.GetTicketByIdAsync(ticketId);

        // Strictly strip out internal staff notes from client view
        ticketDto.RecentMessages = ticketDto.RecentMessages
            .Where(m => !m.IsInternalNote)
            .ToList();

        return ticketDto;
    }

    public async Task<TicketMessageDto> AddClientTicketMessageAsync(Guid organizationId, Guid ticketId, string userId, string message)
    {
        var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == ticketId && t.OrganizationId == organizationId);
        if (ticket == null)
            throw new NotFoundException("Support ticket not found.");

        return await _ticketService.AddMessageAsync(ticketId, new CreateTicketMessageDto
        {
            Message = message.Trim(),
            IsInternalNote = false // Clients can NEVER submit internal staff notes
        }, userId);
    }

    public async Task<List<PortalServiceRequestDto>> GetClientServiceRequestsAsync(Guid organizationId)
    {
        var requests = await _context.PortalServiceRequests
            .AsNoTracking()
            .Include(r => r.Organization)
            .Include(r => r.Project)
            .Include(r => r.SubmittedByUser)
            .Where(r => r.OrganizationId == organizationId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return requests.Select(MapToDto).ToList();
    }

    public async Task<PortalServiceRequestDto> SubmitServiceRequestAsync(Guid organizationId, string userId, CreatePortalServiceRequestDto request)
    {
        var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId && p.OrganizationId == organizationId);
        if (project == null)
            throw new BadRequestException("Selected project does not belong to your organization.");

        var serviceRequest = new PortalServiceRequest
        {
            OrganizationId = organizationId,
            ProjectId = request.ProjectId,
            RequestType = request.RequestType,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Status = PortalRequestStatus.Pending,
            SubmittedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.PortalServiceRequests.Add(serviceRequest);
        await _context.SaveChangesAsync();

        // Notify Director / Commercial team of client expansion interest
        try
        {
            await _notificationService.CreateNotificationForRoleAsync(
                UserRole.Director,
                "Customer Service Expansion Request",
                $"Client '{project.Name}' requested {request.RequestType}: '{request.Title}'",
                "ClientExpansionRequest");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send notification for service request");
        }

        return await GetServiceRequestByIdAsync(serviceRequest.Id);
    }

    public async Task<PortalServiceRequestDto> ReviewServiceRequestAsync(Guid requestId, ReviewPortalServiceRequestDto request, string reviewerUserId)
    {
        var serviceRequest = await _context.PortalServiceRequests
            .Include(r => r.Organization)
            .Include(r => r.Project)
            .Include(r => r.SubmittedByUser)
            .FirstOrDefaultAsync(r => r.Id == requestId);

        if (serviceRequest == null)
            throw new NotFoundException("Portal service request not found.");

        serviceRequest.Status = request.Status;
        serviceRequest.ReviewNotes = request.ReviewNotes?.Trim();
        serviceRequest.UpdatedAt = DateTime.UtcNow;

        // Bridge to Commercial Pipeline: Auto-generate commercial opportunity for the sales desk!
        if (request.GenerateCommercialOpportunity && serviceRequest.GeneratedLeadId == null)
        {
            var lead = new Lead
            {
                FullName = serviceRequest.SubmittedByUser.FullName,
                OrganizationName = serviceRequest.Organization.Name,
                Email = serviceRequest.SubmittedByUser.Email ?? serviceRequest.Organization.Email ?? "client@org.com",
                PhoneNumber = serviceRequest.SubmittedByUser.PhoneNumber ?? serviceRequest.Organization.Phone ?? "+251911000000",
                Region = serviceRequest.Organization.Address ?? "Addis Ababa",
                Source = LeadSource.InboundInquiry,
                Stage = LeadStage.New,
                EstimatedValueETB = request.EstimatedOpportunityValueETB,
                InterestedModules = $"[Client Portal Request] {serviceRequest.RequestType}: {serviceRequest.Title}",
                Notes = serviceRequest.Description,
                CreatedAt = DateTime.UtcNow
            };

            _context.Leads.Add(lead);
            await _context.SaveChangesAsync();

            serviceRequest.GeneratedLeadId = lead.Id;
        }

        await _context.SaveChangesAsync();

        return MapToDto(serviceRequest);
    }

    private async Task<PortalServiceRequestDto> GetServiceRequestByIdAsync(Guid id)
    {
        var request = await _context.PortalServiceRequests
            .Include(r => r.Organization)
            .Include(r => r.Project)
            .Include(r => r.SubmittedByUser)
            .FirstAsync(r => r.Id == id);

        return MapToDto(request);
    }

    private static PortalServiceRequestDto MapToDto(PortalServiceRequest r)
    {
        return new PortalServiceRequestDto
        {
            Id = r.Id,
            OrganizationId = r.OrganizationId,
            OrganizationName = r.Organization?.Name ?? string.Empty,
            ProjectId = r.ProjectId,
            ProjectName = r.Project?.Name ?? string.Empty,
            RequestType = r.RequestType,
            Title = r.Title,
            Description = r.Description,
            Status = r.Status,
            SubmittedByUserId = r.SubmittedByUserId,
            SubmittedByUserName = r.SubmittedByUser?.FullName ?? "Client Contact",
            ReviewNotes = r.ReviewNotes,
            CreatedAt = r.CreatedAt
        };
    }
}
