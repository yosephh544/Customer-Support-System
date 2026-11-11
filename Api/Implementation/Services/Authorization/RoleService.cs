using Implementation.DTO.Authorization;
using Implementation.Exceptions;
using Implementation.Helpers;
using Implementation.Interfaces.Authorization;
using Infrustructure.Enums;
using Infrustructure.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Implementation.Services.Authorization;

public class RoleService : IRoleService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IPermissionService _permissionService;
    private readonly ILogger<RoleService> _logger;

    public RoleService(
        UserManager<ApplicationUser> userManager,
        IPermissionService permissionService,
        ILogger<RoleService> logger)
    {
        _userManager = userManager;
        _permissionService = permissionService;
        _logger = logger;
    }

    public async Task<IReadOnlyList<RoleSummaryDto>> GetRolesAsync()
    {
        var result = new List<RoleSummaryDto>();

        foreach (var role in Enum.GetValues<UserRole>())
        {
            var roleName = role.ToString();
            var usersInRoleCount = await _userManager.Users.CountAsync(u => u.Role == role);
            var permissions = await _permissionService.GetRolePermissionsAsync(roleName);

            result.Add(new RoleSummaryDto
            {
                Id = ((int)role).ToString(),
                Name = roleName,
                UserCount = usersInRoleCount,
                PermissionCount = permissions.Count,
                Permissions = SecurityHelper.EncryptList(permissions)
            });
        }

        return result.OrderBy(r => r.Name).ToList();
    }

    public async Task<RoleSummaryDto> GetRoleByNameAsync(string roleName)
    {
        if (!Enum.TryParse<UserRole>(roleName, true, out var role))
        {
            throw new NotFoundException($"Role '{roleName}' was not found. Valid roles are: {string.Join(", ", AppRoles.All)}.");
        }

        var normalizedName = role.ToString();
        var usersInRoleCount = await _userManager.Users.CountAsync(u => u.Role == role);
        var permissions = await _permissionService.GetRolePermissionsAsync(normalizedName);

        return new RoleSummaryDto
        {
            Id = ((int)role).ToString(),
            Name = normalizedName,
            UserCount = usersInRoleCount,
            PermissionCount = permissions.Count,
            Permissions = SecurityHelper.EncryptList(permissions)
        };
    }

    public Task<RoleSummaryDto> CreateRoleAsync(CreateRoleDto request)
    {
        throw new BadRequestException($"Roles are fixed enum constants ({string.Join(", ", AppRoles.All)}) and cannot be dynamically created. You can customize role permissions via permissions management.");
    }

    public async Task UpdateRolePermissionsAsync(UpdateRolePermissionsDto request)
    {
        if (!Enum.TryParse<UserRole>(request.RoleName, true, out var role))
        {
            throw new BadRequestException($"Role '{request.RoleName}' is not a valid role. Valid roles are: {string.Join(", ", AppRoles.All)}.");
        }

        await _permissionService.UpdateRolePermissionsAsync(role.ToString(), request.Permissions);
    }

    public async Task EnsureDefaultRolesAsync()
    {
        var matrix = await _permissionService.GetRolePermissionMatrixAsync();
        foreach (var roleName in AppRoles.All)
        {
            if (!matrix.ContainsKey(roleName))
            {
                await _permissionService.UpdateRolePermissionsAsync(roleName, new List<string>());
                _logger.LogInformation("Ensured default role entry '{RoleName}' in permissions catalog.", roleName);
            }
        }
    }
}

