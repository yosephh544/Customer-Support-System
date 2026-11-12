using System.Security.Claims;
using Implementation.DTO;

namespace Implementation.Interfaces;

public interface IAuthService
{
    Task<AuthResultDto> RegisterAsync(RegisterRequestDto request);
    Task<AuthResultDto> LoginAsync(LoginRequestDto request);
    Task<UserProfileDto?> GetUserProfileAsync(ClaimsPrincipal userPrincipal);
}
