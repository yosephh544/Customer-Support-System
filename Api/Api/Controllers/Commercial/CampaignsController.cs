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
public class CampaignsController : ControllerBase
{
    private readonly ICampaignService _campaignService;

    public CampaignsController(ICampaignService campaignService)
    {
        _campaignService = campaignService;
    }

    [HttpGet]
    [HasPermission("Commercial.View")]
    [ProducesResponseType(typeof(ApiResponse<List<CampaignDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCampaigns()
    {
        var result = await _campaignService.GetCampaignsAsync();
        return Ok(ApiResponse<List<CampaignDto>>.SuccessResult(result));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Commercial.View")]
    [ProducesResponseType(typeof(ApiResponse<CampaignDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCampaignById(Guid id)
    {
        var result = await _campaignService.GetCampaignByIdAsync(id);
        return Ok(ApiResponse<CampaignDto>.SuccessResult(result));
    }

    [HttpPost]
    [HasPermission("Commercial.Manage")]
    [ProducesResponseType(typeof(ApiResponse<CampaignDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateCampaign([FromBody] CreateCampaignDto request)
    {
        var result = await _campaignService.CreateCampaignAsync(request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<CampaignDto>.SuccessResult(result, "Campaign created successfully.", StatusCodes.Status201Created));
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Commercial.Manage")]
    [ProducesResponseType(typeof(ApiResponse<CampaignDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateCampaign(Guid id, [FromBody] UpdateCampaignDto request)
    {
        var result = await _campaignService.UpdateCampaignAsync(id, request);
        return Ok(ApiResponse<CampaignDto>.SuccessResult(result, "Campaign updated successfully."));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Commercial.Manage")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCampaign(Guid id)
    {
        await _campaignService.DeleteCampaignAsync(id);
        return Ok(ApiResponse.Ok("Campaign deleted successfully."));
    }
}
