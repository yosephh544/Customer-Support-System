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
            UserName = user.UserName ?? string.Empty,
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
            UserName = user.UserName ?? string.Empty,
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
        var username = request.UserName?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(username))
        {
            throw new BadRequestException("Username is required.");
        }

        var existingUsername = await _userManager.FindByNameAsync(username);
        if (existingUsername != null)
        {
            throw new BadRequestException($"A user with username '{username}' already exists.");
        }

        string email = string.Empty;
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            email = request.Email.Trim();
            var existingUser = await _userManager.FindByEmailAsync(email);
            if (existingUser != null)
            {
                throw new BadRequestException("A user with this email address already exists.");
            }
        }
        else
        {
            email = $"{username.ToLowerInvariant()}@local";
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
            UserName = username,
            Email = email,
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

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var emailClean = request.Email.Trim();
            var emailOwner = await _userManager.FindByEmailAsync(emailClean);
            if (emailOwner != null && emailOwner.Id != id)
            {
                throw new BadRequestException("This email address is already in use by another user.");
            }
            user.Email = emailClean;
        }

        if (!string.IsNullOrWhiteSpace(request.UserName))
        {
            var usernameClean = request.UserName.Trim();
            var usernameOwner = await _userManager.FindByNameAsync(usernameClean);
            if (usernameOwner != null && usernameOwner.Id != id)
            {
                throw new BadRequestException("This username is already in use by another user.");
            }
            user.UserName = usernameClean;
        }

        user.FullName = SecurityHelper.SanitizeText(request.FullName) ?? request.FullName;
        user.PhoneNumber = request.PhoneNumber;
        user.IsActive = request.IsActive;

        if (request.Role.HasValue)
        {
            user.Role = request.Role.Value;
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description);
            throw new BadRequestException("Failed to update user profile.", errors);
        }

        // If password is provided, reset it
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            var decryptedPassword = request.GetDecryptedPassword();
            if (decryptedPassword.Length < 6)
            {
                throw new BadRequestException("Password must be at least 6 characters long.");
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var resetResult = await _userManager.ResetPasswordAsync(user, token, decryptedPassword);
            if (!resetResult.Succeeded)
            {
                var errors = resetResult.Errors.Select(e => e.Description);
                throw new BadRequestException("Failed to update user password.", errors);
            }
        }

        _logger.LogInformation("User '{UserId}' profile updated successfully.", user.Id);

        return await GetUserByIdAsync(user.Id);
    }

    public async Task<bool> ChangePasswordAsync(string id, ChangePasswordDto request)
    {
        var user = await _userManager.FindByIdAsync(id)
            ?? throw new NotFoundException(nameof(ApplicationUser), id);

        var decryptedPassword = request.GetDecryptedPassword();
        if (string.IsNullOrWhiteSpace(decryptedPassword) || decryptedPassword.Length < 6)
        {
            throw new BadRequestException("Password must be at least 6 characters long.");
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await _userManager.ResetPasswordAsync(user, token, decryptedPassword);
        if (!resetResult.Succeeded)
        {
            var errors = resetResult.Errors.Select(e => e.Description);
            throw new BadRequestException("Failed to change password.", errors);
        }

        _logger.LogInformation("Password for user '{UserId}' was changed successfully.", user.Id);
        return true;
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

    public async Task EnsureAdminUserAsync()
    {
        const string adminEmail = "joz@gmail.com";
        const string adminUsername = "jo";
        const string adminPassword = "P@ssw0rd";

        var admin = await _userManager.FindByEmailAsync(adminEmail)
                 ?? await _userManager.FindByNameAsync(adminUsername);

        if (admin == null)
        {
            admin = new ApplicationUser
            {
                UserName = adminUsername,
                Email = adminEmail,
                EmailConfirmed = true,
                FullName = "System Admin",
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            var createResult = await _userManager.CreateAsync(admin, adminPassword);
            if (!createResult.Succeeded)
            {
                var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                _logger.LogError("Failed to seed admin user: {Errors}", errors);
                return;
            }

            _logger.LogInformation("Seeded default admin user '{Username}' ({Email}) successfully.", adminUsername, adminEmail);
        }
        else
        {
            // Ensure properties are properly set
            bool modified = false;
            if (admin.Role != UserRole.Admin)
            {
                admin.Role = UserRole.Admin;
                modified = true;
            }
            if (!admin.IsActive)
            {
                admin.IsActive = true;
                modified = true;
            }
            if (admin.UserName != adminUsername)
            {
                admin.UserName = adminUsername;
                modified = true;
            }
            if (modified)
            {
                await _userManager.UpdateAsync(admin);
            }

            // Ensure password matches
            if (!await _userManager.CheckPasswordAsync(admin, adminPassword))
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(admin);
                await _userManager.ResetPasswordAsync(admin, token, adminPassword);
                _logger.LogInformation("Reset admin password for '{Username}'.", adminUsername);
            }
        }

        // Admin permissions are governed strictly by the Admin role in permissions.json (Users and Organizations management only; no scheduling or assignments)
        var existingClaims = await _userManager.GetClaimsAsync(admin);
        var permClaims = existingClaims.Where(c => c.Type == "Permission").ToList();
        if (permClaims.Any())
        {
            await _userManager.RemoveClaimsAsync(admin, permClaims);
            _logger.LogInformation("Cleared legacy direct claims for admin user '{Username}' to enforce role-based permissions.", adminUsername);
        }
    }
}

