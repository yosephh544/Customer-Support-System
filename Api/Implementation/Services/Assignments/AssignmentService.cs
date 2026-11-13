using Implementation.Datas;
using Implementation.DTO.Assignments;
using Implementation.DTO.Common;
using Implementation.Exceptions;
using Implementation.Interfaces.Assignments;
using Infrustructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Implementation.Services.Assignments;

public class AssignmentService : IAssignmentService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<AssignmentService> _logger;

    public AssignmentService(ApplicationDbContext dbContext, ILogger<AssignmentService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<PagedResult<SupportAssignmentDto>> GetAssignmentsAsync(AssignmentFilterRequest filter)
    {
        var query = _dbContext.SupportAssignments
            .AsNoTracking()
            .Include(sa => sa.User)
            .Include(sa => sa.Project)
            .Include(sa => sa.ProjectModule)
            .AsQueryable();

        // Search Term Filter
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(sa => sa.User.FullName.ToLower().Contains(search) ||
                                     sa.User.UserName!.ToLower().Contains(search) ||
                                     (sa.User.Email != null && sa.User.Email.ToLower().Contains(search)) ||
                                     sa.Project.Name.ToLower().Contains(search) ||
                                     (sa.ProjectModule != null && sa.ProjectModule.Name.ToLower().Contains(search)));
        }

        // Project Filter
        if (filter.ProjectId.HasValue)
        {
            query = query.Where(sa => sa.ProjectId == filter.ProjectId.Value);
        }

        // ProjectModule Filter
        if (filter.ProjectModuleId.HasValue)
        {
            query = query.Where(sa => sa.ProjectModuleId == filter.ProjectModuleId.Value);
        }

        // User Filter
        if (!string.IsNullOrWhiteSpace(filter.UserId))
        {
            query = query.Where(sa => sa.UserId == filter.UserId);
        }

        // Active Status Filter
        if (filter.IsActive.HasValue)
        {
            query = query.Where(sa => sa.IsActive == filter.IsActive.Value);
        }

        // Sorting
        query = filter.SortBy?.ToLower() switch
        {
            "user" => filter.IsDescending ? query.OrderByDescending(sa => sa.User.FullName) : query.OrderBy(sa => sa.User.FullName),
            "project" => filter.IsDescending ? query.OrderByDescending(sa => sa.Project.Name) : query.OrderBy(sa => sa.Project.Name),
            "assignedat" => filter.IsDescending ? query.OrderByDescending(sa => sa.AssignedAt) : query.OrderBy(sa => sa.AssignedAt),
            "createdat" => filter.IsDescending ? query.OrderByDescending(sa => sa.CreatedAt) : query.OrderBy(sa => sa.CreatedAt),
            _ => query.OrderByDescending(sa => sa.AssignedAt)
        };

        var safePageNumber = filter.PageNumber < 1 ? 1 : filter.PageNumber;
        var safePageSize = filter.PageSize < 1 ? 10 : (filter.PageSize > 100 ? 100 : filter.PageSize);

        var totalCount = await query.CountAsync();
        var pagedItems = await query
            .Skip((safePageNumber - 1) * safePageSize)
            .Take(safePageSize)
            .Select(sa => new SupportAssignmentDto
            {
                Id = sa.Id,
                UserId = sa.UserId,
                UserName = sa.User.UserName ?? string.Empty,
                UserFullName = sa.User.FullName,
                UserEmail = sa.User.Email ?? string.Empty,
                UserPhoneNumber = sa.User.PhoneNumber,
                ProjectId = sa.ProjectId,
                ProjectName = sa.Project.Name,
                OrganizationName = sa.Project.Organization != null ? sa.Project.Organization.Name : null,
                ProjectModuleId = sa.ProjectModuleId,
                ModuleName = sa.ProjectModule != null ? sa.ProjectModule.Name : null,
                IsActive = sa.IsActive,
                AssignedAt = sa.AssignedAt,
                Notes = sa.Notes,
                CreatedAt = sa.CreatedAt,
                UpdatedAt = sa.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<SupportAssignmentDto>
        {
            Items = pagedItems,
            TotalCount = totalCount,
            PageNumber = safePageNumber,
            PageSize = safePageSize
        };
    }

    public async Task<SupportAssignmentDto> GetAssignmentByIdAsync(Guid id)
    {
        var sa = await _dbContext.SupportAssignments
            .AsNoTracking()
            .Include(s => s.User)
            .Include(s => s.Project)
                .ThenInclude(p => p.Organization)
            .Include(s => s.ProjectModule)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sa == null)
        {
            throw new NotFoundException("SupportAssignment", id);
        }

        return new SupportAssignmentDto
        {
            Id = sa.Id,
            UserId = sa.UserId,
            UserName = sa.User.UserName ?? string.Empty,
            UserFullName = sa.User.FullName,
            UserEmail = sa.User.Email ?? string.Empty,
            UserPhoneNumber = sa.User.PhoneNumber,
            ProjectId = sa.ProjectId,
            ProjectName = sa.Project.Name,
            OrganizationName = sa.Project.Organization?.Name,
            ProjectModuleId = sa.ProjectModuleId,
            ModuleName = sa.ProjectModule != null ? sa.ProjectModule.Name : null,
            IsActive = sa.IsActive,
            AssignedAt = sa.AssignedAt,
            Notes = sa.Notes,
            CreatedAt = sa.CreatedAt,
            UpdatedAt = sa.UpdatedAt
        };
    }

    public async Task<List<SupportAssignmentDto>> GetAssignmentsByProjectIdAsync(Guid projectId)
    {
        var projectExists = await _dbContext.Projects.AnyAsync(p => p.Id == projectId);
        if (!projectExists)
        {
            throw new NotFoundException("Project", projectId);
        }

        return await _dbContext.SupportAssignments
            .AsNoTracking()
            .Where(sa => sa.ProjectId == projectId)
            .Include(sa => sa.User)
            .Include(sa => sa.Project)
            .Include(sa => sa.ProjectModule)
            .OrderByDescending(sa => sa.AssignedAt)
            .Select(sa => new SupportAssignmentDto
            {
                Id = sa.Id,
                UserId = sa.UserId,
                UserName = sa.User.UserName ?? string.Empty,
                UserFullName = sa.User.FullName,
                UserEmail = sa.User.Email ?? string.Empty,
                UserPhoneNumber = sa.User.PhoneNumber,
                ProjectId = sa.ProjectId,
                ProjectName = sa.Project.Name,
                OrganizationName = sa.Project.Organization != null ? sa.Project.Organization.Name : null,
                ProjectModuleId = sa.ProjectModuleId,
                ModuleName = sa.ProjectModule != null ? sa.ProjectModule.Name : null,
                IsActive = sa.IsActive,
                AssignedAt = sa.AssignedAt,
                Notes = sa.Notes,
                CreatedAt = sa.CreatedAt,
                UpdatedAt = sa.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<List<SupportAssignmentDto>> GetAssignmentsByUserIdAsync(string userId)
    {
        var userExists = await _dbContext.Users.AnyAsync(u => u.Id == userId);
        if (!userExists)
        {
            throw new NotFoundException("User", userId);
        }

        return await _dbContext.SupportAssignments
            .AsNoTracking()
            .Where(sa => sa.UserId == userId)
            .Include(sa => sa.User)
            .Include(sa => sa.Project)
            .Include(sa => sa.ProjectModule)
            .OrderByDescending(sa => sa.AssignedAt)
            .Select(sa => new SupportAssignmentDto
            {
                Id = sa.Id,
                UserId = sa.UserId,
                UserName = sa.User.UserName ?? string.Empty,
                UserFullName = sa.User.FullName,
                UserEmail = sa.User.Email ?? string.Empty,
                UserPhoneNumber = sa.User.PhoneNumber,
                ProjectId = sa.ProjectId,
                ProjectName = sa.Project.Name,
                OrganizationName = sa.Project.Organization != null ? sa.Project.Organization.Name : null,
                ProjectModuleId = sa.ProjectModuleId,
                ModuleName = sa.ProjectModule != null ? sa.ProjectModule.Name : null,
                IsActive = sa.IsActive,
                AssignedAt = sa.AssignedAt,
                Notes = sa.Notes,
                CreatedAt = sa.CreatedAt,
                UpdatedAt = sa.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<SupportAssignmentDto> CreateAssignmentAsync(CreateAssignmentDto dto)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == dto.UserId);
        if (user == null)
        {
            throw new NotFoundException("User", dto.UserId);
        }

        var project = await _dbContext.Projects.FirstOrDefaultAsync(p => p.Id == dto.ProjectId);
        if (project == null)
        {
            throw new NotFoundException("Project", dto.ProjectId);
        }

        if (dto.ProjectModuleId.HasValue)
        {
            var moduleExists = await _dbContext.ProjectModules
                .AnyAsync(pm => pm.Id == dto.ProjectModuleId.Value && pm.ProjectId == dto.ProjectId);

            if (!moduleExists)
            {
                throw new BadRequestException($"The project module '{dto.ProjectModuleId.Value}' does not belong to project '{project.Name}'.");
            }
        }

        // Prevent duplicate active assignment
        var existingAssignment = await _dbContext.SupportAssignments
            .AnyAsync(sa => sa.UserId == dto.UserId &&
                            sa.ProjectId == dto.ProjectId &&
                            sa.ProjectModuleId == dto.ProjectModuleId &&
                            sa.IsActive);

        if (existingAssignment)
        {
            throw new BadRequestException($"Team member '{user.FullName}' is already actively assigned to this project{(dto.ProjectModuleId.HasValue ? "/module" : "")}.");
        }

        var assignment = new SupportAssignment
        {
            Id = Guid.NewGuid(),
            UserId = dto.UserId,
            ProjectId = dto.ProjectId,
            ProjectModuleId = dto.ProjectModuleId,
            IsActive = dto.IsActive,
            AssignedAt = DateTime.UtcNow,
            Notes = dto.Notes?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.SupportAssignments.Add(assignment);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Assigned user {UserId} to Project {ProjectId} (Module: {ModuleId})", dto.UserId, dto.ProjectId, dto.ProjectModuleId);

        return await GetAssignmentByIdAsync(assignment.Id);
    }

    public async Task<SupportAssignmentDto> UpdateAssignmentAsync(Guid id, UpdateAssignmentDto dto)
    {
        var assignment = await _dbContext.SupportAssignments.FirstOrDefaultAsync(sa => sa.Id == id);
        if (assignment == null)
        {
            throw new NotFoundException("SupportAssignment", id);
        }

        if (dto.ProjectModuleId.HasValue && dto.ProjectModuleId != assignment.ProjectModuleId)
        {
            var moduleExists = await _dbContext.ProjectModules
                .AnyAsync(pm => pm.Id == dto.ProjectModuleId.Value && pm.ProjectId == assignment.ProjectId);

            if (!moduleExists)
            {
                throw new BadRequestException("The specified project module does not belong to this assignment's project.");
            }
        }

        assignment.ProjectModuleId = dto.ProjectModuleId;
        assignment.IsActive = dto.IsActive;
        assignment.Notes = dto.Notes?.Trim();
        assignment.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Updated assignment {AssignmentId}", id);

        return await GetAssignmentByIdAsync(id);
    }

    public async Task DeleteAssignmentAsync(Guid id)
    {
        var assignment = await _dbContext.SupportAssignments.FirstOrDefaultAsync(sa => sa.Id == id);
        if (assignment == null)
        {
            throw new NotFoundException("SupportAssignment", id);
        }

        _dbContext.SupportAssignments.Remove(assignment);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Deleted assignment {AssignmentId}", id);
    }
}

