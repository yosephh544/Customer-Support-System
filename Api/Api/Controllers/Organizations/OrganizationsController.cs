using Api.Authorization;
using Implementation.DTO.Common;
using Implementation.DTO.Organizations;
using Implementation.Interfaces.Organizations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Organizations;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrganizationsController : ControllerBase
{
    private readonly IOrganizationService _organizationService;

    public OrganizationsController(IOrganizationService organizationService)
    {
        _organizationService = organizationService;
    }

    [HttpGet]
    [HasPermission("Organizations.View")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<OrganizationSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrganizations([FromQuery] OrganizationFilterRequest filter)
    {
        var result = await _organizationService.GetOrganizationsAsync(filter);
        return Ok(ApiResponse<PagedResult<OrganizationSummaryDto>>.SuccessResult(result));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Organizations.View")]
    [ProducesResponseType(typeof(ApiResponse<OrganizationDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrganizationById(Guid id)
    {
        var result = await _organizationService.GetOrganizationByIdAsync(id);
        return Ok(ApiResponse<OrganizationDetailsDto>.SuccessResult(result));
    }

    [HttpPost]
    [HasPermission("Organizations.Create")]
    [ProducesResponseType(typeof(ApiResponse<OrganizationDetailsDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateOrganization([FromBody] CreateOrganizationDto request)
    {
        var result = await _organizationService.CreateOrganizationAsync(request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<OrganizationDetailsDto>.SuccessResult(result, "Organization created successfully.", StatusCodes.Status201Created));
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Organizations.Edit")]
    [ProducesResponseType(typeof(ApiResponse<OrganizationDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateOrganization(Guid id, [FromBody] UpdateOrganizationDto request)
    {
        var result = await _organizationService.UpdateOrganizationAsync(id, request);
        return Ok(ApiResponse<OrganizationDetailsDto>.SuccessResult(result, "Organization updated successfully."));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Organizations.Delete")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteOrganization(Guid id)
    {
        await _organizationService.DeleteOrganizationAsync(id);
        return Ok(ApiResponse.SuccessResult("Organization deleted successfully."));
    }
}

