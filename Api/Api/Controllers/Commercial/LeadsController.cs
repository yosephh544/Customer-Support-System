using System.Security.Claims;
using Api.Authorization;
using Implementation.DTO.Commercial;
using Implementation.DTO.Common;
using Implementation.Interfaces.Commercial;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Commercial;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeadsController : ControllerBase
{
    private readonly ILeadService _leadService;

    public LeadsController(ILeadService leadService)
    {
        _leadService = leadService;
    }

    private string? CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    [HttpGet]
    [HasPermission("Commercial.View")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<LeadDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLeads([FromQuery] LeadFilterRequest filter)
    {
        var result = await _leadService.GetLeadsAsync(filter);
        return Ok(ApiResponse<PagedResult<LeadDto>>.SuccessResult(result));
    }

    [HttpGet("pipeline-summary")]
    [HasPermission("Commercial.View")]
    [ProducesResponseType(typeof(ApiResponse<LeadPipelineSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPipelineSummary()
    {
        var result = await _leadService.GetPipelineSummaryAsync();
        return Ok(ApiResponse<LeadPipelineSummaryDto>.SuccessResult(result));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Commercial.View")]
    [ProducesResponseType(typeof(ApiResponse<LeadDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLeadById(Guid id)
    {
        var result = await _leadService.GetLeadByIdAsync(id);
        return Ok(ApiResponse<LeadDto>.SuccessResult(result));
    }

    [HttpPost]
    [HasPermission("Commercial.Manage")]
    [ProducesResponseType(typeof(ApiResponse<LeadDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateLead([FromBody] CreateLeadDto request)
    {
        var result = await _leadService.CreateLeadAsync(request, CurrentUserId);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<LeadDto>.SuccessResult(result, "Lead registered successfully.", StatusCodes.Status201Created));
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Commercial.Manage")]
    [ProducesResponseType(typeof(ApiResponse<LeadDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateLead(Guid id, [FromBody] UpdateLeadDto request)
    {
        var result = await _leadService.UpdateLeadAsync(id, request, CurrentUserId);
        return Ok(ApiResponse<LeadDto>.SuccessResult(result, "Lead details updated successfully."));
    }

    [HttpPost("{id:guid}/convert-to-client")]
    [HasPermission("Commercial.Convert")]
    [ProducesResponseType(typeof(ApiResponse<ConvertLeadResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConvertLeadToClient(Guid id, [FromBody] ConvertLeadDto request)
    {
        var result = await _leadService.ConvertLeadToClientAsync(id, request, CurrentUserId);
        return Ok(ApiResponse<ConvertLeadResultDto>.SuccessResult(result, "Lead converted into active Customer Organization & Project successfully."));
    }
}
