using System.Security.Claims;
using Api.Authorization;
using Implementation.DTO.Common;
using Implementation.DTO.Portal;
using Implementation.DTO.Tickets;
using Implementation.Exceptions;
using Implementation.Interfaces.Portal;
using Infrustructure.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Portal;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClientPortalController : ControllerBase
{
    private readonly IPortalService _portalService;

    public ClientPortalController(IPortalService portalService)
    {
        _portalService = portalService;
    }

    private string CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedException("User identity not found in token.");

    private Guid GetEffectiveOrganizationId(Guid? overrideOrgId = null)
    {
        var orgClaim = User.FindFirst("OrganizationId")?.Value;

        // If user is a ClientPortalUser, strictly enforce OrganizationId claim (prevent tenant escaping)
        if (User.IsInRole(AppRoles.ClientPortalUser))
        {
            if (string.IsNullOrWhiteSpace(orgClaim) || !Guid.TryParse(orgClaim, out var clientOrgId))
            {
                throw new ForbiddenException("Client user is not associated with an active organization.");
            }
            return clientOrgId;
        }

        // For internal staff (Admin, Director, TeamLead) previewing portal views
        if (overrideOrgId.HasValue && overrideOrgId.Value != Guid.Empty)
        {
            return overrideOrgId.Value;
        }

        if (!string.IsNullOrWhiteSpace(orgClaim) && Guid.TryParse(orgClaim, out var userOrgId))
        {
            return userOrgId;
        }

        throw new BadRequestException("OrganizationId is required to access portal resources.");
    }

    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(ApiResponse<PortalDashboardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard([FromQuery] Guid? organizationId = null)
    {
        var orgId = GetEffectiveOrganizationId(organizationId);
        var result = await _portalService.GetClientDashboardAsync(orgId);
        return Ok(ApiResponse<PortalDashboardDto>.SuccessResult(result));
    }

    [HttpGet("tickets")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<TicketDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTickets([FromQuery] TicketFilterRequest filter)
    {
        var orgId = GetEffectiveOrganizationId(filter.OrganizationId);
        var result = await _portalService.GetClientTicketsAsync(orgId, filter);
        return Ok(ApiResponse<PagedResult<TicketDto>>.SuccessResult(result));
    }

    [HttpGet("tickets/{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<TicketDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTicketById(Guid id, [FromQuery] Guid? organizationId = null)
    {
        var orgId = GetEffectiveOrganizationId(organizationId);
        var result = await _portalService.GetClientTicketByIdAsync(orgId, id);
        return Ok(ApiResponse<TicketDto>.SuccessResult(result));
    }

    [HttpPost("tickets")]
    [ProducesResponseType(typeof(ApiResponse<TicketDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> SubmitTicket([FromBody] CreatePortalTicketDto request, [FromQuery] Guid? organizationId = null)
    {
        var orgId = GetEffectiveOrganizationId(organizationId);
        var result = await _portalService.SubmitClientTicketAsync(orgId, CurrentUserId, request);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<TicketDto>.SuccessResult(result, "Ticket submitted successfully."));
    }

    [HttpPost("tickets/{id:guid}/messages")]
    [ProducesResponseType(typeof(ApiResponse<TicketMessageDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> AddMessage(Guid id, [FromBody] CreateTicketMessageDto request, [FromQuery] Guid? organizationId = null)
    {
        var orgId = GetEffectiveOrganizationId(organizationId);
        var result = await _portalService.AddClientTicketMessageAsync(orgId, id, CurrentUserId, request.Message);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<TicketMessageDto>.SuccessResult(result, "Reply submitted successfully."));
    }

    [HttpGet("requests")]
    [ProducesResponseType(typeof(ApiResponse<List<PortalServiceRequestDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetServiceRequests([FromQuery] Guid? organizationId = null)
    {
        var orgId = GetEffectiveOrganizationId(organizationId);
        var result = await _portalService.GetClientServiceRequestsAsync(orgId);
        return Ok(ApiResponse<List<PortalServiceRequestDto>>.SuccessResult(result));
    }

    [HttpPost("requests")]
    [ProducesResponseType(typeof(ApiResponse<PortalServiceRequestDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> SubmitServiceRequest([FromBody] CreatePortalServiceRequestDto request, [FromQuery] Guid? organizationId = null)
    {
        var orgId = GetEffectiveOrganizationId(organizationId);
        var result = await _portalService.SubmitServiceRequestAsync(orgId, CurrentUserId, request);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<PortalServiceRequestDto>.SuccessResult(result, "Service expansion request submitted successfully."));
    }

    [HttpPut("requests/{id:guid}/review")]
    [Authorize(Roles = "Admin,Director,TeamLead")]
    [ProducesResponseType(typeof(ApiResponse<PortalServiceRequestDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ReviewServiceRequest(Guid id, [FromBody] ReviewPortalServiceRequestDto request)
    {
        var result = await _portalService.ReviewServiceRequestAsync(id, request, CurrentUserId);
        return Ok(ApiResponse<PortalServiceRequestDto>.SuccessResult(result, "Service request reviewed successfully."));
    }
}
