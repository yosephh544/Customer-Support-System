using Implementation.DTO.Common;
using Implementation.DTO.Modules;

namespace Implementation.Interfaces.Modules;

public interface IModuleService
{
    // Project Modules
    Task<List<ProjectModuleDto>> GetModulesByProjectIdAsync(Guid projectId);
    Task<ProjectModuleDto> GetProjectModuleByIdAsync(Guid projectId, Guid moduleId);
    Task<ProjectModuleDto> AssignModuleToProjectAsync(Guid projectId, AssignProjectModuleDto dto);
    Task<ProjectModuleDto> UpdateProjectModuleAsync(Guid projectId, Guid moduleId, UpdateProjectModuleDto dto);
    Task RemoveModuleFromProjectAsync(Guid projectId, Guid moduleId);
}

