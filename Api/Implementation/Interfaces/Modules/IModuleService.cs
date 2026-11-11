using Implementation.DTO.Common;
using Implementation.DTO.Modules;

namespace Implementation.Interfaces.Modules;

public interface IModuleService
{
    // Master Modules Catalog
    Task<PagedResult<MasterModuleDto>> GetMasterModulesAsync(MasterModuleFilterRequest filter);
    Task<MasterModuleDto> GetMasterModuleByIdAsync(Guid id);
    Task<MasterModuleDto> CreateMasterModuleAsync(CreateMasterModuleDto dto);
    Task<MasterModuleDto> UpdateMasterModuleAsync(Guid id, UpdateMasterModuleDto dto);
    Task DeleteMasterModuleAsync(Guid id);

    // Project Module Assignments
    Task<List<ProjectModuleDto>> GetModulesByProjectIdAsync(Guid projectId);
    Task<ProjectModuleDto> GetProjectModuleByIdAsync(Guid projectId, Guid moduleId);
    Task<ProjectModuleDto> AssignModuleToProjectAsync(Guid projectId, AssignProjectModuleDto dto);
    Task<ProjectModuleDto> UpdateProjectModuleAsync(Guid projectId, Guid moduleId, UpdateProjectModuleDto dto);
    Task RemoveModuleFromProjectAsync(Guid projectId, Guid moduleId);
}

