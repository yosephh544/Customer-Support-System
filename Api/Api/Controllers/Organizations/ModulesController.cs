using Api.Authorization;
using Implementation.DTO.Common;
using Implementation.DTO.Modules;
using Implementation.Interfaces.Modules;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Organizations;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ModulesController : ControllerBase
{
    private readonly IModuleService _moduleService;

    public ModulesController(IModuleService moduleService)
    {
        _moduleService = moduleService;
    }

    [HttpGet]
    [HasPermission("Modules.View")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<MasterModuleDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMasterModules([FromQuery] MasterModuleFilterRequest filter)
    {
        var result = await _moduleService.GetMasterModulesAsync(filter);
        return Ok(ApiResponse<PagedResult<MasterModuleDto>>.SuccessResult(result));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Modules.View")]
    [ProducesResponseType(typeof(ApiResponse<MasterModuleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMasterModuleById(Guid id)
    {
        var result = await _moduleService.GetMasterModuleByIdAsync(id);
        return Ok(ApiResponse<MasterModuleDto>.SuccessResult(result));
    }

    [HttpPost]
    [HasPermission("Modules.Create")]
    [ProducesResponseType(typeof(ApiResponse<MasterModuleDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateMasterModule([FromBody] CreateMasterModuleDto request)
    {
        var result = await _moduleService.CreateMasterModuleAsync(request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<MasterModuleDto>.SuccessResult(result, "Master module created successfully.", StatusCodes.Status201Created));
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Modules.Edit")]
    [ProducesResponseType(typeof(ApiResponse<MasterModuleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateMasterModule(Guid id, [FromBody] UpdateMasterModuleDto request)
    {
        var result = await _moduleService.UpdateMasterModuleAsync(id, request);
        return Ok(ApiResponse<MasterModuleDto>.SuccessResult(result, "Master module updated successfully."));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Modules.Delete")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteMasterModule(Guid id)
    {
        await _moduleService.DeleteMasterModuleAsync(id);
        return Ok(ApiResponse.SuccessResult("Master module deleted successfully."));
    }
}

