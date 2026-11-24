using Implementation.Datas;
using Implementation.DTO.Commercial;
using Implementation.Exceptions;
using Implementation.Interfaces.Commercial;
using Infrustructure.Enums;
using Infrustructure.Models;
using Microsoft.EntityFrameworkCore;

namespace Implementation.Services.Commercial;

public class CampaignService : ICampaignService
{
    private readonly ApplicationDbContext _context;

    public CampaignService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CampaignDto>> GetCampaignsAsync()
    {
        var campaigns = await _context.Campaigns
            .AsNoTracking()
            .Include(c => c.Leads)
            .OrderByDescending(c => c.StartDate)
            .ToListAsync();

        return campaigns.Select(MapToDto).ToList();
    }

    public async Task<CampaignDto> GetCampaignByIdAsync(Guid id)
    {
        var campaign = await _context.Campaigns
            .Include(c => c.Leads)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (campaign == null)
            throw new NotFoundException("Marketing campaign not found.");

        return MapToDto(campaign);
    }

    public async Task<CampaignDto> CreateCampaignAsync(CreateCampaignDto request)
    {
        if (request.EndDate < request.StartDate)
            throw new BadRequestException("Campaign end date cannot be earlier than start date.");

        var campaign = new Campaign
        {
            Title = request.Title.Trim(),
            Type = request.Type,
            BudgetETB = request.BudgetETB,
            ActualSpendETB = 0m,
            TargetRegion = request.TargetRegion.Trim(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Status = CampaignStatus.Planning,
            Description = request.Description?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Campaigns.Add(campaign);
        await _context.SaveChangesAsync();

        return MapToDto(campaign);
    }

    public async Task<CampaignDto> UpdateCampaignAsync(Guid id, UpdateCampaignDto request)
    {
        var campaign = await _context.Campaigns.FindAsync(id);
        if (campaign == null)
            throw new NotFoundException("Campaign not found.");

        if (request.EndDate < request.StartDate)
            throw new BadRequestException("Campaign end date cannot be earlier than start date.");

        campaign.Title = request.Title.Trim();
        campaign.Type = request.Type;
        campaign.BudgetETB = request.BudgetETB;
        campaign.ActualSpendETB = request.ActualSpendETB;
        campaign.TargetRegion = request.TargetRegion.Trim();
        campaign.StartDate = request.StartDate;
        campaign.EndDate = request.EndDate;
        campaign.Status = request.Status;
        campaign.Description = request.Description?.Trim();
        campaign.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetCampaignByIdAsync(campaign.Id);
    }

    public async Task<bool> DeleteCampaignAsync(Guid id)
    {
        var campaign = await _context.Campaigns.FindAsync(id);
        if (campaign == null)
            throw new NotFoundException("Campaign not found.");

        _context.Campaigns.Remove(campaign);
        await _context.SaveChangesAsync();
        return true;
    }

    private static CampaignDto MapToDto(Campaign c)
    {
        int totalLeads = c.Leads?.Count ?? 0;
        int wonLeads = c.Leads?.Count(l => l.Stage == LeadStage.Won) ?? 0;
        decimal wonRevenue = c.Leads?.Where(l => l.Stage == LeadStage.Won).Sum(l => l.EstimatedValueETB) ?? 0m;

        double roi = 0.0;
        if (c.ActualSpendETB > 0)
        {
            roi = Math.Round((double)((wonRevenue - c.ActualSpendETB) / c.ActualSpendETB) * 100.0, 1);
        }

        return new CampaignDto
        {
            Id = c.Id,
            Title = c.Title,
            Type = c.Type,
            BudgetETB = c.BudgetETB,
            ActualSpendETB = c.ActualSpendETB,
            TargetRegion = c.TargetRegion,
            StartDate = c.StartDate,
            EndDate = c.EndDate,
            Status = c.Status,
            Description = c.Description,
            LeadCount = totalLeads,
            WonLeadCount = wonLeads,
            WonRevenueETB = wonRevenue,
            RoiPercentage = roi,
            CreatedAt = c.CreatedAt
        };
    }
}
