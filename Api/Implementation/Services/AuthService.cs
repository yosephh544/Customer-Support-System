using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Implementation.DTO;
using Implementation.Helpers;
using Implementation.Interfaces;
using Infrustructure.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Implementation.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly JwtSettings _jwtSettings;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        IOptions<JwtSettings> jwtOptions)
    {
        _userManager = userManager;
        _jwtSettings = jwtOptions.Value;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return new AuthResponseDto
            {
                Success = false,
                Message = "A user with this email already exists."
            };
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            Role = request.Role,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return new AuthResponseDto
            {
                Success = false,
                Message = $"Registration failed: {errors}"
            };
        }

        var (token, expiration) = GenerateJwtToken(user);

        return new AuthResponseDto
        {
            Success = true,
            Message = "User registered successfully.",
            Token = token,
            Expiration = expiration,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString()
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        var identifier = (request.Username ?? request.Email ?? string.Empty).Trim();
        var user = await _userManager.FindByNameAsync(identifier)
                ?? await _userManager.FindByEmailAsync(identifier);

        if (user == null || !user.IsActive)
        {
            return new AuthResponseDto
            {
                Success = false,
                Message = "Invalid username or password."
            };
        }

        var decryptedPassword = request.GetDecryptedPassword();
        var isPasswordValid = await _userManager.CheckPasswordAsync(user, decryptedPassword);
        if (!isPasswordValid)
        {
            return new AuthResponseDto
            {
                Success = false,
                Message = "Invalid username or password."
            };
        }

        var (token, expiration) = GenerateJwtToken(user);

        return new AuthResponseDto
        {
            Success = true,
            Message = "Login successful.",
            Token = token,
            Expiration = expiration,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString()
        };
    }

    public async Task<UserProfileDto?> GetUserProfileAsync(ClaimsPrincipal userPrincipal)
    {
        var userId = userPrincipal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return null;
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return null;
        }

        return new UserProfileDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            Role = user.Role.ToString(),
            CreatedAt = user.CreatedAt
        };
    }

    private (string token, DateTime expiration) GenerateJwtToken(ApplicationUser user)
    {
        var expiration = DateTime.UtcNow.AddHours(_jwtSettings.ExpiryInHours);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, user.Role.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiration,
            Issuer = _jwtSettings.Issuer,
            Audience = _jwtSettings.Audience,
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return (tokenHandler.WriteToken(token), expiration);
    }
}

