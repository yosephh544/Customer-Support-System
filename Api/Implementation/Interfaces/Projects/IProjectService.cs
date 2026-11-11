using Implementation.DTO.Common;
using Implementation.DTO.Projects;

namespace Implementation.Interfaces.Projects;

public interface IProjectService
{
    Task<PagedResult<ProjectSummaryDto>> GetProjectsAsync(ProjectFilterRequest filter);
    Task<ProjectDetailsDto> GetProjectByIdAsync(Guid id);
    Task<List<ProjectSummaryDto>> GetProjectsByOrganizationIdAsync(Guid organizationId);
    Task<ProjectDetailsDto> CreateProjectAsync(CreateProjectDto dto);
    Task<ProjectDetailsDto> UpdateProjectAsync(Guid id, UpdateProjectDto dto);
    Task DeleteProjectAsync(Guid id);
}

