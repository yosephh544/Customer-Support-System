using Implementation.DTO.Common;
using Implementation.DTO.UserMgt;
using Implementation.Exceptions;
using Implementation.Helpers;
using Implementation.Interfaces.Authorization;
using Implementation.Interfaces.UserMgt;
using Infrustructure.Enums;
using Infrustructure.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Implementation.Services.UserMgt;

public class UserService : IUserService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IPermissionService _permissionService;
    private readonly ILogger<UserService> _logger;

    public UserService(
        UserManager<ApplicationUser> userManager,
        IPermissionService permissionService,
        ILogger<UserService> logger)
    {
        _userManager = userManager;
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

        // Role Filter (pure SQL enum/column filter)
        if (!string.IsNullOrWhiteSpace(filter.Role))
        {
            if (Enum.TryParse<UserRole>(filter.Role.Trim(), true, out var filterRole))
            {
                query = query.Where(u => u.Role == filterRole);
            }
            else
            {
                // Invalid role specified in filter returns empty result
                query = query.Where(u => false);
            }
        }

        // Sorting
        query = filter.SortBy?.ToLower() switch
        {
            "fullname" => filter.IsDescending ? query.OrderByDescending(u => u.FullName) : query.OrderBy(u => u.FullName),
            "email" => filter.IsDescending ? query.OrderByDescending(u => u.Email) : query.OrderBy(u => u.Email),
            "createdat" => filter.IsDescending ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt),
            "role" => filter.IsDescending ? query.OrderByDescending(u => u.Role) : query.OrderBy(u => u.Role),
            _ => query.OrderByDescending(u => u.CreatedAt)
        };

        // Paging
        var safePageNumber = filter.PageNumber < 1 ? 1 : filter.PageNumber;
        var safePageSize = filter.PageSize < 1 ? 10 : (filter.PageSize > 100 ? 100 : filter.PageSize);

        var totalCount = await query.CountAsync();
        var pagedUsers = await query
            .Skip((safePageNumber - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync();

        var summaries = pagedUsers.Select(user => new UserSummaryDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            PhoneNumber = user.PhoneNumber,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            Role = user.Role.ToString()
        }).ToList();

        return new PagedResult<UserSummaryDto>(summaries, totalCount, safePageNumber, safePageSize);
    }

    public async Task<UserDetailsDto> GetUserByIdAsync(string id)
    {
        var user = await _userManager.FindByIdAsync(id)
            ?? throw new NotFoundException(nameof(ApplicationUser), id);

        var permissions = await _permissionService.GetUserPermissionsAsync(id);

        return new UserDetailsDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            PhoneNumber = user.PhoneNumber,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            Role = user.Role.ToString(),
            DirectPermissions = SecurityHelper.EncryptList(permissions.DirectPermissions),
            EffectivePermissions = SecurityHelper.EncryptList(permissions.EffectivePermissions)
        };
    }

    public async Task<UserDetailsDto> CreateUserAsync(CreateUserDto request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            throw new BadRequestException("A user with this email address already exists.");
        }

        // Validate & parse role
        var assignedRole = request.Role;
        if (request.Roles != null && request.Roles.Count > 0)
        {
            var roleStr = request.Roles.First();
            if (!Enum.TryParse<UserRole>(roleStr, true, out assignedRole))
            {
                throw new BadRequestException($"Role '{roleStr}' is invalid. Allowed roles: {string.Join(", ", AppRoles.All)}.");
            }
        }

        var user = new ApplicationUser
        {
            UserName = request.Email.Trim(),
            Email = request.Email.Trim(),
            FullName = SecurityHelper.SanitizeText(request.FullName) ?? request.FullName,
            PhoneNumber = request.PhoneNumber,
            Role = assignedRole,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        // Decrypt password if encrypted
        var decryptedPassword = request.GetDecryptedPassword();
        var result = await _userManager.CreateAsync(user, decryptedPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description);
            throw new BadRequestException("Failed to create user.", errors);
        }

        // Decrypt direct permissions if encrypted
        var decryptedPermissions = request.GetDecryptedDirectPermissions();
        if (decryptedPermissions.Count > 0)
        {
            await _permissionService.SetUserDirectPermissionsAsync(user.Id, decryptedPermissions);
        }

        _logger.LogInformation("User '{Email}' ({UserId}) created successfully with role: {Role}.", user.Email, user.Id, user.Role);

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

        var roleName = request.Roles?.FirstOrDefault() ?? request.Role?.ToString();
        if (string.IsNullOrWhiteSpace(roleName) || !Enum.TryParse<UserRole>(roleName, true, out var newRole))
        {
            throw new BadRequestException($"Invalid role specified. Allowed roles: {string.Join(", ", AppRoles.All)}.");
        }

        user.Role = newRole;
        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            var errors = updateResult.Errors.Select(e => e.Description);
            throw new BadRequestException("Failed to update user role.", errors);
        }

        _logger.LogInformation("User '{UserId}' role updated to: {Role}.", user.Id, user.Role);

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

