using Implementation.DTO.Authorization;
using Implementation.Exceptions;
using Implementation.Interfaces.Authorization;
using Infrustructure.Enums;
using Infrustructure.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Implementation.Services.Authorization;

public class RoleService : IRoleService
{
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IPermissionService _permissionService;
    private readonly ILogger<RoleService> _logger;

    public RoleService(
        RoleManager<IdentityRole> roleManager,
        UserManager<ApplicationUser> userManager,
        IPermissionService permissionService,
        ILogger<RoleService> logger)
    {
        _roleManager = roleManager;
        _userManager = userManager;
        _permissionService = permissionService;
        _logger = logger;
    }

    public async Task<IReadOnlyList<RoleSummaryDto>> GetRolesAsync()
    {
        var roles = await _roleManager.Roles.ToListAsync();
        var result = new List<RoleSummaryDto>();

        foreach (var role in roles)
        {
            var roleName = role.Name ?? string.Empty;
            var usersInRole = await _userManager.GetUsersInRoleAsync(roleName);
            var permissions = await _permissionService.GetRolePermissionsAsync(roleName);

            result.Add(new RoleSummaryDto
            {
                Id = role.Id,
                Name = roleName,
                UserCount = usersInRole.Count,
                PermissionCount = permissions.Count,
                Permissions = permissions.ToList()
            });
        }

        return result.OrderBy(r => r.Name).ToList();
    }

    public async Task<RoleSummaryDto> GetRoleByNameAsync(string roleName)
    {
        var role = await _roleManager.FindByNameAsync(roleName)
            ?? throw new NotFoundException($"Role '{roleName}' was not found.");

        var usersInRole = await _userManager.GetUsersInRoleAsync(roleName);
        var permissions = await _permissionService.GetRolePermissionsAsync(roleName);

        return new RoleSummaryDto
        {
            Id = role.Id,
            Name = roleName,
            UserCount = usersInRole.Count,
            PermissionCount = permissions.Count,
            Permissions = permissions.ToList()
        };
    }

    public async Task<RoleSummaryDto> CreateRoleAsync(CreateRoleDto request)
    {
        var normalizedName = request.RoleName.Trim();
        if (await _roleManager.RoleExistsAsync(normalizedName))
        {
            throw new BadRequestException($"Role '{normalizedName}' already exists.");
        }

        var identityRole = new IdentityRole(normalizedName);
        var result = await _roleManager.CreateAsync(identityRole);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description);
            throw new BadRequestException("Failed to create role.", errors);
        }

        if (request.Permissions.Count > 0)
        {
            await _permissionService.UpdateRolePermissionsAsync(normalizedName, request.Permissions);
        }

        _logger.LogInformation("Role '{RoleName}' created successfully.", normalizedName);

        return await GetRoleByNameAsync(normalizedName);
    }

    public async Task UpdateRolePermissionsAsync(UpdateRolePermissionsDto request)
    {
        await _permissionService.UpdateRolePermissionsAsync(request.RoleName, request.Permissions);
    }

    public async Task EnsureDefaultRolesAsync()
    {
        foreach (var roleName in AppRoles.All)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                await _roleManager.CreateAsync(new IdentityRole(roleName));
                _logger.LogInformation("Seeded default role '{RoleName}'.", roleName);
            }
        }
    }
}

