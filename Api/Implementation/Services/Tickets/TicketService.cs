using Implementation.Datas;
using Implementation.DTO.Common;
using Implementation.DTO.Tickets;
using Implementation.Exceptions;
using Implementation.Interfaces.Notifications;
using Implementation.Interfaces.Tickets;
using Infrustructure.Enums;
using Infrustructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Implementation.Services.Tickets;

public class TicketService : ITicketService
{
    private readonly ApplicationDbContext _context;
    private readonly IEthiopianSlaCalculator _slaCalculator;
    private readonly INotificationService _notificationService;
    private readonly ILogger<TicketService> _logger;

    public TicketService(
        ApplicationDbContext _context,
        IEthiopianSlaCalculator slaCalculator,
        INotificationService notificationService,
        ILogger<TicketService> logger)
    {
        this._context = _context;
        _slaCalculator = slaCalculator;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<PagedResult<TicketDto>> GetTicketsAsync(TicketFilterRequest filter)
    {
        var query = _context.Tickets
            .AsNoTracking()
            .Include(t => t.Organization)
            .Include(t => t.Project)
            .Include(t => t.ProjectModule)
            .Include(t => t.ContactPerson)
            .Include(t => t.AssignedToUser)
            .AsQueryable();

        if (filter.OrganizationId.HasValue)
            query = query.Where(t => t.OrganizationId == filter.OrganizationId.Value);

        if (filter.ProjectId.HasValue)
            query = query.Where(t => t.ProjectId == filter.ProjectId.Value);

        if (filter.ProjectModuleId.HasValue)
            query = query.Where(t => t.ProjectModuleId == filter.ProjectModuleId.Value);

        if (!string.IsNullOrWhiteSpace(filter.AssignedToUserId))
            query = query.Where(t => t.AssignedToUserId == filter.AssignedToUserId);

        if (filter.Status.HasValue)
            query = query.Where(t => t.Status == filter.Status.Value);

        if (filter.Priority.HasValue)
            query = query.Where(t => t.Priority == filter.Priority.Value);

        if (filter.Category.HasValue)
            query = query.Where(t => t.Category == filter.Category.Value);

        if (filter.IsWarrantyCovered.HasValue)
            query = query.Where(t => t.IsWarrantyCovered == filter.IsWarrantyCovered.Value);

        if (filter.SlaBreachedOnly == true)
        {
            var now = DateTime.UtcNow;
            query = query.Where(t => t.SlaBreached || (t.Status != TicketStatus.Resolved && t.Status != TicketStatus.Closed && now > t.SlaDeadline));
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim().ToLower();
            query = query.Where(t =>
                t.TicketNumber.ToLower().Contains(term) ||
                t.Title.ToLower().Contains(term) ||
                t.Description.ToLower().Contains(term) ||
                t.Organization.Name.ToLower().Contains(term) ||
                t.Project.Name.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync();

        // Default sorting: Open/High priority first, then SLA deadline ascending
        query = query.OrderByDescending(t => t.Priority)
                     .ThenBy(t => t.SlaDeadline);

        var tickets = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        var nowUtc = DateTime.UtcNow;
        var dtos = tickets.Select(t => MapToDto(t, nowUtc)).ToList();

        return new PagedResult<TicketDto>(dtos, totalCount, filter.PageNumber, filter.PageSize);
    }

    public async Task<TicketDto> GetTicketByIdAsync(Guid id)
    {
        var ticket = await _context.Tickets
            .Include(t => t.Organization)
            .Include(t => t.Project)
            .Include(t => t.ProjectModule)
            .Include(t => t.ContactPerson)
            .Include(t => t.AssignedToUser)
            .Include(t => t.Messages)
                .ThenInclude(m => m.SenderUser)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
            throw new NotFoundException("Support ticket not found.");

        var nowUtc = DateTime.UtcNow;
        var dto = MapToDto(ticket, nowUtc);

        dto.RecentMessages = ticket.Messages
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new TicketMessageDto
            {
                Id = m.Id,
                TicketId = m.TicketId,
                SenderUserId = m.SenderUserId,
                SenderName = m.SenderUser?.FullName ?? "Unknown",
                SenderRole = m.SenderUser?.Role.ToString() ?? "Staff",
                IsInternalNote = m.IsInternalNote,
                Message = m.Message,
                AttachmentUrl = m.AttachmentUrl,
                CreatedAt = m.CreatedAt
            })
            .ToList();

        dto.MessageCount = ticket.Messages.Count;
        return dto;
    }

    public async Task<TicketDto> CreateTicketAsync(CreateTicketDto request, string? currentUserId)
    {
        var project = await _context.Projects.FindAsync(request.ProjectId);
        if (project == null)
            throw new NotFoundException("Referenced project not found.");

        if (project.OrganizationId != request.OrganizationId)
            throw new BadRequestException("Project does not belong to the specified organization.");

        var nowUtc = DateTime.UtcNow;

        // Warranty window check (sign date or start date + support window months)
        var warrantyStart = project.StartDate ?? project.CreatedAt;
        var warrantyExpiry = warrantyStart.AddMonths(project.SupportWindowMonths > 0 ? project.SupportWindowMonths : 12);
        bool isWarrantyCovered = nowUtc <= warrantyExpiry;
        decimal? outOfScopeQuote = isWarrantyCovered ? null : 1500.00m;

        // Ethiopian business-hour SLA deadline calculation
        var slaDeadline = _slaCalculator.CalculateDeadline(nowUtc, request.Priority);

        // Sequential ticket number generation
        var countThisMonth = await _context.Tickets.CountAsync(t => t.CreatedAt.Year == nowUtc.Year && t.CreatedAt.Month == nowUtc.Month);
        var ticketNumber = $"DAF-TCK-{nowUtc:yyMM}-{(countThisMonth + 1):D4}";

        var ticket = new Ticket
        {
            TicketNumber = ticketNumber,
            OrganizationId = request.OrganizationId,
            ProjectId = request.ProjectId,
            ProjectModuleId = request.ProjectModuleId,
            ContactPersonId = request.ContactPersonId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Category = request.Category,
            FailureType = request.FailureType,
            Priority = request.Priority,
            Status = !string.IsNullOrWhiteSpace(request.AssignedToUserId) ? TicketStatus.Assigned : TicketStatus.New,
            Channel = request.Channel,
            AssignedToUserId = request.AssignedToUserId,
            SlaDeadline = slaDeadline,
            SlaBreached = false,
            IsWarrantyCovered = isWarrantyCovered,
            OutOfScopeQuoteETB = outOfScopeQuote,
            EscalatedFromFeedbackId = request.EscalatedFromFeedbackId,
            CreatedAt = nowUtc
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        // Send notification to assigned specialist if assigned immediately
        if (!string.IsNullOrWhiteSpace(ticket.AssignedToUserId))
        {
            await TrySendNotificationAsync(ticket.AssignedToUserId,
                "New Ticket Assigned",
                $"Ticket {ticket.TicketNumber} ({ticket.Priority}) has been assigned to you: '{ticket.Title}'",
                "TicketAssigned");
        }

        return await GetTicketByIdAsync(ticket.Id);
    }

    public async Task<TicketDto> UpdateTicketAsync(Guid id, UpdateTicketDto request, string? currentUserId)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null)
            throw new NotFoundException("Ticket not found.");

        var previousAssignee = ticket.AssignedToUserId;
        var previousPriority = ticket.Priority;

        ticket.Title = request.Title.Trim();
        ticket.Description = request.Description.Trim();
        ticket.Category = request.Category;
        ticket.FailureType = request.FailureType;
        ticket.Priority = request.Priority;
        ticket.Status = request.Status;
        ticket.AssignedToUserId = request.AssignedToUserId;
        ticket.ResolutionSummary = request.ResolutionSummary;
        ticket.UpdatedAt = DateTime.UtcNow;

        // Recalculate SLA if priority changed and ticket is not resolved
        if (previousPriority != request.Priority && ticket.Status != TicketStatus.Resolved && ticket.Status != TicketStatus.Closed)
        {
            ticket.SlaDeadline = _slaCalculator.CalculateDeadline(ticket.CreatedAt, request.Priority);
            ticket.SlaBreached = DateTime.UtcNow > ticket.SlaDeadline;
        }

        if (ticket.Status == TicketStatus.Resolved && !ticket.ResolvedAt.HasValue)
        {
            ticket.ResolvedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Notify newly assigned specialist if assignee changed
        if (!string.IsNullOrWhiteSpace(ticket.AssignedToUserId) && ticket.AssignedToUserId != previousAssignee)
        {
            await TrySendNotificationAsync(ticket.AssignedToUserId,
                "Ticket Reassigned",
                $"Ticket {ticket.TicketNumber} has been reassigned to you: '{ticket.Title}'",
                "TicketAssigned");
        }

        return await GetTicketByIdAsync(ticket.Id);
    }

    public async Task<TicketDto> AssignTicketAsync(Guid id, AssignTicketDto request, string? currentUserId)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null)
            throw new NotFoundException("Ticket not found.");

        var user = await _context.Users.FindAsync(request.AssignedToUserId);
        if (user == null)
            throw new NotFoundException("Specialist user not found.");

        ticket.AssignedToUserId = request.AssignedToUserId;
        if (ticket.Status == TicketStatus.New)
        {
            ticket.Status = TicketStatus.Assigned;
        }
        ticket.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await TrySendNotificationAsync(request.AssignedToUserId,
            "Ticket Assigned",
            $"Ticket {ticket.TicketNumber} has been assigned to you: '{ticket.Title}'",
            "TicketAssigned");

        return await GetTicketByIdAsync(ticket.Id);
    }

    public async Task<TicketDto> ResolveTicketAsync(Guid id, ResolveTicketDto request, string? currentUserId)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null)
            throw new NotFoundException("Ticket not found.");

        var nowUtc = DateTime.UtcNow;
        ticket.Status = TicketStatus.Resolved;
        ticket.ResolvedAt = nowUtc;
        ticket.ResolutionSummary = request.ResolutionSummary.Trim();
        ticket.SlaBreached = nowUtc > ticket.SlaDeadline;
        ticket.UpdatedAt = nowUtc;

        await _context.SaveChangesAsync();

        return await GetTicketByIdAsync(ticket.Id);
    }

    public async Task<TicketDto> EscalateFromFeedbackAsync(Guid feedbackId, EscalateFeedbackRequest request, string? currentUserId)
    {
        var feedback = await _context.Feedbacks
            .Include(f => f.ScheduleItem)
                .ThenInclude(si => si.ContactPerson)
                    .ThenInclude(cp => cp.Project)
            .Include(f => f.ScheduleItem)
                .ThenInclude(si => si.AssignedUser)
            .FirstOrDefaultAsync(f => f.Id == feedbackId);

        if (feedback == null)
            throw new NotFoundException("Proactive feedback record not found.");

        // Check if an active ticket was already created for this feedback
        var existingTicket = await _context.Tickets
            .FirstOrDefaultAsync(t => t.EscalatedFromFeedbackId == feedbackId);
        if (existingTicket != null)
        {
            return await GetTicketByIdAsync(existingTicket.Id);
        }

        var contactPerson = feedback.ScheduleItem?.ContactPerson;
        if (contactPerson == null)
            throw new BadRequestException("Feedback has no linked contact person or customer organization.");

        var orgId = contactPerson.OrganizationId;
        var projId = contactPerson.ProjectId ?? Guid.Empty;

        if (projId == Guid.Empty)
        {
            // Attempt to find any active project for this organization
            var anyProject = await _context.Projects.FirstOrDefaultAsync(p => p.OrganizationId == orgId);
            if (anyProject == null)
                throw new BadRequestException("Customer organization has no active project to associate with the ticket.");
            projId = anyProject.Id;
        }

        // Map priority: FeedbackPriority (Low=0, Medium=1, High=2, Blocker=3) -> TicketPriority
        var ticketPriority = request.OverridePriority ?? (TicketPriority)(int)feedback.Priority;

        // Auto-assign to current touchpoint support specialist if none explicitly provided
        var assignedUserId = !string.IsNullOrWhiteSpace(request.AssignedToUserId)
            ? request.AssignedToUserId
            : feedback.ScheduleItem?.AssignedUserId;

        var description = $"[Escalated from Proactive Feedback Touchpoint]\nRating: {feedback.Rating}/5 stars | Remarks: {feedback.Remarks}";
        if (!string.IsNullOrWhiteSpace(request.AdditionalNotes))
        {
            description += $"\n\nEscalation Notes: {request.AdditionalNotes.Trim()}";
        }

        var title = $"[Escalated] {contactPerson.Project?.Name ?? "Issue"}: {feedback.Remarks.Substring(0, Math.Min(60, feedback.Remarks.Length))}";

        var createDto = new CreateTicketDto
        {
            OrganizationId = orgId,
            ProjectId = projId,
            ProjectModuleId = contactPerson.ProjectModuleId,
            ContactPersonId = contactPerson.Id,
            Title = title,
            Description = description,
            Category = TicketCategory.SoftwareBug,
            FailureType = ticketPriority == TicketPriority.Blocker ? FailureType.CompleteOutage : FailureType.SevereDegradation,
            Priority = ticketPriority,
            Channel = SupportChannel.ProactiveEscalation,
            AssignedToUserId = assignedUserId,
            EscalatedFromFeedbackId = feedback.Id
        };

        var createdTicket = await CreateTicketAsync(createDto, currentUserId);

        // Update proactive feedback with escalation audit record
        feedback.ResolutionNotes = $"[Auto-Escalated to Reactive Ticket {createdTicket.TicketNumber} on {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC]";
        feedback.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return createdTicket;
    }

    public async Task<TicketMessageDto> AddMessageAsync(Guid ticketId, CreateTicketMessageDto request, string currentUserId)
    {
        var ticket = await _context.Tickets.FindAsync(ticketId);
        if (ticket == null)
            throw new NotFoundException("Ticket not found.");

        var sender = await _context.Users.FindAsync(currentUserId);
        if (sender == null)
            throw new NotFoundException("User not found.");

        var message = new TicketMessage
        {
            TicketId = ticketId,
            SenderUserId = currentUserId,
            IsInternalNote = request.IsInternalNote,
            Message = request.Message.Trim(),
            AttachmentUrl = request.AttachmentUrl,
            CreatedAt = DateTime.UtcNow
        };

        _context.TicketMessages.Add(message);
        ticket.UpdatedAt = DateTime.UtcNow;

        // If ticket was New or PendingCustomer, advance to InProgress when staff comments
        if (ticket.Status == TicketStatus.New || ticket.Status == TicketStatus.PendingCustomer)
        {
            ticket.Status = TicketStatus.InProgress;
        }

        await _context.SaveChangesAsync();

        return new TicketMessageDto
        {
            Id = message.Id,
            TicketId = message.TicketId,
            SenderUserId = sender.Id,
            SenderName = sender.FullName,
            SenderRole = sender.Role.ToString(),
            IsInternalNote = message.IsInternalNote,
            Message = message.Message,
            AttachmentUrl = message.AttachmentUrl,
            CreatedAt = message.CreatedAt
        };
    }

    public async Task<List<TicketMessageDto>> GetMessagesAsync(Guid ticketId, bool includeInternalNotes)
    {
        var query = _context.TicketMessages
            .AsNoTracking()
            .Include(m => m.SenderUser)
            .Where(m => m.TicketId == ticketId);

        if (!includeInternalNotes)
        {
            query = query.Where(m => !m.IsInternalNote);
        }

        var messages = await query
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        return messages.Select(m => new TicketMessageDto
        {
            Id = m.Id,
            TicketId = m.TicketId,
            SenderUserId = m.SenderUserId,
            SenderName = m.SenderUser?.FullName ?? "Unknown",
            SenderRole = m.SenderUser?.Role.ToString() ?? "Staff",
            IsInternalNote = m.IsInternalNote,
            Message = m.Message,
            AttachmentUrl = m.AttachmentUrl,
            CreatedAt = m.CreatedAt
        }).ToList();
    }

    public async Task<TicketAnalyticsDto> GetAnalyticsAsync()
    {
        var nowUtc = DateTime.UtcNow;
        var allTickets = await _context.Tickets.AsNoTracking().ToListAsync();

        int total = allTickets.Count;
        int open = allTickets.Count(t => t.Status == TicketStatus.New || t.Status == TicketStatus.Assigned);
        int inProgress = allTickets.Count(t => t.Status == TicketStatus.InProgress || t.Status == TicketStatus.PendingCustomer);
        int resolved = allTickets.Count(t => t.Status == TicketStatus.Resolved || t.Status == TicketStatus.Closed);
        int critical = allTickets.Count(t => t.Priority == TicketPriority.High || t.Priority == TicketPriority.Blocker);

        int breached = allTickets.Count(t => t.SlaBreached || (t.Status != TicketStatus.Resolved && t.Status != TicketStatus.Closed && nowUtc > t.SlaDeadline));

        double slaCompliance = resolved > 0
            ? Math.Round((double)allTickets.Count(t => (t.Status == TicketStatus.Resolved || t.Status == TicketStatus.Closed) && !t.SlaBreached) / resolved * 100.0, 1)
            : 100.0;

        var statusDist = allTickets.GroupBy(t => t.Status.ToString()).ToDictionary(g => g.Key, g => g.Count());
        var priorityDist = allTickets.GroupBy(t => t.Priority.ToString()).ToDictionary(g => g.Key, g => g.Count());
        var categoryDist = allTickets.GroupBy(t => t.Category.ToString()).ToDictionary(g => g.Key, g => g.Count());

        return new TicketAnalyticsDto
        {
            TotalTickets = total,
            OpenTickets = open,
            InProgressTickets = inProgress,
            ResolvedTickets = resolved,
            BreachedTickets = breached,
            CriticalTickets = critical,
            SlaComplianceRate = slaCompliance,
            StatusDistribution = statusDist,
            PriorityDistribution = priorityDist,
            CategoryDistribution = categoryDist
        };
    }

    private TicketDto MapToDto(Ticket ticket, DateTime nowUtc)
    {
        bool isBreached = ticket.SlaBreached || (ticket.Status != TicketStatus.Resolved && ticket.Status != TicketStatus.Closed && nowUtc > ticket.SlaDeadline);
        var remainingTime = _slaCalculator.CalculateRemainingWorkingTime(ticket.SlaDeadline, nowUtc);
        double consumedPercent = _slaCalculator.CalculateSlaConsumedPercent(ticket.CreatedAt, ticket.SlaDeadline, nowUtc);

        return new TicketDto
        {
            Id = ticket.Id,
            TicketNumber = ticket.TicketNumber,
            OrganizationId = ticket.OrganizationId,
            OrganizationName = ticket.Organization?.Name ?? string.Empty,
            ProjectId = ticket.ProjectId,
            ProjectName = ticket.Project?.Name ?? string.Empty,
            ProjectModuleId = ticket.ProjectModuleId,
            ModuleName = ticket.ProjectModule?.Name,
            ContactPersonId = ticket.ContactPersonId,
            ContactPersonName = ticket.ContactPerson?.FullName,
            ContactPersonPhone = ticket.ContactPerson?.Phone,
            ContactPersonEmail = ticket.ContactPerson?.Email,
            Title = ticket.Title,
            Description = ticket.Description,
            Category = ticket.Category,
            FailureType = ticket.FailureType,
            Priority = ticket.Priority,
            Status = ticket.Status,
            Channel = ticket.Channel,
            AssignedToUserId = ticket.AssignedToUserId,
            AssignedToUserName = ticket.AssignedToUser?.FullName,
            AssignedToUserEmail = ticket.AssignedToUser?.Email,
            SlaDeadline = ticket.SlaDeadline,
            SlaBreached = isBreached,
            SlaConsumedPercent = consumedPercent,
            RemainingWorkingHours = Math.Round(remainingTime.TotalHours, 1),
            ResolvedAt = ticket.ResolvedAt,
            ResolutionSummary = ticket.ResolutionSummary,
            IsWarrantyCovered = ticket.IsWarrantyCovered,
            OutOfScopeQuoteETB = ticket.OutOfScopeQuoteETB,
            OutOfScopeQuoteApproved = ticket.OutOfScopeQuoteApproved,
            EscalatedFromFeedbackId = ticket.EscalatedFromFeedbackId,
            CreatedAt = ticket.CreatedAt,
            UpdatedAt = ticket.UpdatedAt
        };
    }

    private async Task TrySendNotificationAsync(string userId, string title, string message, string type)
    {
        try
        {
            await _notificationService.CreateNotificationAsync(userId, title, message, type);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send notification to user {UserId}", userId);
        }
    }
}
