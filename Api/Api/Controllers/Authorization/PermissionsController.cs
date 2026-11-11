using System.Security.Claims;
using Api.Authorization;
using Implementation.DTO.Authorization;
using Implementation.DTO.Common;
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

    public PermissionsController(IPermissionService permissionService)
    {
        _permissionService = permissionService;
    }

    [HttpGet]
    [HasPermission("Roles.View")]
    [ProducesResponseType(typeof(ApiResponse<PermissionsCatalogDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPermissionsCatalog()
    {
        var catalog = await _permissionService.GetCatalogAsync();
        return Ok(ApiResponse<PermissionsCatalogDto>.SuccessResult(catalog));
    }

    [HttpGet("matrix")]
    [HasPermission("Roles.View")]
    [ProducesResponseType(typeof(ApiResponse<Dictionary<string, List<string>>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRolePermissionMatrix()
    {
        var matrix = await _permissionService.GetRolePermissionMatrixAsync();
        return Ok(ApiResponse<Dictionary<string, List<string>>>.SuccessResult(matrix));
    }

    [HttpPut("matrix")]
    [HasPermission("Roles.Manage")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateRolePermissions([FromBody] UpdateRolePermissionsDto request)
    {
        await _permissionService.UpdateRolePermissionsAsync(request.RoleName, request.Permissions);
        return Ok(ApiResponse.Ok($"Permissions for role '{request.RoleName}' successfully updated and saved to permissions.json."));
    }

    [HttpPost("reload")]
    [HasPermission("Roles.Manage")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ReloadPermissions()
    {
        await _permissionService.ReloadPermissionsAsync();
        return Ok(ApiResponse.Ok("Permissions configuration successfully reloaded from permissions.json."));
    }

    [HttpGet("my-permissions")]
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
}

