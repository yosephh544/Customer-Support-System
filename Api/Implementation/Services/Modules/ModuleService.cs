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

    #region Project Modules

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
            .OrderBy(pm => pm.Name)
            .Select(pm => new ProjectModuleDto
            {
                Id = pm.Id,
                ProjectId = pm.ProjectId,
                ProjectName = pm.Project.Name,
                Name = pm.Name,
                Description = pm.Description,
                IsEnabled = pm.IsEnabled,
                Version = pm.Version,
                ContactPersonName = pm.ContactPersonName,
                ContactPersonPhone = pm.ContactPersonPhone,
                SecondaryContactPersonName = pm.SecondaryContactPersonName,
                SecondaryContactPersonPhone = pm.SecondaryContactPersonPhone,
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
            Name = pm.Name,
            Description = pm.Description,
            IsEnabled = pm.IsEnabled,
            Version = pm.Version,
            ContactPersonName = pm.ContactPersonName,
            ContactPersonPhone = pm.ContactPersonPhone,
            SecondaryContactPersonName = pm.SecondaryContactPersonName,
            SecondaryContactPersonPhone = pm.SecondaryContactPersonPhone,
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

        var moduleName = dto.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(moduleName))
        {
            throw new BadRequestException("Module name is required.");
        }

        var alreadyExists = await _dbContext.ProjectModules
            .AnyAsync(pm => pm.ProjectId == projectId && pm.Name.ToLower() == moduleName.ToLower());

        if (alreadyExists)
        {
            throw new BadRequestException($"A module with name '{moduleName}' already exists in this project.");
        }

        var projectModule = new ProjectModule
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Name = moduleName,
            Version = string.IsNullOrWhiteSpace(dto.Version) ? "v1.0" : dto.Version.Trim(),
            Description = dto.Description?.Trim(),
            IsEnabled = dto.IsEnabled,
            ContactPersonName = dto.ContactPersonName?.Trim(),
            ContactPersonPhone = dto.ContactPersonPhone?.Trim(),
            SecondaryContactPersonName = dto.SecondaryContactPersonName?.Trim(),
            SecondaryContactPersonPhone = dto.SecondaryContactPersonPhone?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.ProjectModules.Add(projectModule);

        // Sync module primary contact
        if (!string.IsNullOrWhiteSpace(dto.ContactPersonName) && !string.IsNullOrWhiteSpace(dto.ContactPersonPhone))
        {
            _dbContext.ContactPersons.Add(new ContactPerson
            {
                Id = Guid.NewGuid(),
                OrganizationId = project.OrganizationId,
                ProjectId = project.Id,
                ProjectModuleId = projectModule.Id,
                FullName = dto.ContactPersonName.Trim(),
                Phone = dto.ContactPersonPhone.Trim(),
                IsPrimary = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        // Sync module secondary contact
        if (!string.IsNullOrWhiteSpace(dto.SecondaryContactPersonName) && !string.IsNullOrWhiteSpace(dto.SecondaryContactPersonPhone))
        {
            _dbContext.ContactPersons.Add(new ContactPerson
            {
                Id = Guid.NewGuid(),
                OrganizationId = project.OrganizationId,
                ProjectId = project.Id,
                ProjectModuleId = projectModule.Id,
                FullName = dto.SecondaryContactPersonName.Trim(),
                Phone = dto.SecondaryContactPersonPhone.Trim(),
                IsPrimary = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Created module {ModuleName} for project {ProjectName}", projectModule.Name, project.Name);

        return await GetProjectModuleByIdAsync(projectId, projectModule.Id);
    }

    public async Task<ProjectModuleDto> UpdateProjectModuleAsync(Guid projectId, Guid moduleId, UpdateProjectModuleDto dto)
    {
        var pm = await _dbContext.ProjectModules
            .Include(p => p.Project)
            .FirstOrDefaultAsync(p => p.ProjectId == projectId && p.Id == moduleId);

        if (pm == null)
        {
            throw new NotFoundException($"Project module with ID '{moduleId}' was not found for project '{projectId}'.");
        }

        var moduleName = dto.Name?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(moduleName))
        {
            throw new BadRequestException("Module name is required.");
        }

        var duplicateExists = await _dbContext.ProjectModules
            .AnyAsync(m => m.ProjectId == projectId && m.Id != moduleId && m.Name.ToLower() == moduleName.ToLower());

        if (duplicateExists)
        {
            throw new BadRequestException($"Another module with name '{moduleName}' already exists in this project.");
        }

        pm.Name = moduleName;
        pm.Version = string.IsNullOrWhiteSpace(dto.Version) ? "v1.0" : dto.Version.Trim();
        pm.Description = dto.Description?.Trim();
        pm.IsEnabled = dto.IsEnabled;
        pm.ContactPersonName = dto.ContactPersonName?.Trim();
        pm.ContactPersonPhone = dto.ContactPersonPhone?.Trim();
        pm.SecondaryContactPersonName = dto.SecondaryContactPersonName?.Trim();
        pm.SecondaryContactPersonPhone = dto.SecondaryContactPersonPhone?.Trim();
        pm.UpdatedAt = DateTime.UtcNow;

        // Sync primary contact
        var primaryContact = await _dbContext.ContactPersons
            .FirstOrDefaultAsync(cp => cp.ProjectModuleId == pm.Id && cp.IsPrimary);

        if (!string.IsNullOrWhiteSpace(dto.ContactPersonName) && !string.IsNullOrWhiteSpace(dto.ContactPersonPhone))
        {
            if (primaryContact != null)
            {
                primaryContact.FullName = dto.ContactPersonName.Trim();
                primaryContact.Phone = dto.ContactPersonPhone.Trim();
                primaryContact.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _dbContext.ContactPersons.Add(new ContactPerson
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = pm.Project.OrganizationId,
                    ProjectId = pm.ProjectId,
                    ProjectModuleId = pm.Id,
                    FullName = dto.ContactPersonName.Trim(),
                    Phone = dto.ContactPersonPhone.Trim(),
                    IsPrimary = true,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        // Sync secondary contact
        var secondaryContact = await _dbContext.ContactPersons
            .FirstOrDefaultAsync(cp => cp.ProjectModuleId == pm.Id && !cp.IsPrimary);

        if (!string.IsNullOrWhiteSpace(dto.SecondaryContactPersonName) && !string.IsNullOrWhiteSpace(dto.SecondaryContactPersonPhone))
        {
            if (secondaryContact != null)
            {
                secondaryContact.FullName = dto.SecondaryContactPersonName.Trim();
                secondaryContact.Phone = dto.SecondaryContactPersonPhone.Trim();
                secondaryContact.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _dbContext.ContactPersons.Add(new ContactPerson
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = pm.Project.OrganizationId,
                    ProjectId = pm.ProjectId,
                    ProjectModuleId = pm.Id,
                    FullName = dto.SecondaryContactPersonName.Trim(),
                    Phone = dto.SecondaryContactPersonPhone.Trim(),
                    IsPrimary = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Updated project module {ModuleId} for project {ProjectId}", moduleId, projectId);

        return await GetProjectModuleByIdAsync(projectId, pm.Id);
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
