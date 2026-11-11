using Implementation.DTO.Common;
using Implementation.DTO.UserMgt;
using Implementation.Exceptions;
using Implementation.Helpers;
using Implementation.Interfaces.Authorization;
using Implementation.Interfaces.UserMgt;
using Infrustructure.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Implementation.Services.UserMgt;

public class UserService : IUserService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IPermissionService _permissionService;
    private readonly ILogger<UserService> _logger;

    public UserService(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IPermissionService permissionService,
        ILogger<UserService> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _permissionService = permissionService;
        _logger = logger;
    }

    public async Task<PagedResult<UserSummaryDto>> GetUsersAsync(UserFilterRequest filter)
    {
        var query = _userManager.Users.AsNoTracking();

        // Search Term Filter
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(u => u.FullName.ToLower().Contains(search) ||
                                     (u.Email != null && u.Email.ToLower().Contains(search)) ||
                                     (u.PhoneNumber != null && u.PhoneNumber.Contains(search)));
        }

        // Active Status Filter
        if (filter.IsActive.HasValue)
        {
            query = query.Where(u => u.IsActive == filter.IsActive.Value);
        }

        // Sorting
        query = filter.SortBy?.ToLower() switch
        {
            "fullname" => filter.IsDescending ? query.OrderByDescending(u => u.FullName) : query.OrderBy(u => u.FullName),
            "email" => filter.IsDescending ? query.OrderByDescending(u => u.Email) : query.OrderBy(u => u.Email),
            "createdat" => filter.IsDescending ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt),
            _ => query.OrderByDescending(u => u.CreatedAt)
        };

        // Paging
        var safePageNumber = filter.PageNumber < 1 ? 1 : filter.PageNumber;
        var safePageSize = filter.PageSize < 1 ? 10 : (filter.PageSize > 100 ? 100 : filter.PageSize);

        // Role Filter consideration (if role filtering is specified)
        if (!string.IsNullOrWhiteSpace(filter.Role))
        {
            var roleName = filter.Role.Trim();
            var usersInRole = await _userManager.GetUsersInRoleAsync(roleName);
            var userIdsInRole = usersInRole.Select(u => u.Id).ToHashSet();
            query = query.Where(u => userIdsInRole.Contains(u.Id));
        }

        var totalCount = await query.CountAsync();
        var pagedUsers = await query
            .Skip((safePageNumber - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync();

        var summaries = new List<UserSummaryDto>();
        foreach (var user in pagedUsers)
        {
            var roles = await _userManager.GetRolesAsync(user);
            summaries.Add(new UserSummaryDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                PhoneNumber = user.PhoneNumber,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                Roles = roles.ToList()
            });
        }

        return new PagedResult<UserSummaryDto>(summaries, totalCount, safePageNumber, safePageSize);
    }

    public async Task<UserDetailsDto> GetUserByIdAsync(string id)
    {
        var user = await _userManager.FindByIdAsync(id)
            ?? throw new NotFoundException(nameof(ApplicationUser), id);

        var roles = await _userManager.GetRolesAsync(user);
        var permissions = await _permissionService.GetUserPermissionsAsync(id);

        return new UserDetailsDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            PhoneNumber = user.PhoneNumber,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            Roles = roles.ToList(),
            DirectPermissions = permissions.DirectPermissions,
            EffectivePermissions = permissions.EffectivePermissions
        };
    }

    public async Task<UserDetailsDto> CreateUserAsync(CreateUserDto request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            throw new BadRequestException("A user with this email address already exists.");
        }

        // Validate roles
        foreach (var role in request.Roles)
        {
            if (!await _roleManager.RoleExistsAsync(role))
            {
                throw new BadRequestException($"Role '{role}' does not exist.");
            }
        }

        var user = new ApplicationUser
        {
            UserName = request.Email.Trim(),
            Email = request.Email.Trim(),
            FullName = SecurityHelper.SanitizeText(request.FullName) ?? request.FullName,
            PhoneNumber = request.PhoneNumber,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description);
            throw new BadRequestException("Failed to create user.", errors);
        }

        // Assign Roles
        if (request.Roles.Count > 0)
        {
            await _userManager.AddToRolesAsync(user, request.Roles);
        }

        // Assign Direct Permissions if supplied
        if (request.DirectPermissions.Count > 0)
        {
            await _permissionService.SetUserDirectPermissionsAsync(user.Id, request.DirectPermissions);
        }

        _logger.LogInformation("User '{Email}' ({UserId}) created successfully with roles: {Roles}.", user.Email, user.Id, string.Join(", ", request.Roles));

        return await GetUserByIdAsync(user.Id);
    }

    public async Task<UserDetailsDto> UpdateUserAsync(string id, UpdateUserDto request)
    {
        var user = await _userManager.FindByIdAsync(id)
            ?? throw new NotFoundException(nameof(ApplicationUser), id);

        var emailOwner = await _userManager.FindByEmailAsync(request.Email);
        if (emailOwner != null && emailOwner.Id != id)
        {
            throw new BadRequestException("This email address is already in use by another user.");
        }

        user.FullName = SecurityHelper.SanitizeText(request.FullName) ?? request.FullName;
        user.Email = request.Email.Trim();
        user.UserName = request.Email.Trim();
        user.PhoneNumber = request.PhoneNumber;
        user.IsActive = request.IsActive;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description);
            throw new BadRequestException("Failed to update user.", errors);
        }

        _logger.LogInformation("User '{UserId}' updated successfully.", user.Id);

        return await GetUserByIdAsync(user.Id);
    }

    public async Task<bool> ToggleUserStatusAsync(string id, bool isActive)
    {
        var user = await _userManager.FindByIdAsync(id)
            ?? throw new NotFoundException(nameof(ApplicationUser), id);

        user.IsActive = isActive;
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description);
            throw new BadRequestException("Failed to update user status.", errors);
        }

        _logger.LogInformation("User '{UserId}' active status set to {Status}.", user.Id, isActive);
        return true;
    }

    public async Task<UserDetailsDto> UpdateUserRolesAsync(string id, UpdateUserRolesDto request)
    {
        var user = await _userManager.FindByIdAsync(id)
            ?? throw new NotFoundException(nameof(ApplicationUser), id);

        foreach (var role in request.Roles)
        {
            if (!await _roleManager.RoleExistsAsync(role))
            {
                throw new BadRequestException($"Role '{role}' does not exist.");
            }
        }

        var currentRoles = await _userManager.GetRolesAsync(user);
        var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
        if (!removeResult.Succeeded)
        {
            var errors = removeResult.Errors.Select(e => e.Description);
            throw new BadRequestException("Failed to update user roles.", errors);
        }

        var addResult = await _userManager.AddToRolesAsync(user, request.Roles);
        if (!addResult.Succeeded)
        {
            var errors = addResult.Errors.Select(e => e.Description);
            throw new BadRequestException("Failed to assign new roles.", errors);
        }

        _logger.LogInformation("User '{UserId}' roles updated to: {Roles}.", user.Id, string.Join(", ", request.Roles));

        return await GetUserByIdAsync(user.Id);
    }

    public async Task DeleteUserAsync(string id)
    {
        var user = await _userManager.FindByIdAsync(id)
            ?? throw new NotFoundException(nameof(ApplicationUser), id);

        // Soft delete: Deactivate user
        user.IsActive = false;
        await _userManager.UpdateAsync(user);

        _logger.LogInformation("User '{UserId}' deactivated (soft-deleted).", user.Id);
    }
}

