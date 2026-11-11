using Implementation.Datas;
using Implementation.DTO.Common;
using Implementation.DTO.Modules;
using Implementation.DTO.Projects;
using Implementation.Exceptions;
using Implementation.Interfaces.Projects;
using Infrustructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Implementation.Services.Projects;

public class ProjectService : IProjectService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<ProjectService> _logger;

    public ProjectService(ApplicationDbContext dbContext, ILogger<ProjectService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<PagedResult<ProjectSummaryDto>> GetProjectsAsync(ProjectFilterRequest filter)
    {
        var query = _dbContext.Projects
            .AsNoTracking()
            .Include(p => p.Organization)
            .Include(p => p.ProjectModules)
            .AsQueryable();

        // Search Term Filter
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(search) ||
                                     p.Code.ToLower().Contains(search) ||
                                     p.Organization.Name.ToLower().Contains(search));
        }

        // Organization Filter
        if (filter.OrganizationId.HasValue)
        {
            query = query.Where(p => p.OrganizationId == filter.OrganizationId.Value);
        }

        // Status Filter
        if (filter.Status.HasValue)
        {
            query = query.Where(p => p.Status == filter.Status.Value);
        }

        // Sorting
        query = filter.SortBy?.ToLower() switch
        {
            "name" => filter.IsDescending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
            "code" => filter.IsDescending ? query.OrderByDescending(p => p.Code) : query.OrderBy(p => p.Code),
            "status" => filter.IsDescending ? query.OrderByDescending(p => p.Status) : query.OrderBy(p => p.Status),
            "createdat" => filter.IsDescending ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
            _ => query.OrderByDescending(p => p.CreatedAt)
        };

        var safePageNumber = filter.PageNumber < 1 ? 1 : filter.PageNumber;
        var safePageSize = filter.PageSize < 1 ? 10 : (filter.PageSize > 100 ? 100 : filter.PageSize);

        var totalCount = await query.CountAsync();
        var pagedItems = await query
            .Skip((safePageNumber - 1) * safePageSize)
            .Take(safePageSize)
            .Select(p => new ProjectSummaryDto
            {
                Id = p.Id,
                OrganizationId = p.OrganizationId,
                OrganizationName = p.Organization.Name,
                Name = p.Name,
                Code = p.Code,
                Description = p.Description,
                Status = p.Status,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                ModuleCount = p.ProjectModules.Count,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<ProjectSummaryDto>
        {
            Items = pagedItems,
            TotalCount = totalCount,
            PageNumber = safePageNumber,
            PageSize = safePageSize
        };
    }

    public async Task<ProjectDetailsDto> GetProjectByIdAsync(Guid id)
    {
        var project = await _dbContext.Projects
            .AsNoTracking()
            .Include(p => p.Organization)
            .Include(p => p.ProjectModules)
                .ThenInclude(pm => pm.MasterModule)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
        {
            throw new NotFoundException("Project", id);
        }

        return new ProjectDetailsDto
        {
            Id = project.Id,
            OrganizationId = project.OrganizationId,
            OrganizationName = project.Organization.Name,
            Name = project.Name,
            Code = project.Code,
            Description = project.Description,
            Status = project.Status,
            StartDate = project.StartDate,
            EndDate = project.EndDate,
            ModuleCount = project.ProjectModules.Count,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            Modules = project.ProjectModules.Select(pm => new ProjectModuleDto
            {
                Id = pm.Id,
                ProjectId = pm.ProjectId,
                ProjectName = project.Name,
                MasterModuleId = pm.MasterModuleId,
                ModuleName = pm.MasterModule.Name,
                ModuleCode = pm.MasterModule.Code,
                IsEnabled = pm.IsEnabled,
                Version = pm.Version,
                CustomNotes = pm.CustomNotes,
                CreatedAt = pm.CreatedAt,
                UpdatedAt = pm.UpdatedAt
            }).ToList()
        };
    }

    public async Task<List<ProjectSummaryDto>> GetProjectsByOrganizationIdAsync(Guid organizationId)
    {
        var orgExists = await _dbContext.Organizations.AnyAsync(o => o.Id == organizationId);
        if (!orgExists)
        {
            throw new NotFoundException("Organization", organizationId);
        }

        return await _dbContext.Projects
            .AsNoTracking()
            .Where(p => p.OrganizationId == organizationId)
            .Include(p => p.Organization)
            .Include(p => p.ProjectModules)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProjectSummaryDto
            {
                Id = p.Id,
                OrganizationId = p.OrganizationId,
                OrganizationName = p.Organization.Name,
                Name = p.Name,
                Code = p.Code,
                Description = p.Description,
                Status = p.Status,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                ModuleCount = p.ProjectModules.Count,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<ProjectDetailsDto> CreateProjectAsync(CreateProjectDto dto)
    {
        var org = await _dbContext.Organizations.FirstOrDefaultAsync(o => o.Id == dto.OrganizationId);
        if (org == null)
        {
            throw new NotFoundException("Organization", dto.OrganizationId);
        }

        var code = dto.Code.Trim();
        if (!string.IsNullOrEmpty(code))
        {
            var codeExists = await _dbContext.Projects
                .AnyAsync(p => p.OrganizationId == dto.OrganizationId && p.Code.ToLower() == code.ToLower());

            if (codeExists)
            {
                throw new BadRequestException($"Project code '{dto.Code}' already exists within organization '{org.Name}'.");
            }
        }

        var project = new Project
        {
            Id = Guid.NewGuid(),
            OrganizationId = dto.OrganizationId,
            Name = dto.Name.Trim(),
            Code = code,
            Description = dto.Description?.Trim(),
            Status = dto.Status,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Projects.Add(project);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Created Project {Name} under Organization {OrgName} with ID {Id}", project.Name, org.Name, project.Id);

        return await GetProjectByIdAsync(project.Id);
    }

    public async Task<ProjectDetailsDto> UpdateProjectAsync(Guid id, UpdateProjectDto dto)
    {
        var project = await _dbContext.Projects
            .Include(p => p.Organization)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
        {
            throw new NotFoundException("Project", id);
        }

        var code = dto.Code.Trim();
        if (!string.IsNullOrEmpty(code))
        {
            var codeExists = await _dbContext.Projects
                .AnyAsync(p => p.Id != id && p.OrganizationId == project.OrganizationId && p.Code.ToLower() == code.ToLower());

            if (codeExists)
            {
                throw new BadRequestException($"Project code '{dto.Code}' is already in use by another project in this organization.");
            }
        }

        project.Name = dto.Name.Trim();
        project.Code = code;
        project.Description = dto.Description?.Trim();
        project.Status = dto.Status;
        project.StartDate = dto.StartDate;
        project.EndDate = dto.EndDate;
        project.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Updated Project {Name} with ID {Id}", project.Name, project.Id);

        return await GetProjectByIdAsync(project.Id);
    }

    public async Task DeleteProjectAsync(Guid id)
    {
        var project = await _dbContext.Projects
            .Include(p => p.ProjectModules)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
        {
            throw new NotFoundException("Project", id);
        }

        _dbContext.Projects.Remove(project);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Deleted Project {Name} with ID {Id}", project.Name, project.Id);
    }
}

