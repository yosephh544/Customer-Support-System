using System.Security.Claims;
using Api.Authorization;
using Implementation.DTO.Common;
using Implementation.DTO.Feedbacks;
using Implementation.DTO.Tickets;
using Implementation.Interfaces.Feedbacks;
using Implementation.Interfaces.Tickets;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Feedbacks;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FeedbacksController : ControllerBase
{
    private readonly IFeedbackService _feedbackService;

    public FeedbacksController(IFeedbackService feedbackService)
    {
        _feedbackService = feedbackService;
    }

    [HttpGet]
    [HasPermission("Feedbacks.View")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<FeedbackDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFeedbacks([FromQuery] FeedbackFilterRequest filter)
    {
        var result = await _feedbackService.GetFeedbacksAsync(filter);
        return Ok(ApiResponse<PagedResult<FeedbackDto>>.SuccessResult(result));
    }

    [HttpGet("analytics")]
    [HasPermission("Feedbacks.View")]
    [ProducesResponseType(typeof(ApiResponse<FeedbackAnalyticsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFeedbackAnalytics()
    {
        var result = await _feedbackService.GetFeedbackAnalyticsAsync();
        return Ok(ApiResponse<FeedbackAnalyticsDto>.SuccessResult(result));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Feedbacks.View")]
    [ProducesResponseType(typeof(ApiResponse<FeedbackDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFeedbackById(Guid id)
    {
        var result = await _feedbackService.GetFeedbackByIdAsync(id);
        return Ok(ApiResponse<FeedbackDto>.SuccessResult(result));
    }

    [HttpGet("by-schedule-item/{scheduleItemId:guid}")]
    [HasPermission("Feedbacks.View")]
    [ProducesResponseType(typeof(ApiResponse<FeedbackDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFeedbackByScheduleItemId(Guid scheduleItemId)
    {
        var result = await _feedbackService.GetFeedbackByScheduleItemIdAsync(scheduleItemId);
        if (result == null)
        {
            return NotFound(ApiResponse.Fail("Feedback not found for this schedule item.", statusCode: StatusCodes.Status404NotFound));
        }
        return Ok(ApiResponse<FeedbackDto>.SuccessResult(result));
    }

    [HttpPost]
    [HasPermission("Feedbacks.Create")]
    [ProducesResponseType(typeof(ApiResponse<FeedbackDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateFeedback([FromBody] CreateFeedbackDto request)
    {
        var result = await _feedbackService.CreateFeedbackAsync(request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<FeedbackDto>.SuccessResult(result, "Customer feedback recorded successfully.", StatusCodes.Status201Created));
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Feedbacks.Edit")]
    [ProducesResponseType(typeof(ApiResponse<FeedbackDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateFeedback(Guid id, [FromBody] UpdateFeedbackDto request)
    {
        var result = await _feedbackService.UpdateFeedbackAsync(id, request);
        return Ok(ApiResponse<FeedbackDto>.SuccessResult(result, "Feedback updated successfully."));
    }

    [HttpPost("{id:guid}/escalate")]
    [HasPermission("Feedbacks.Edit")]
    [ProducesResponseType(typeof(ApiResponse<TicketDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> EscalateFeedback(Guid id, [FromBody] EscalateFeedbackRequest request, [FromServices] ITicketService ticketService)
    {
        var result = await ticketService.EscalateFromFeedbackAsync(id, request, User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<TicketDto>.SuccessResult(result, "Feedback escalated to ticket successfully.", StatusCodes.Status201Created));
    }
}

