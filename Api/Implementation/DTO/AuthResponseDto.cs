using System.Text.Json.Serialization;

namespace Implementation.DTO;

/// <summary>
/// Failed authentication response: strictly minimized to generic success flag and generic message.
/// Zero internal properties or null fields are returned to prevent user enumeration.
/// </summary>
public class AuthFailureResponseDto
{
    public bool Success { get; set; } = false;
    public string Message { get; set; } = "Invalid username or password.";
}

/// <summary>
/// Dedicated authentication token payload (separated from user profile data).
/// </summary>
public class AuthTokenDto
{
    public string Token { get; set; } = string.Empty;
    public DateTime Expiration { get; set; }
}

/// <summary>
/// Dedicated minimal user identity details required by the client.
/// </summary>
public class AuthUserDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

/// <summary>
/// Successful authentication response: clearly separates authentication token data from user profile data.
/// </summary>
public class AuthSuccessResponseDto
{
    public bool Success { get; set; } = true;
    public string Message { get; set; } = "Login successful.";
    public AuthTokenDto TokenData { get; set; } = new();
    public AuthUserDto User { get; set; } = new();
}

/// <summary>
/// Internal service operation result for authentication.
/// </summary>
public class AuthResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public AuthTokenDto? TokenData { get; set; }
    public AuthUserDto? User { get; set; }
}

/// <summary>
/// Legacy alias pointing to AuthResultDto for internal operations.
/// </summary>
public class AuthResponseDto : AuthResultDto
{
}
