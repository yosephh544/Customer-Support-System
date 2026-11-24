using Implementation.DTO.Common;
using Implementation.DTO.Tickets;

namespace Implementation.Interfaces.Tickets;

public interface ITicketService
{
    Task<PagedResult<TicketDto>> GetTicketsAsync(TicketFilterRequest filter);
    Task<TicketDto> GetTicketByIdAsync(Guid id);
    Task<TicketDto> CreateTicketAsync(CreateTicketDto request, string? currentUserId);
    Task<TicketDto> UpdateTicketAsync(Guid id, UpdateTicketDto request, string? currentUserId);
    Task<TicketDto> AssignTicketAsync(Guid id, AssignTicketDto request, string? currentUserId);
    Task<TicketDto> ResolveTicketAsync(Guid id, ResolveTicketDto request, string? currentUserId);
    Task<TicketDto> EscalateFromFeedbackAsync(Guid feedbackId, EscalateFeedbackRequest request, string? currentUserId);
    Task<TicketMessageDto> AddMessageAsync(Guid ticketId, CreateTicketMessageDto request, string currentUserId);
    Task<List<TicketMessageDto>> GetMessagesAsync(Guid ticketId, bool includeInternalNotes);
    Task<TicketAnalyticsDto> GetAnalyticsAsync();
}
