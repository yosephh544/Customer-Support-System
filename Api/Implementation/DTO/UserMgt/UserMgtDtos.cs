using System.ComponentModel.DataAnnotations;
using Implementation.DTO.Common;
using Implementation.Helpers;
using Infrustructure.Enums;

namespace Implementation.DTO.UserMgt;

public class UserSummaryDto
{
    public string Id { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
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

    [Required(ErrorMessage = "Username is required.")]
    [MaxLength(100)]
    public string UserName { get; set; } = string.Empty;

    [EmailAddress]
    public string? Email { get; set; }

    [Required]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
    public string Password { get; set; } = string.Empty;

    [Phone]
    public string? PhoneNumber { get; set; }

    public UserRole Role { get; set; } = UserRole.SupportAgent;

    public List<string>? Roles { get; set; }

    public List<string> DirectPermissions { get; set; } = new();

    public string GetDecryptedPassword() => SecurityHelper.DecryptIfEncrypted(Password);

    public List<string> GetDecryptedDirectPermissions() => SecurityHelper.DecryptList(DirectPermissions);
}

public class UpdateUserDto
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    public string? UserName { get; set; }

    [EmailAddress]
    public string? Email { get; set; }

    [Phone]
    public string? PhoneNumber { get; set; }

    public UserRole? Role { get; set; }

    public string? Password { get; set; }

    public bool IsActive { get; set; } = true;

    public string GetDecryptedPassword() => string.IsNullOrEmpty(Password) ? string.Empty : SecurityHelper.DecryptIfEncrypted(Password);
}

public class ChangePasswordDto
{
    [Required(ErrorMessage = "New password is required.")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
    public string NewPassword { get; set; } = string.Empty;

    public string GetDecryptedPassword() => SecurityHelper.DecryptIfEncrypted(NewPassword);
}

public class UpdateMyProfileDto
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    public string? UserName { get; set; }

    [EmailAddress]
    public string? Email { get; set; }

    [Phone]
    public string? PhoneNumber { get; set; }

    public string? Password { get; set; }

    public string GetDecryptedPassword() => string.IsNullOrEmpty(Password) ? string.Empty : SecurityHelper.DecryptIfEncrypted(Password);
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

