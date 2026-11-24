using Implementation.Datas;
using Implementation.DTO.Commercial;
using Implementation.DTO.Common;
using Implementation.Exceptions;
using Implementation.Interfaces.Commercial;
using Implementation.Interfaces.Notifications;
using Infrustructure.Enums;
using Infrustructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Implementation.Services.Commercial;

public class LeadService : ILeadService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly ILogger<LeadService> _logger;

    public LeadService(
        ApplicationDbContext context,
        INotificationService notificationService,
        ILogger<LeadService> logger)
    {
        _context = context;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<PagedResult<LeadDto>> GetLeadsAsync(LeadFilterRequest filter)
    {
        var query = _context.Leads
            .AsNoTracking()
            .Include(l => l.Campaign)
            .Include(l => l.AssignedSalesUser)
            .AsQueryable();

        if (filter.Stage.HasValue)
            query = query.Where(l => l.Stage == filter.Stage.Value);

        if (filter.Source.HasValue)
            query = query.Where(l => l.Source == filter.Source.Value);

        if (filter.CampaignId.HasValue)
            query = query.Where(l => l.CampaignId == filter.CampaignId.Value);

        if (!string.IsNullOrWhiteSpace(filter.Region))
            query = query.Where(l => l.Region.ToLower() == filter.Region.Trim().ToLower());

        if (!string.IsNullOrWhiteSpace(filter.AssignedSalesUserId))
            query = query.Where(l => l.AssignedSalesUserId == filter.AssignedSalesUserId);

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim().ToLower();
            query = query.Where(l =>
                l.FullName.ToLower().Contains(term) ||
                l.OrganizationName.ToLower().Contains(term) ||
                l.Email.ToLower().Contains(term) ||
                l.PhoneNumber.Contains(term));
        }

        var totalCount = await query.CountAsync();

        // Default ordering: Most recent and highest estimated value first
        query = query.OrderByDescending(l => l.CreatedAt);

        var leads = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PagedResult<LeadDto>(leads.Select(MapToDto).ToList(), totalCount, filter.PageNumber, filter.PageSize);
    }

    public async Task<LeadDto> GetLeadByIdAsync(Guid id)
    {
        var lead = await _context.Leads
            .Include(l => l.Campaign)
            .Include(l => l.AssignedSalesUser)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lead == null)
            throw new NotFoundException("Commercial opportunity/lead not found.");

        return MapToDto(lead);
    }

    public async Task<LeadDto> CreateLeadAsync(CreateLeadDto request, string? currentUserId)
    {
        if (request.CampaignId.HasValue)
        {
            var campaignExists = await _context.Campaigns.AnyAsync(c => c.Id == request.CampaignId.Value);
            if (!campaignExists)
                throw new BadRequestException("Referenced campaign not found.");
        }

        var lead = new Lead
        {
            FullName = request.FullName.Trim(),
            OrganizationName = request.OrganizationName.Trim(),
            Email = request.Email.Trim().ToLower(),
            PhoneNumber = request.PhoneNumber.Trim(),
            Region = string.IsNullOrWhiteSpace(request.Region) ? "Addis Ababa" : request.Region.Trim(),
            Source = request.Source,
            Stage = LeadStage.New,
            CampaignId = request.CampaignId,
            EstimatedValueETB = request.EstimatedValueETB,
            InterestedModules = request.InterestedModules?.Trim(),
            Notes = request.Notes?.Trim(),
            AssignedSalesUserId = request.AssignedSalesUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Leads.Add(lead);
        await _context.SaveChangesAsync();

        return await GetLeadByIdAsync(lead.Id);
    }

    public async Task<LeadDto> UpdateLeadAsync(Guid id, UpdateLeadDto request, string? currentUserId)
    {
        var lead = await _context.Leads.FindAsync(id);
        if (lead == null)
            throw new NotFoundException("Lead not found.");

        lead.FullName = request.FullName.Trim();
        lead.OrganizationName = request.OrganizationName.Trim();
        lead.Email = request.Email.Trim().ToLower();
        lead.PhoneNumber = request.PhoneNumber.Trim();
        lead.Region = request.Region.Trim();
        lead.Source = request.Source;
        lead.Stage = request.Stage;
        lead.CampaignId = request.CampaignId;
        lead.EstimatedValueETB = request.EstimatedValueETB;
        lead.InterestedModules = request.InterestedModules?.Trim();
        lead.Notes = request.Notes?.Trim();
        lead.LostReason = request.LostReason?.Trim();
        lead.AssignedSalesUserId = request.AssignedSalesUserId;
        lead.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetLeadByIdAsync(lead.Id);
    }

    public async Task<LeadDto> SubmitPublicLeadAsync(PublicLeadSubmissionDto request)
    {
        var lead = new Lead
        {
            FullName = request.FullName.Trim(),
            OrganizationName = request.OrganizationName.Trim(),
            Email = request.Email.Trim().ToLower(),
            PhoneNumber = request.PhoneNumber.Trim(),
            Region = string.IsNullOrWhiteSpace(request.Region) ? "Addis Ababa" : request.Region.Trim(),
            Source = LeadSource.Website,
            Stage = LeadStage.New,
            CampaignId = request.CampaignId,
            EstimatedValueETB = 0m,
            InterestedModules = request.InterestedModules?.Trim(),
            Notes = request.Notes?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Leads.Add(lead);
        await _context.SaveChangesAsync();

        // Notify leadership of new inbound commercial inquiry
        try
        {
            await _notificationService.CreateNotificationForRoleAsync(
                UserRole.Director,
                "New Inbound Commercial Lead",
                $"Inquiry received from {lead.FullName} ({lead.OrganizationName}): '{lead.InterestedModules ?? "General Demo"}'",
                "LeadInquiry");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to send notification for new inbound lead");
        }

        return await GetLeadByIdAsync(lead.Id);
    }

    public async Task<ConvertLeadResultDto> ConvertLeadToClientAsync(Guid leadId, ConvertLeadDto request, string? currentUserId)
    {
        var lead = await _context.Leads.FindAsync(leadId);
        if (lead == null)
            throw new NotFoundException("Commercial lead not found.");

        if (lead.ConvertedOrganizationId.HasValue)
        {
            var existingOrg = await _context.Organizations.FindAsync(lead.ConvertedOrganizationId.Value);
            throw new BadRequestException($"Lead was already converted to organization: '{existingOrg?.Name ?? "Client"}' on {lead.ConvertedDate:yyyy-MM-dd}.");
        }

        // 1. Create Organization
        var organization = new Organization
        {
            Name = lead.OrganizationName.Trim(),
            Email = lead.Email.Trim(),
            Phone = lead.PhoneNumber.Trim(),
            Address = lead.Region.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Organizations.Add(organization);

        // 2. Create Primary Contact Person
        var contactPerson = new ContactPerson
        {
            OrganizationId = organization.Id,
            FullName = lead.FullName.Trim(),
            Phone = lead.PhoneNumber.Trim(),
            Email = lead.Email.Trim(),
            JobTitle = "Primary Contact / Decision Maker",
            IsPrimary = true,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.ContactPersons.Add(contactPerson);

        // 3. Create Active Project
        var project = new Project
        {
            OrganizationId = organization.Id,
            Name = $"{lead.OrganizationName} - Enterprise Suite",
            Description = $"Provisioned from commercial acquisition. Interested Scope: {lead.InterestedModules ?? "Full Suite"}",
            Status = ProjectStatus.Active,
            StartDate = DateTime.UtcNow,
            SupportWindowMonths = request.SupportWindowMonths > 0 ? request.SupportWindowMonths : 12,
            ContactPersonName = lead.FullName.Trim(),
            ContactPersonPhone = lead.PhoneNumber.Trim(),
            CreatedAt = DateTime.UtcNow
        };
        _context.Projects.Add(project);

        // Link contact person's primary project
        contactPerson.ProjectId = project.Id;

        // 4. Provision Project Modules from Interested Modules
        int moduleCount = 0;
        if (!string.IsNullOrWhiteSpace(lead.InterestedModules))
        {
            var moduleNames = lead.InterestedModules
                .Split(new[] { ',', ';', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(m => m.Trim())
                .Where(m => !string.IsNullOrWhiteSpace(m))
                .Distinct();

            foreach (var modName in moduleNames)
            {
                var projectModule = new ProjectModule
                {
                    ProjectId = project.Id,
                    Name = modName,
                    Version = "v2.0",
                    Description = "Active deployment module",
                    ContactPersonName = lead.FullName.Trim(),
                    ContactPersonPhone = lead.PhoneNumber.Trim(),
                    CreatedAt = DateTime.UtcNow
                };
                _context.ProjectModules.Add(projectModule);
                moduleCount++;
            }
        }
        else
        {
            // Default core module
            var defaultModule = new ProjectModule
            {
                ProjectId = project.Id,
                Name = "Core DAFTECH Enterprise Suite",
                Version = "v2.0",
                Description = "Core platform configuration",
                ContactPersonName = lead.FullName.Trim(),
                ContactPersonPhone = lead.PhoneNumber.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            _context.ProjectModules.Add(defaultModule);
            moduleCount = 1;
        }

        // 5. Optional Initial Support Specialist Assignment
        if (!string.IsNullOrWhiteSpace(request.PrimarySupportSpecialistUserId))
        {
            var specialist = await _context.Users.FindAsync(request.PrimarySupportSpecialistUserId);
            if (specialist != null)
            {
                var assignment = new SupportAssignment
                {
                    UserId = specialist.Id,
                    ProjectId = project.Id,
                    DailyTouchpointTarget = 1,
                    CreatedAt = DateTime.UtcNow
                };
                _context.SupportAssignments.Add(assignment);
            }
        }

        // 6. Audit Lead as Won & Converted
        lead.Stage = LeadStage.Won;
        lead.ConvertedOrganizationId = organization.Id;
        lead.ConvertedDate = DateTime.UtcNow;
        lead.UpdatedAt = DateTime.UtcNow;

        // Single atomic commit for entire customer onboarding hierarchy
        await _context.SaveChangesAsync();

        return new ConvertLeadResultDto
        {
            OrganizationId = organization.Id,
            OrganizationName = organization.Name,
            ProjectId = project.Id,
            ProjectName = project.Name,
            ContactPersonId = contactPerson.Id,
            ContactPersonName = contactPerson.FullName,
            ModulesProvisionedCount = moduleCount,
            Message = $"Opportunity successfully converted to Active Client Account '{organization.Name}' with 12-Month Support Window."
        };
    }

    public async Task<LeadPipelineSummaryDto> GetPipelineSummaryAsync()
    {
        var allLeads = await _context.Leads.AsNoTracking().ToListAsync();

        int total = allLeads.Count;
        decimal totalPipelineVal = allLeads.Where(l => l.Stage != LeadStage.Lost).Sum(l => l.EstimatedValueETB);
        decimal wonVal = allLeads.Where(l => l.Stage == LeadStage.Won).Sum(l => l.EstimatedValueETB);

        int closedDeals = allLeads.Count(l => l.Stage == LeadStage.Won || l.Stage == LeadStage.Lost);
        int wonDeals = allLeads.Count(l => l.Stage == LeadStage.Won);

        double winRate = closedDeals > 0 ? Math.Round((double)wonDeals / closedDeals * 100.0, 1) : 0.0;

        var stageCounts = allLeads.GroupBy(l => l.Stage.ToString()).ToDictionary(g => g.Key, g => g.Count());
        var stageValues = allLeads.GroupBy(l => l.Stage.ToString()).ToDictionary(g => g.Key, g => g.Sum(x => x.EstimatedValueETB));
        var sourceDist = allLeads.GroupBy(l => l.Source.ToString()).ToDictionary(g => g.Key, g => g.Count());

        return new LeadPipelineSummaryDto
        {
            TotalLeads = total,
            TotalPipelineValueETB = totalPipelineVal,
            WonRevenueETB = wonVal,
            WinRatePercentage = winRate,
            StageCounts = stageCounts,
            StageValuesETB = stageValues,
            SourceDistribution = sourceDist
        };
    }

    private static LeadDto MapToDto(Lead l)
    {
        return new LeadDto
        {
            Id = l.Id,
            FullName = l.FullName,
            OrganizationName = l.OrganizationName,
            Email = l.Email,
            PhoneNumber = l.PhoneNumber,
            Region = l.Region,
            Source = l.Source,
            Stage = l.Stage,
            CampaignId = l.CampaignId,
            CampaignTitle = l.Campaign?.Title,
            EstimatedValueETB = l.EstimatedValueETB,
            InterestedModules = l.InterestedModules,
            Notes = l.Notes,
            LostReason = l.LostReason,
            AssignedSalesUserId = l.AssignedSalesUserId,
            AssignedSalesUserName = l.AssignedSalesUser?.FullName,
            ConvertedOrganizationId = l.ConvertedOrganizationId,
            ConvertedDate = l.ConvertedDate,
            CreatedAt = l.CreatedAt
        };
    }
}
