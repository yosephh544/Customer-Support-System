using System.ComponentModel.DataAnnotations;

namespace Implementation.DTO.Authorization;

public class RoleSummaryDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int UserCount { get; set; }
    public int PermissionCount { get; set; }
    public List<string> Permissions { get; set; } = new();
}

public class CreateRoleDto
{
    [Required]
    [MaxLength(50)]
    public string RoleName { get; set; } = string.Empty;

    public List<string> Permissions { get; set; } = new();
}

public class UpdateRolePermissionsDto
{
    [Required]
    public string RoleName { get; set; } = string.Empty;

    [Required]
    public List<string> Permissions { get; set; } = new();
}

