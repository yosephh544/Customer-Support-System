using Implementation.DTO.Common;
using Implementation.DTO.Organizations;

namespace Implementation.Interfaces.Organizations;

public interface IOrganizationService
{
    Task<PagedResult<OrganizationSummaryDto>> GetOrganizationsAsync(OrganizationFilterRequest filter);
    Task<OrganizationDetailsDto> GetOrganizationByIdAsync(Guid id);
    Task<OrganizationDetailsDto> CreateOrganizationAsync(CreateOrganizationDto dto);
    Task<OrganizationDetailsDto> UpdateOrganizationAsync(Guid id, UpdateOrganizationDto dto);
    Task DeleteOrganizationAsync(Guid id);
}

