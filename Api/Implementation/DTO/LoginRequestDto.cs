using System.ComponentModel.DataAnnotations;
using Implementation.Helpers;

namespace Implementation.DTO;

public class LoginRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;

    public string GetDecryptedPassword() => SecurityHelper.DecryptIfEncrypted(Password);
}

