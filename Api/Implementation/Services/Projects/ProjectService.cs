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
                Description = p.Description,
                Status = p.Status,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                ModuleCount = p.ProjectModules.Count,
                ContactPersonName = p.ContactPersonName,
                ContactPersonPhone = p.ContactPersonPhone,
                SecondaryContactPersonName = p.SecondaryContactPersonName,
                SecondaryContactPersonPhone = p.SecondaryContactPersonPhone,
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
            Description = project.Description,
            Status = project.Status,
            StartDate = project.StartDate,
            EndDate = project.EndDate,
            ModuleCount = project.ProjectModules.Count,
            ContactPersonName = project.ContactPersonName,
            ContactPersonPhone = project.ContactPersonPhone,
            SecondaryContactPersonName = project.SecondaryContactPersonName,
            SecondaryContactPersonPhone = project.SecondaryContactPersonPhone,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            Modules = project.ProjectModules.Select(pm => new ProjectModuleDto
            {
                Id = pm.Id,
                ProjectId = pm.ProjectId,
                ProjectName = project.Name,
                Name = pm.Name,
                IsEnabled = pm.IsEnabled,
                Version = pm.Version,
                Description = pm.Description,
                ContactPersonName = pm.ContactPersonName,
                ContactPersonPhone = pm.ContactPersonPhone,
                SecondaryContactPersonName = pm.SecondaryContactPersonName,
                SecondaryContactPersonPhone = pm.SecondaryContactPersonPhone,
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
                Description = p.Description,
                Status = p.Status,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                ModuleCount = p.ProjectModules.Count,
                ContactPersonName = p.ContactPersonName,
                ContactPersonPhone = p.ContactPersonPhone,
                SecondaryContactPersonName = p.SecondaryContactPersonName,
                SecondaryContactPersonPhone = p.SecondaryContactPersonPhone,
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

        var project = new Project
        {
            Id = Guid.NewGuid(),
            OrganizationId = dto.OrganizationId,
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            Status = dto.Status,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            ContactPersonName = dto.ContactPersonName?.Trim(),
            ContactPersonPhone = dto.ContactPersonPhone?.Trim(),
            SecondaryContactPersonName = dto.SecondaryContactPersonName?.Trim(),
            SecondaryContactPersonPhone = dto.SecondaryContactPersonPhone?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Projects.Add(project);

        // Synchronize primary project contact
        if (!string.IsNullOrWhiteSpace(dto.ContactPersonName) && !string.IsNullOrWhiteSpace(dto.ContactPersonPhone))
        {
            _dbContext.ContactPersons.Add(new ContactPerson
            {
                Id = Guid.NewGuid(),
                OrganizationId = org.Id,
                ProjectId = project.Id,
                FullName = dto.ContactPersonName.Trim(),
                Phone = dto.ContactPersonPhone.Trim(),
                IsPrimary = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        // Synchronize optional secondary project contact
        if (!string.IsNullOrWhiteSpace(dto.SecondaryContactPersonName) && !string.IsNullOrWhiteSpace(dto.SecondaryContactPersonPhone))
        {
            _dbContext.ContactPersons.Add(new ContactPerson
            {
                Id = Guid.NewGuid(),
                OrganizationId = org.Id,
                ProjectId = project.Id,
                FullName = dto.SecondaryContactPersonName.Trim(),
                Phone = dto.SecondaryContactPersonPhone.Trim(),
                IsPrimary = false,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (dto.Modules != null && dto.Modules.Count > 0)
        {
            foreach (var modDto in dto.Modules)
            {
                if (!string.IsNullOrWhiteSpace(modDto.Name))
                {
                    var projectModule = new ProjectModule
                    {
                        Id = Guid.NewGuid(),
                        ProjectId = project.Id,
                        Name = modDto.Name.Trim(),
                        Version = string.IsNullOrWhiteSpace(modDto.Version) ? "v1.0" : modDto.Version.Trim(),
                        Description = modDto.Description?.Trim(),
                        IsEnabled = true,
                        ContactPersonName = modDto.ContactPersonName?.Trim(),
                        ContactPersonPhone = modDto.ContactPersonPhone?.Trim(),
                        SecondaryContactPersonName = modDto.SecondaryContactPersonName?.Trim(),
                        SecondaryContactPersonPhone = modDto.SecondaryContactPersonPhone?.Trim(),
                        CreatedAt = DateTime.UtcNow
                    };
                    _dbContext.ProjectModules.Add(projectModule);

                    // Synchronize module primary contact
                    if (!string.IsNullOrWhiteSpace(modDto.ContactPersonName) && !string.IsNullOrWhiteSpace(modDto.ContactPersonPhone))
                    {
                        _dbContext.ContactPersons.Add(new ContactPerson
                        {
                            Id = Guid.NewGuid(),
                            OrganizationId = org.Id,
                            ProjectId = project.Id,
                            ProjectModuleId = projectModule.Id,
                            FullName = modDto.ContactPersonName.Trim(),
                            Phone = modDto.ContactPersonPhone.Trim(),
                            IsPrimary = true,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        });
                    }

                    // Synchronize module secondary contact
                    if (!string.IsNullOrWhiteSpace(modDto.SecondaryContactPersonName) && !string.IsNullOrWhiteSpace(modDto.SecondaryContactPersonPhone))
                    {
                        _dbContext.ContactPersons.Add(new ContactPerson
                        {
                            Id = Guid.NewGuid(),
                            OrganizationId = org.Id,
                            ProjectId = project.Id,
                            ProjectModuleId = projectModule.Id,
                            FullName = modDto.SecondaryContactPersonName.Trim(),
                            Phone = modDto.SecondaryContactPersonPhone.Trim(),
                            IsPrimary = false,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        });
                    }
                }
            }
        }

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

        project.Name = dto.Name.Trim();
        project.Description = dto.Description?.Trim();
        project.Status = dto.Status;
        project.StartDate = dto.StartDate;
        project.EndDate = dto.EndDate;
        project.ContactPersonName = dto.ContactPersonName?.Trim();
        project.ContactPersonPhone = dto.ContactPersonPhone?.Trim();
        project.SecondaryContactPersonName = dto.SecondaryContactPersonName?.Trim();
        project.SecondaryContactPersonPhone = dto.SecondaryContactPersonPhone?.Trim();
        project.UpdatedAt = DateTime.UtcNow;

        // Update / sync primary project contact person
        var primaryContact = await _dbContext.ContactPersons
            .FirstOrDefaultAsync(cp => cp.ProjectId == project.Id && cp.ProjectModuleId == null && cp.IsPrimary);

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
                    OrganizationId = project.OrganizationId,
                    ProjectId = project.Id,
                    FullName = dto.ContactPersonName.Trim(),
                    Phone = dto.ContactPersonPhone.Trim(),
                    IsPrimary = true,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        // Update / sync secondary project contact person
        var secondaryContact = await _dbContext.ContactPersons
            .FirstOrDefaultAsync(cp => cp.ProjectId == project.Id && cp.ProjectModuleId == null && !cp.IsPrimary);

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
                    OrganizationId = project.OrganizationId,
                    ProjectId = project.Id,
                    FullName = dto.SecondaryContactPersonName.Trim(),
                    Phone = dto.SecondaryContactPersonPhone.Trim(),
                    IsPrimary = false,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

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

