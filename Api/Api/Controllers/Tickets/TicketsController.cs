using System.Security.Claims;
using Api.Authorization;
using Implementation.DTO.Common;
using Implementation.DTO.Tickets;
using Implementation.Interfaces.Tickets;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Tickets;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    private string? CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    [HttpGet]
    [HasPermission("Tickets.View")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<TicketDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTickets([FromQuery] TicketFilterRequest filter)
    {
        var result = await _ticketService.GetTicketsAsync(filter);
        return Ok(ApiResponse<PagedResult<TicketDto>>.SuccessResult(result));
    }

    [HttpGet("analytics")]
    [HasPermission("Tickets.View")]
    [ProducesResponseType(typeof(ApiResponse<TicketAnalyticsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTicketAnalytics()
    {
        var result = await _ticketService.GetAnalyticsAsync();
        return Ok(ApiResponse<TicketAnalyticsDto>.SuccessResult(result));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Tickets.View")]
    [ProducesResponseType(typeof(ApiResponse<TicketDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTicketById(Guid id)
    {
        var result = await _ticketService.GetTicketByIdAsync(id);
        return Ok(ApiResponse<TicketDto>.SuccessResult(result));
    }

    [HttpPost]
    [HasPermission("Tickets.Create")]
    [ProducesResponseType(typeof(ApiResponse<TicketDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateTicket([FromBody] CreateTicketDto request)
    {
        var result = await _ticketService.CreateTicketAsync(request, CurrentUserId);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<TicketDto>.SuccessResult(result, "Support ticket logged successfully.", StatusCodes.Status201Created));
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Tickets.Edit")]
    [ProducesResponseType(typeof(ApiResponse<TicketDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateTicket(Guid id, [FromBody] UpdateTicketDto request)
    {
        var result = await _ticketService.UpdateTicketAsync(id, request, CurrentUserId);
        return Ok(ApiResponse<TicketDto>.SuccessResult(result, "Ticket updated successfully."));
    }

    [HttpPost("{id:guid}/assign")]
    [HasPermission("Tickets.Assign")]
    [ProducesResponseType(typeof(ApiResponse<TicketDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignTicket(Guid id, [FromBody] AssignTicketDto request)
    {
        var result = await _ticketService.AssignTicketAsync(id, request, CurrentUserId);
        return Ok(ApiResponse<TicketDto>.SuccessResult(result, "Ticket assigned successfully."));
    }

    [HttpPost("{id:guid}/resolve")]
    [HasPermission("Tickets.Resolve")]
    [ProducesResponseType(typeof(ApiResponse<TicketDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResolveTicket(Guid id, [FromBody] ResolveTicketDto request)
    {
        var result = await _ticketService.ResolveTicketAsync(id, request, CurrentUserId);
        return Ok(ApiResponse<TicketDto>.SuccessResult(result, "Ticket marked as resolved."));
    }

    [HttpPost("escalate-from-feedback/{feedbackId:guid}")]
    [HasPermission("Tickets.Create")]
    [ProducesResponseType(typeof(ApiResponse<TicketDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EscalateFromFeedback(Guid feedbackId, [FromBody] EscalateFeedbackRequest request)
    {
        var result = await _ticketService.EscalateFromFeedbackAsync(feedbackId, request, CurrentUserId);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<TicketDto>.SuccessResult(result, "Proactive feedback successfully escalated to reactive ticket.", StatusCodes.Status201Created));
    }

    [HttpGet("{id:guid}/messages")]
    [HasPermission("Tickets.View")]
    [ProducesResponseType(typeof(ApiResponse<List<TicketMessageDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTicketMessages(Guid id, [FromQuery] bool includeInternalNotes = true)
    {
        var result = await _ticketService.GetMessagesAsync(id, includeInternalNotes);
        return Ok(ApiResponse<List<TicketMessageDto>>.SuccessResult(result));
    }

    [HttpPost("{id:guid}/messages")]
    [HasPermission("Tickets.View")]
    [ProducesResponseType(typeof(ApiResponse<TicketMessageDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddTicketMessage(Guid id, [FromBody] CreateTicketMessageDto request)
    {
        if (string.IsNullOrWhiteSpace(CurrentUserId))
        {
            return Unauthorized(ApiResponse.Fail("User identity could not be verified."));
        }

        var result = await _ticketService.AddMessageAsync(id, request, CurrentUserId);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<TicketMessageDto>.SuccessResult(result, "Message posted successfully.", StatusCodes.Status201Created));
    }
}
