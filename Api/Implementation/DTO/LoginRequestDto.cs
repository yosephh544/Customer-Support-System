using System.ComponentModel.DataAnnotations;
using Implementation.Helpers;

namespace Implementation.DTO;

public class LoginRequestDto
{
    [Required]
    public string Username { get; set; } = string.Empty;

    public string? Email
    {
        get => Username;
        set { if (!string.IsNullOrWhiteSpace(value) && string.IsNullOrWhiteSpace(Username)) Username = value; }
    }

    public string? UsernameOrEmail
    {
        get => Username;
        set { if (!string.IsNullOrWhiteSpace(value) && string.IsNullOrWhiteSpace(Username)) Username = value; }
    }

    [Required]
    public string Password { get; set; } = string.Empty;

    public string GetDecryptedPassword() => SecurityHelper.DecryptIfEncrypted(Password);
}

