using System.Security.Claims;
using Api.Authorization;
using Implementation.DTO.Common;
using Implementation.DTO.Schedules;
using Implementation.Interfaces.Schedules;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Schedules;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SchedulesController : ControllerBase
{
    private readonly IScheduleService _scheduleService;

    public SchedulesController(IScheduleService scheduleService)
    {
        _scheduleService = scheduleService;
    }

    #region Weekly Schedules CRUD

    [HttpGet]
    [HasPermission("Schedules.View")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<WeeklyScheduleSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSchedules([FromQuery] ScheduleFilterRequest filter)
    {
        var result = await _scheduleService.GetSchedulesAsync(filter);
        return Ok(ApiResponse<PagedResult<WeeklyScheduleSummaryDto>>.SuccessResult(result));
    }

    [HttpGet("current")]
    [HasPermission("Schedules.View")]
    [ProducesResponseType(typeof(ApiResponse<WeeklyScheduleDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCurrentWeekSchedule()
    {
        var result = await _scheduleService.GetCurrentWeekScheduleAsync();
        return Ok(ApiResponse<WeeklyScheduleDetailsDto>.SuccessResult(result));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Schedules.View")]
    [ProducesResponseType(typeof(ApiResponse<WeeklyScheduleDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetScheduleById(Guid id)
    {
        var result = await _scheduleService.GetScheduleByIdAsync(id);
        return Ok(ApiResponse<WeeklyScheduleDetailsDto>.SuccessResult(result));
    }

    [HttpPost]
    [HasPermission("Schedules.Create")]
    [ProducesResponseType(typeof(ApiResponse<WeeklyScheduleDetailsDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateSchedule([FromBody] CreateWeeklyScheduleDto request)
    {
        var result = await _scheduleService.CreateScheduleAsync(request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<WeeklyScheduleDetailsDto>.SuccessResult(result, "Weekly schedule created successfully.", StatusCodes.Status201Created));
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Schedules.Create")]
    [ProducesResponseType(typeof(ApiResponse<WeeklyScheduleDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSchedule(Guid id, [FromBody] UpdateWeeklyScheduleDto request)
    {
        var result = await _scheduleService.UpdateScheduleAsync(id, request);
        return Ok(ApiResponse<WeeklyScheduleDetailsDto>.SuccessResult(result, "Weekly schedule updated successfully."));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Schedules.Create")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSchedule(Guid id)
    {
        await _scheduleService.DeleteScheduleAsync(id);
        return Ok(ApiResponse.SuccessResult("Weekly schedule deleted successfully."));
    }

    [HttpPost("{id:guid}/generate")]
    [HasPermission("Schedules.Create")]
    [ProducesResponseType(typeof(ApiResponse<WeeklyScheduleDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GenerateScheduleItems(Guid id)
    {
        var result = await _scheduleService.GenerateScheduleItemsAsync(id);
        return Ok(ApiResponse<WeeklyScheduleDetailsDto>.SuccessResult(result, "Weekly touchpoint schedule generated successfully based on project and module assignments."));
    }

    #endregion

    #region Schedule Items (Touchpoints)

    [HttpGet("{scheduleId:guid}/items")]
    [HasPermission("Schedules.View")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ScheduleItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetScheduleItems(Guid scheduleId, [FromQuery] ScheduleItemFilterRequest filter)
    {
        filter.WeeklyScheduleId = scheduleId;
        var result = await _scheduleService.GetScheduleItemsAsync(filter);
        return Ok(ApiResponse<PagedResult<ScheduleItemDto>>.SuccessResult(result));
    }

    [HttpGet("items/{itemId:guid}")]
    [HasPermission("Schedules.View")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetScheduleItemById(Guid itemId)
    {
        var result = await _scheduleService.GetScheduleItemByIdAsync(itemId);
        return Ok(ApiResponse<ScheduleItemDto>.SuccessResult(result));
    }

    [HttpGet("my-items")]
    [HasPermission("Schedules.View")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ScheduleItemDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyScheduleItems([FromQuery] ScheduleItemFilterRequest filter)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserId))
        {
            return Unauthorized(ApiResponse.Fail("User is not authenticated.", statusCode: StatusCodes.Status401Unauthorized));
        }

        var result = await _scheduleService.GetMyScheduleItemsAsync(currentUserId, filter);
        return Ok(ApiResponse<PagedResult<ScheduleItemDto>>.SuccessResult(result));
    }

    [HttpPost("{scheduleId:guid}/items")]
    [HasPermission("Schedules.Assign")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleItemDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateScheduleItem(Guid scheduleId, [FromBody] CreateScheduleItemDto request)
    {
        var result = await _scheduleService.CreateScheduleItemAsync(scheduleId, request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<ScheduleItemDto>.SuccessResult(result, "Schedule item assigned successfully.", StatusCodes.Status201Created));
    }

    [HttpPut("items/{itemId:guid}")]
    [HasPermission("Schedules.Assign")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateScheduleItem(Guid itemId, [FromBody] UpdateScheduleItemDto request)
    {
        var result = await _scheduleService.UpdateScheduleItemAsync(itemId, request);
        return Ok(ApiResponse<ScheduleItemDto>.SuccessResult(result, "Schedule item updated successfully."));
    }

    [HttpPatch("items/{itemId:guid}/status")]
    [HasPermission("Schedules.Execute")]
    [ProducesResponseType(typeof(ApiResponse<ScheduleItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateScheduleItemStatus(Guid itemId, [FromBody] UpdateScheduleItemStatusDto request)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        var result = await _scheduleService.UpdateScheduleItemStatusAsync(itemId, currentUserId, request);
        return Ok(ApiResponse<ScheduleItemDto>.SuccessResult(result, "Schedule item status updated successfully."));
    }

    [HttpDelete("items/{itemId:guid}")]
    [HasPermission("Schedules.Assign")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteScheduleItem(Guid itemId)
    {
        await _scheduleService.DeleteScheduleItemAsync(itemId);
        return Ok(ApiResponse.SuccessResult("Schedule item deleted successfully."));
    }

    #endregion
}

