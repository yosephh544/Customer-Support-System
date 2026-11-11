using System.Security.Claims;
using Api.Authorization;
using Implementation.DTO.Authorization;
using Implementation.DTO.Common;
using Implementation.Helpers;
using Implementation.Interfaces.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Authorization;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PermissionsController : ControllerBase
{
    private readonly IPermissionService _permissionService;
    private readonly IRoleService _roleService;

    public PermissionsController(
        IPermissionService permissionService,
        IRoleService roleService)
    {
        _permissionService = permissionService;
        _roleService = roleService;
    }

    [HttpGet]
    [HasPermission("Roles.View")]
    [ProducesResponseType(typeof(ApiResponse<PermissionsCatalogDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPermissionsCatalog([FromQuery] string? role = null)
    {
        // If a specific role is requested, return that role's encrypted permissions
        if (!string.IsNullOrWhiteSpace(role))
        {
            var rolePermissions = await _permissionService.GetRolePermissionsAsync(role.Trim());
            var encrypted = SecurityHelper.EncryptList(rolePermissions);
            return Ok(ApiResponse<List<string>>.SuccessResult(encrypted));
        }

        var catalog = await _permissionService.GetCatalogAsync();

        // Encrypt all permission identifiers and role matrix arrays in the response payload
        var encryptedCatalog = new PermissionsCatalogDto
        {
            Modules = catalog.Modules.Select(m => new PermissionModuleDto
            {
                Name = m.Name,
                Description = m.Description,
                Permissions = m.Permissions.Select(p => new PermissionDto
                {
                    Id = SecurityHelper.Encrypt(p.Id),
                    Name = p.Name,
                    Description = p.Description,
                    Module = p.Module
                }).ToList()
            }).ToList(),
            RoleDefaultPermissions = catalog.RoleDefaultPermissions.ToDictionary(
                kv => kv.Key,
                kv => SecurityHelper.EncryptList(kv.Value)
            )
        };

        return Ok(ApiResponse<PermissionsCatalogDto>.SuccessResult(encryptedCatalog));
    }

    [HttpGet("roles")]
    [HasPermission("Roles.View")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<RoleSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _roleService.GetRolesAsync();
        return Ok(ApiResponse<IReadOnlyList<RoleSummaryDto>>.SuccessResult(roles));
    }

    [HttpPut("roles")]
    [HasPermission("Roles.Manage")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateRolePermissions([FromBody] UpdateRolePermissionsDto request)
    {
        // Decrypt incoming permissions in payload
        var decryptedPermissions = request.GetDecryptedPermissions();
        await _permissionService.UpdateRolePermissionsAsync(request.RoleName, decryptedPermissions);
        return Ok(ApiResponse.Ok($"Permissions for role '{request.RoleName}' successfully updated and saved."));
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<UserPermissionsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyPermissions()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(ApiResponse.Fail("User is not authenticated.", statusCode: StatusCodes.Status401Unauthorized));
        }

        var permissions = await _permissionService.GetUserPermissionsAsync(userId);
        return Ok(ApiResponse<UserPermissionsDto>.SuccessResult(permissions));
    }

    [HttpPost("reload")]
    [HasPermission("Roles.Manage")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ReloadPermissions()
    {
        await _permissionService.ReloadPermissionsAsync();
        return Ok(ApiResponse.Ok("Permissions configuration successfully reloaded from permissions.json."));
    }
}
