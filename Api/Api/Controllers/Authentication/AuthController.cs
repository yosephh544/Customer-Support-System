using Implementation.DTO;
using Implementation.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Authentication;

[ApiController]
[Route("api/[controller]")]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthSuccessResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthFailureResponseDto), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        // Apply Cache-Control: no-store to protect sensitive authentication responses
        Response.Headers.CacheControl = "no-store, no-cache";
        Response.Headers.Pragma = "no-cache";

        var result = await _authService.LoginAsync(request);
        if (!result.Success || result.TokenData == null || result.User == null)
        {
            return Unauthorized(new AuthFailureResponseDto
            {
                Success = false,
                Message = string.IsNullOrWhiteSpace(result.Message) ? "Invalid username or password." : result.Message
            });
        }

        return Ok(new AuthSuccessResponseDto
        {
            Success = true,
            Message = string.IsNullOrWhiteSpace(result.Message) ? "Login successful." : result.Message,
            TokenData = result.TokenData,
            User = result.User
        });
    }
}
