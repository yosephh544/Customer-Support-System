namespace Implementation.DTO.Authorization;

public class PermissionDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
}

public class PermissionModuleDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<PermissionDto> Permissions { get; set; } = new();
}

public class PermissionsCatalogDto
{
    public List<PermissionModuleDto> Modules { get; set; } = new();
    public Dictionary<string, List<string>> RoleDefaultPermissions { get; set; } = new();
}

