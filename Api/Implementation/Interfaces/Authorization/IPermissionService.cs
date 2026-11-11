using Implementation.DTO.Authorization;

namespace Implementation.Interfaces.Authorization;

public interface IPermissionService
{
    Task<PermissionsCatalogDto> GetCatalogAsync();
    Task<IReadOnlyList<string>> GetAllPermissionIdsAsync();
    Task<IReadOnlyList<string>> GetRolePermissionsAsync(string roleName);
    Task<Dictionary<string, List<string>>> GetRolePermissionMatrixAsync();
    Task UpdateRolePermissionsAsync(string roleName, IEnumerable<string> permissions);
    Task<UserPermissionsDto> GetUserPermissionsAsync(string userId);
    Task<IReadOnlyList<string>> GetUserDirectPermissionsAsync(string userId);
    Task<IReadOnlyList<string>> GetUserEffectivePermissionsAsync(string userId);
    Task<bool> HasPermissionAsync(string userId, string permission);
    Task SetUserDirectPermissionsAsync(string userId, IEnumerable<string> permissions);
    Task ReloadPermissionsAsync();
}

