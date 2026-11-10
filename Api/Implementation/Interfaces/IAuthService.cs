using System.Security.Claims;
using Implementation.DTO;

namespace Implementation.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
    Task<UserProfileDto?> GetUserProfileAsync(ClaimsPrincipal userPrincipal);
}

