using System.ComponentModel.DataAnnotations;

namespace Implementation.DTO.Authorization;

public class UserPermissionsDto
{
    public string UserId { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public List<string> Roles => string.IsNullOrEmpty(Role) ? new() : new() { Role };
    public List<string> RolePermissions { get; set; } = new();
    public List<string> DirectPermissions { get; set; } = new();
    public List<string> EffectivePermissions { get; set; } = new();
}

public class UpdateUserPermissionsDto
{
    [Required]
    public List<string> Permissions { get; set; } = new();
}

