using Implementation.DTO.Authorization;

namespace Implementation.Interfaces.Authorization;

public interface IRoleService
{
    Task<IReadOnlyList<RoleSummaryDto>> GetRolesAsync();
    Task<RoleSummaryDto> GetRoleByNameAsync(string roleName);
    Task<RoleSummaryDto> CreateRoleAsync(CreateRoleDto request);
    Task UpdateRolePermissionsAsync(UpdateRolePermissionsDto request);
    Task EnsureDefaultRolesAsync();
}

