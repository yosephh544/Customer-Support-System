using System.ComponentModel.DataAnnotations;
using Implementation.DTO.Common;

namespace Implementation.DTO.UserMgt;

public class UserSummaryDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> Roles { get; set; } = new();
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

    [Required]
    [MinLength(1, ErrorMessage = "At least one role must be assigned.")]
    public List<string> Roles { get; set; } = new();

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
    [Required]
    [MinLength(1, ErrorMessage = "At least one role must be provided.")]
    public List<string> Roles { get; set; } = new();
}

public class UserFilterRequest : PaginationRequest
{
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
}

