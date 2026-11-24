using Implementation.DTO.Commercial;
using Implementation.DTO.Common;

namespace Implementation.Interfaces.Commercial;

public interface ILeadService
{
    Task<PagedResult<LeadDto>> GetLeadsAsync(LeadFilterRequest filter);
    Task<LeadDto> GetLeadByIdAsync(Guid id);
    Task<LeadDto> CreateLeadAsync(CreateLeadDto request, string? currentUserId);
    Task<LeadDto> UpdateLeadAsync(Guid id, UpdateLeadDto request, string? currentUserId);
    Task<LeadDto> SubmitPublicLeadAsync(PublicLeadSubmissionDto request);
    Task<ConvertLeadResultDto> ConvertLeadToClientAsync(Guid leadId, ConvertLeadDto request, string? currentUserId);
    Task<LeadPipelineSummaryDto> GetPipelineSummaryAsync();
}
