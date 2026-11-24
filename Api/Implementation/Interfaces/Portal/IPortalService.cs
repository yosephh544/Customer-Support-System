using Implementation.DTO.Common;
using Implementation.DTO.Portal;
using Implementation.DTO.Tickets;

namespace Implementation.Interfaces.Portal;

public interface IPortalService
{
    Task<PortalDashboardDto> GetClientDashboardAsync(Guid organizationId);
    Task<PagedResult<TicketDto>> GetClientTicketsAsync(Guid organizationId, TicketFilterRequest filter);
    Task<TicketDto> SubmitClientTicketAsync(Guid organizationId, string userId, CreatePortalTicketDto request);
    Task<TicketDto> GetClientTicketByIdAsync(Guid organizationId, Guid ticketId);
    Task<TicketMessageDto> AddClientTicketMessageAsync(Guid organizationId, Guid ticketId, string userId, string message);
    Task<List<PortalServiceRequestDto>> GetClientServiceRequestsAsync(Guid organizationId);
    Task<PortalServiceRequestDto> SubmitServiceRequestAsync(Guid organizationId, string userId, CreatePortalServiceRequestDto request);
    Task<PortalServiceRequestDto> ReviewServiceRequestAsync(Guid requestId, ReviewPortalServiceRequestDto request, string reviewerUserId);
}
