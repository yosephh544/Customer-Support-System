using Implementation.Datas;
using Implementation.DTO.Common;
using Implementation.DTO.Organizations;
using Implementation.DTO.Projects;
using Implementation.Exceptions;
using Implementation.Interfaces.Organizations;
using Infrustructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Implementation.Services.Organizations;

public class OrganizationService : IOrganizationService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<OrganizationService> _logger;

    public OrganizationService(ApplicationDbContext dbContext, ILogger<OrganizationService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<PagedResult<OrganizationSummaryDto>> GetOrganizationsAsync(OrganizationFilterRequest filter)
    {
        var query = _dbContext.Organizations.AsNoTracking();

        // Search Term Filter
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(o => o.Name.ToLower().Contains(search) ||
                                     (o.Email != null && o.Email.ToLower().Contains(search)) ||
                                     (o.Phone != null && o.Phone.Contains(search)));
        }

        // Active Status Filter
        if (filter.IsActive.HasValue)
        {
            query = query.Where(o => o.IsActive == filter.IsActive.Value);
        }

        // Sorting
        query = filter.SortBy?.ToLower() switch
        {
            "name" => filter.IsDescending ? query.OrderByDescending(o => o.Name) : query.OrderBy(o => o.Name),
            "createdat" => filter.IsDescending ? query.OrderByDescending(o => o.CreatedAt) : query.OrderBy(o => o.CreatedAt),
            _ => query.OrderByDescending(o => o.CreatedAt)
        };

        var safePageNumber = filter.PageNumber < 1 ? 1 : filter.PageNumber;
        var safePageSize = filter.PageSize < 1 ? 10 : (filter.PageSize > 100 ? 100 : filter.PageSize);

        var totalCount = await query.CountAsync();
        var pagedItems = await query
            .Skip((safePageNumber - 1) * safePageSize)
            .Take(safePageSize)
            .Select(o => new OrganizationSummaryDto
            {
                Id = o.Id,
                Name = o.Name,
                IsActive = o.IsActive,
                Email = o.Email,
                Phone = o.Phone,
                Address = o.Address,
                ProjectCount = o.Projects.Count,
                CreatedAt = o.CreatedAt,
                UpdatedAt = o.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<OrganizationSummaryDto>
        {
            Items = pagedItems,
            TotalCount = totalCount,
            PageNumber = safePageNumber,
            PageSize = safePageSize
        };
    }

    public async Task<OrganizationDetailsDto> GetOrganizationByIdAsync(Guid id)
    {
        var org = await _dbContext.Organizations
            .AsNoTracking()
            .Include(o => o.Projects)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (org == null)
        {
            throw new NotFoundException("Organization", id);
        }

        return new OrganizationDetailsDto
        {
            Id = org.Id,
            Name = org.Name,
            IsActive = org.IsActive,
            Email = org.Email,
            Phone = org.Phone,
            Address = org.Address,
            ProjectCount = org.Projects.Count,
            CreatedAt = org.CreatedAt,
            UpdatedAt = org.UpdatedAt,
            Projects = org.Projects.Select(p => new ProjectSummaryDto
            {
                Id = p.Id,
                OrganizationId = p.OrganizationId,
                OrganizationName = org.Name,
                Name = p.Name,
                Description = p.Description,
                Status = p.Status,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                ModuleCount = p.ProjectModules.Count,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            }).ToList()
        };
    }

    public async Task<OrganizationDetailsDto> CreateOrganizationAsync(CreateOrganizationDto dto)
    {
        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            IsActive = dto.IsActive,
            Email = dto.Email?.Trim(),
            Phone = dto.Phone?.Trim(),
            Address = dto.Address?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Organizations.Add(organization);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Created Organization {OrgName} with ID {OrgId}", organization.Name, organization.Id);

        return await GetOrganizationByIdAsync(organization.Id);
    }

    public async Task<OrganizationDetailsDto> UpdateOrganizationAsync(Guid id, UpdateOrganizationDto dto)
    {
        var organization = await _dbContext.Organizations.FirstOrDefaultAsync(o => o.Id == id);
        if (organization == null)
        {
            throw new NotFoundException("Organization", id);
        }

        organization.Name = dto.Name.Trim();
        organization.IsActive = dto.IsActive;
        organization.Email = dto.Email?.Trim();
        organization.Phone = dto.Phone?.Trim();
        organization.Address = dto.Address?.Trim();
        organization.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Updated Organization {OrgName} with ID {OrgId}", organization.Name, organization.Id);

        return await GetOrganizationByIdAsync(organization.Id);
    }

    public async Task DeleteOrganizationAsync(Guid id)
    {
        var organization = await _dbContext.Organizations
            .Include(o => o.Projects)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (organization == null)
        {
            throw new NotFoundException("Organization", id);
        }

        if (organization.Projects.Any())
        {
            throw new BadRequestException("Cannot delete organization because it has associated projects. Please delete or reassign all projects first.");
        }

        _dbContext.Organizations.Remove(organization);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Deleted Organization {OrgName} with ID {OrgId}", organization.Name, organization.Id);
    }
}

