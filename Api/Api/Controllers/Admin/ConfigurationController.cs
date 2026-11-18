using System.Security.Claims;
using Api.Authorization;
using Implementation.DTO.Common;
using Implementation.DTO.Configuration;
using Implementation.Interfaces.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Admin;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConfigurationController : ControllerBase
{
    private readonly IConfigurationService _configurationService;

    public ConfigurationController(IConfigurationService configurationService)
    {
        _configurationService = configurationService;
    }

    [HttpGet]
    [HasPermission("Configuration.View")]
    [ProducesResponseType(typeof(ApiResponse<SystemConfigurationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConfiguration()
    {
        var configuration = await _configurationService.GetConfigurationAsync();
        return Ok(ApiResponse<SystemConfigurationDto>.SuccessResult(configuration));
    }

    [HttpPut]
    [HasPermission("Configuration.Manage")]
    [ProducesResponseType(typeof(ApiResponse<SystemConfigurationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateConfiguration([FromBody] UpdateSystemConfigurationDto request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var configuration = await _configurationService.UpdateConfigurationAsync(request, userId);
        return Ok(ApiResponse<SystemConfigurationDto>.SuccessResult(configuration, "System configuration saved successfully."));
    }
}
