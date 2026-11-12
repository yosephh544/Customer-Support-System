using System.Security.Claims;
using Api.Authorization;
using Implementation.DTO.Authorization;
using Implementation.DTO.Common;
using Implementation.DTO.UserMgt;
using Implementation.Interfaces.Authorization;
using Implementation.Interfaces.UserMgt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.UserMgt;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IPermissionService _permissionService;

    public UsersController(IUserService userService, IPermissionService permissionService)
    {
        _userService = userService;
        _permissionService = permissionService;
    }

    [HttpGet]
    [HasPermission("Users.View")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<UserSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsers([FromQuery] UserFilterRequest filter)
    {
        var result = await _userService.GetUsersAsync(filter);
        return Ok(ApiResponse<PagedResult<UserSummaryDto>>.SuccessResult(result));
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<UserDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserById(string id)
    {
        var targetId = id;
        if (id.Equals("me", StringComparison.OrdinalIgnoreCase))
        {
            targetId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(targetId))
            {
                return Unauthorized(ApiResponse.Fail("User is not authenticated.", statusCode: StatusCodes.Status401Unauthorized));
            }
        }

        var result = await _userService.GetUserByIdAsync(targetId);
        return Ok(ApiResponse<UserDetailsDto>.SuccessResult(result));
    }

    [HttpPost]
    [HasPermission("Users.Create")]
    [ProducesResponseType(typeof(ApiResponse<UserDetailsDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto request)
    {
        var result = await _userService.CreateUserAsync(request);
        return CreatedAtAction(nameof(GetUserById), new { id = result.Id }, ApiResponse<UserDetailsDto>.SuccessResult(result, "User created successfully.", StatusCodes.Status201Created));
    }

    [HttpPut("{id}")]
    [HasPermission("Users.Edit")]
    [ProducesResponseType(typeof(ApiResponse<UserDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto request)
    {
        var targetId = id;
        if (id.Equals("me", StringComparison.OrdinalIgnoreCase))
        {
            targetId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(targetId))
            {
                return Unauthorized(ApiResponse.Fail("User is not authenticated.", statusCode: StatusCodes.Status401Unauthorized));
            }
        }

        var result = await _userService.UpdateUserAsync(targetId, request);
        return Ok(ApiResponse<UserDetailsDto>.SuccessResult(result, "User profile updated successfully."));
    }

    [HttpPut("{id}/password")]
    [HasPermission("Users.Edit")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword(string id, [FromBody] ChangePasswordDto request)
    {
        var targetId = id;
        if (id.Equals("me", StringComparison.OrdinalIgnoreCase))
        {
            targetId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(targetId))
            {
                return Unauthorized(ApiResponse.Fail("User is not authenticated.", statusCode: StatusCodes.Status401Unauthorized));
            }
        }

        await _userService.ChangePasswordAsync(targetId, request);
        return Ok(ApiResponse.Ok("User password changed successfully."));
    }

    [HttpPut("{id}/status")]
    [HasPermission("Users.Edit")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleStatus(string id, [FromQuery] bool isActive)
    {
        await _userService.ToggleUserStatusAsync(id, isActive);
        var statusText = isActive ? "activated" : "deactivated";
        return Ok(ApiResponse.Ok($"User {statusText} successfully."));
    }

    [HttpPut("{id}/roles")]
    [HasPermission("Users.ManageRoles")]
    [ProducesResponseType(typeof(ApiResponse<UserDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateRoles(string id, [FromBody] UpdateUserRolesDto request)
    {
        var result = await _userService.UpdateUserRolesAsync(id, request);
        return Ok(ApiResponse<UserDetailsDto>.SuccessResult(result, "User roles updated successfully."));
    }

    [HttpGet("{id}/permissions")]
    [ProducesResponseType(typeof(ApiResponse<UserPermissionsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserPermissions(string id)
    {
        var targetId = id;
        if (id.Equals("me", StringComparison.OrdinalIgnoreCase))
        {
            targetId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(targetId))
            {
                return Unauthorized(ApiResponse.Fail("User is not authenticated.", statusCode: StatusCodes.Status401Unauthorized));
            }
        }

        var permissions = await _permissionService.GetUserPermissionsAsync(targetId);
        return Ok(ApiResponse<UserPermissionsDto>.SuccessResult(permissions));
    }

    [HttpPut("{id}/permissions")]
    [HasPermission("Users.ManagePermissions")]
    [ProducesResponseType(typeof(ApiResponse<UserPermissionsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateUserPermissions(string id, [FromBody] UpdateUserPermissionsDto request)
    {
        var decryptedPermissions = request.GetDecryptedPermissions();
        await _permissionService.SetUserDirectPermissionsAsync(id, decryptedPermissions);
        var permissions = await _permissionService.GetUserPermissionsAsync(id);
        return Ok(ApiResponse<UserPermissionsDto>.SuccessResult(permissions, "User direct permissions updated successfully."));
    }

    [HttpDelete("{id}")]
    [HasPermission("Users.Delete")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteUser(string id)
    {
        await _userService.DeleteUserAsync(id);
        return Ok(ApiResponse.Ok("User deactivated successfully."));
    }
}
