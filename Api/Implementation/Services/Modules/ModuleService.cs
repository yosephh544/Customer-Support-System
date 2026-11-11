using Implementation.Datas;
using Implementation.DTO.Common;
using Implementation.DTO.Modules;
using Implementation.Exceptions;
using Implementation.Interfaces.Modules;
using Infrustructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Implementation.Services.Modules;

public class ModuleService : IModuleService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<ModuleService> _logger;

    public ModuleService(ApplicationDbContext dbContext, ILogger<ModuleService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    #region Master Modules Catalog

    public async Task<PagedResult<MasterModuleDto>> GetMasterModulesAsync(MasterModuleFilterRequest filter)
    {
        var query = _dbContext.MasterModules.AsNoTracking();

        // Search Term Filter
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(m => m.Name.ToLower().Contains(search) ||
                                     m.Code.ToLower().Contains(search) ||
                                     (m.Description != null && m.Description.ToLower().Contains(search)));
        }

        // Active Status Filter
        if (filter.IsActive.HasValue)
        {
            query = query.Where(m => m.IsActive == filter.IsActive.Value);
        }

        // Sorting
        query = filter.SortBy?.ToLower() switch
        {
            "name" => filter.IsDescending ? query.OrderByDescending(m => m.Name) : query.OrderBy(m => m.Name),
            "code" => filter.IsDescending ? query.OrderByDescending(m => m.Code) : query.OrderBy(m => m.Code),
            "createdat" => filter.IsDescending ? query.OrderByDescending(m => m.CreatedAt) : query.OrderBy(m => m.CreatedAt),
            _ => query.OrderByDescending(m => m.CreatedAt)
        };

        var safePageNumber = filter.PageNumber < 1 ? 1 : filter.PageNumber;
        var safePageSize = filter.PageSize < 1 ? 10 : (filter.PageSize > 100 ? 100 : filter.PageSize);

        var totalCount = await query.CountAsync();
        var pagedItems = await query
            .Skip((safePageNumber - 1) * safePageSize)
            .Take(safePageSize)
            .Select(m => new MasterModuleDto
            {
                Id = m.Id,
                Name = m.Name,
                Code = m.Code,
                Description = m.Description,
                IsActive = m.IsActive,
                LinkedProjectsCount = m.ProjectModules.Count,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<MasterModuleDto>
        {
            Items = pagedItems,
            TotalCount = totalCount,
            PageNumber = safePageNumber,
            PageSize = safePageSize
        };
    }

    public async Task<MasterModuleDto> GetMasterModuleByIdAsync(Guid id)
    {
        var module = await _dbContext.MasterModules
            .AsNoTracking()
            .Select(m => new MasterModuleDto
            {
                Id = m.Id,
                Name = m.Name,
                Code = m.Code,
                Description = m.Description,
                IsActive = m.IsActive,
                LinkedProjectsCount = m.ProjectModules.Count,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt
            })
            .FirstOrDefaultAsync(m => m.Id == id);

        if (module == null)
        {
            throw new NotFoundException("MasterModule", id);
        }

        return module;
    }

    public async Task<MasterModuleDto> CreateMasterModuleAsync(CreateMasterModuleDto dto)
    {
        var code = dto.Code.Trim().ToUpperInvariant();
        var codeExists = await _dbContext.MasterModules
            .AnyAsync(m => m.Code.ToUpper() == code);

        if (codeExists)
        {
            throw new BadRequestException($"Master module code '{dto.Code}' is already in use.");
        }

        var masterModule = new MasterModule
        {
            Id = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            Code = code,
            Description = dto.Description?.Trim(),
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.MasterModules.Add(masterModule);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Created MasterModule {Name} ({Code}) with ID {Id}", masterModule.Name, masterModule.Code, masterModule.Id);

        return await GetMasterModuleByIdAsync(masterModule.Id);
    }

    public async Task<MasterModuleDto> UpdateMasterModuleAsync(Guid id, UpdateMasterModuleDto dto)
    {
        var module = await _dbContext.MasterModules.FirstOrDefaultAsync(m => m.Id == id);
        if (module == null)
        {
            throw new NotFoundException("MasterModule", id);
        }

        var code = dto.Code.Trim().ToUpperInvariant();
        var codeInUse = await _dbContext.MasterModules
            .AnyAsync(m => m.Id != id && m.Code.ToUpper() == code);

        if (codeInUse)
        {
            throw new BadRequestException($"Master module code '{dto.Code}' is already in use by another module.");
        }

        module.Name = dto.Name.Trim();
        module.Code = code;
        module.Description = dto.Description?.Trim();
        module.IsActive = dto.IsActive;
        module.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Updated MasterModule {Name} with ID {Id}", module.Name, module.Id);

        return await GetMasterModuleByIdAsync(module.Id);
    }

    public async Task DeleteMasterModuleAsync(Guid id)
    {
        var module = await _dbContext.MasterModules
            .Include(m => m.ProjectModules)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (module == null)
        {
            throw new NotFoundException("MasterModule", id);
        }

        if (module.ProjectModules.Any())
        {
            throw new BadRequestException("Cannot delete master module because it is assigned to one or more projects.");
        }

        _dbContext.MasterModules.Remove(module);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Deleted MasterModule {Name} with ID {Id}", module.Name, module.Id);
    }

    #endregion

    #region Project Module Assignments

    public async Task<List<ProjectModuleDto>> GetModulesByProjectIdAsync(Guid projectId)
    {
        var projectExists = await _dbContext.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists)
        {
            throw new NotFoundException("Project", projectId);
        }

        return await _dbContext.ProjectModules
            .AsNoTracking()
            .Where(pm => pm.ProjectId == projectId)
            .Include(pm => pm.Project)
            .Include(pm => pm.MasterModule)
            .Select(pm => new ProjectModuleDto
            {
                Id = pm.Id,
                ProjectId = pm.ProjectId,
                ProjectName = pm.Project.Name,
                MasterModuleId = pm.MasterModuleId,
                ModuleName = pm.MasterModule.Name,
                ModuleCode = pm.MasterModule.Code,
                IsEnabled = pm.IsEnabled,
                Version = pm.Version,
                CustomNotes = pm.CustomNotes,
                CreatedAt = pm.CreatedAt,
                UpdatedAt = pm.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<ProjectModuleDto> GetProjectModuleByIdAsync(Guid projectId, Guid moduleId)
    {
        var pm = await _dbContext.ProjectModules
            .AsNoTracking()
            .Include(p => p.Project)
            .Include(p => p.MasterModule)
            .FirstOrDefaultAsync(p => p.ProjectId == projectId && p.Id == moduleId);

        if (pm == null)
        {
            throw new NotFoundException($"Project module with ID '{moduleId}' was not found for project '{projectId}'.");
        }

        return new ProjectModuleDto
        {
            Id = pm.Id,
            ProjectId = pm.ProjectId,
            ProjectName = pm.Project.Name,
            MasterModuleId = pm.MasterModuleId,
            ModuleName = pm.MasterModule.Name,
            ModuleCode = pm.MasterModule.Code,
            IsEnabled = pm.IsEnabled,
            Version = pm.Version,
            CustomNotes = pm.CustomNotes,
            CreatedAt = pm.CreatedAt,
            UpdatedAt = pm.UpdatedAt
        };
    }

    public async Task<ProjectModuleDto> AssignModuleToProjectAsync(Guid projectId, AssignProjectModuleDto dto)
    {
        var project = await _dbContext.Projects.FirstOrDefaultAsync(p => p.Id == projectId);
        if (project == null)
        {
            throw new NotFoundException("Project", projectId);
        }

        var masterModule = await _dbContext.MasterModules.FirstOrDefaultAsync(m => m.Id == dto.MasterModuleId);
        if (masterModule == null)
        {
            throw new NotFoundException("MasterModule", dto.MasterModuleId);
        }

        var alreadyAssigned = await _dbContext.ProjectModules
            .AnyAsync(pm => pm.ProjectId == projectId && pm.MasterModuleId == dto.MasterModuleId);

        if (alreadyAssigned)
        {
            throw new BadRequestException($"The module '{masterModule.Name}' is already assigned to this project.");
        }

        var projectModule = new ProjectModule
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            MasterModuleId = dto.MasterModuleId,
            IsEnabled = dto.IsEnabled,
            Version = dto.Version?.Trim(),
            CustomNotes = dto.CustomNotes?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.ProjectModules.Add(projectModule);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Assigned module {ModuleName} to project {ProjectName}", masterModule.Name, project.Name);

        return await GetProjectModuleByIdAsync(projectId, projectModule.Id);
    }

    public async Task<ProjectModuleDto> UpdateProjectModuleAsync(Guid projectId, Guid moduleId, UpdateProjectModuleDto dto)
    {
        var pm = await _dbContext.ProjectModules
            .Include(p => p.Project)
            .Include(p => p.MasterModule)
            .FirstOrDefaultAsync(p => p.ProjectId == projectId && p.Id == moduleId);

        if (pm == null)
        {
            throw new NotFoundException($"Project module with ID '{moduleId}' was not found for project '{projectId}'.");
        }

        pm.IsEnabled = dto.IsEnabled;
        pm.Version = dto.Version?.Trim();
        pm.CustomNotes = dto.CustomNotes?.Trim();
        pm.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Updated project module {ModuleId} for project {ProjectId}", moduleId, projectId);

        return new ProjectModuleDto
        {
            Id = pm.Id,
            ProjectId = pm.ProjectId,
            ProjectName = pm.Project.Name,
            MasterModuleId = pm.MasterModuleId,
            ModuleName = pm.MasterModule.Name,
            ModuleCode = pm.MasterModule.Code,
            IsEnabled = pm.IsEnabled,
            Version = pm.Version,
            CustomNotes = pm.CustomNotes,
            CreatedAt = pm.CreatedAt,
            UpdatedAt = pm.UpdatedAt
        };
    }

    public async Task RemoveModuleFromProjectAsync(Guid projectId, Guid moduleId)
    {
        var pm = await _dbContext.ProjectModules
            .FirstOrDefaultAsync(p => p.ProjectId == projectId && p.Id == moduleId);

        if (pm == null)
        {
            throw new NotFoundException($"Project module with ID '{moduleId}' was not found for project '{projectId}'.");
        }

        _dbContext.ProjectModules.Remove(pm);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Removed module {ModuleId} from project {ProjectId}", moduleId, projectId);
    }

    #endregion
}

