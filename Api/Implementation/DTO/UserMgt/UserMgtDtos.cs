using System.ComponentModel.DataAnnotations;
using Implementation.DTO.Common;
using Infrustructure.Enums;

namespace Implementation.DTO.UserMgt;

public class UserSummaryDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string Role { get; set; } = string.Empty;
    public List<string> Roles => string.IsNullOrEmpty(Role) ? new() : new() { Role };
}

public class UserDetailsDto : UserSummaryDto
{
    public List<string> DirectPermissions { get; set; } = new();
    public List<string> EffectivePermissions { get; set; } = new();
}

public class CreateUserDto
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
    public string Password { get; set; } = string.Empty;

    [Phone]
    public string? PhoneNumber { get; set; }

    public UserRole Role { get; set; } = UserRole.SupportAgent;

    public List<string>? Roles { get; set; }

    public List<string> DirectPermissions { get; set; } = new();
}

public class UpdateUserDto
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Phone]
    public string? PhoneNumber { get; set; }

    public bool IsActive { get; set; } = true;
}

public class UpdateUserRolesDto
{
    public UserRole? Role { get; set; }
    public List<string>? Roles { get; set; }
}

public class UserFilterRequest : PaginationRequest
{
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
}

