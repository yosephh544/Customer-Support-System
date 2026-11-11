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
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RolesController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    [HttpGet]
    [HasPermission("Roles.View")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<RoleSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _roleService.GetRolesAsync();
        return Ok(ApiResponse<IReadOnlyList<RoleSummaryDto>>.SuccessResult(roles));
    }

    [HttpGet("{roleName}")]
    [HasPermission("Roles.View")]
    [ProducesResponseType(typeof(ApiResponse<RoleSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRoleByName(string roleName)
    {
        var role = await _roleService.GetRoleByNameAsync(roleName);
        return Ok(ApiResponse<RoleSummaryDto>.SuccessResult(role));
    }

    [HttpPost]
    [HasPermission("Roles.Manage")]
    [ProducesResponseType(typeof(ApiResponse<RoleSummaryDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleDto request)
    {
        var result = await _roleService.CreateRoleAsync(request);
        return CreatedAtAction(nameof(GetRoleByName), new { roleName = result.Name }, ApiResponse<RoleSummaryDto>.SuccessResult(result, "Role created successfully.", StatusCodes.Status201Created));
    }

    [HttpPut("permissions")]
    [HasPermission("Roles.Manage")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateRolePermissions([FromBody] UpdateRolePermissionsDto request)
    {
        await _roleService.UpdateRolePermissionsAsync(request);
        return Ok(ApiResponse.Ok($"Permissions updated for role '{request.RoleName}' successfully."));
    }
}

