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

    public async Task<AuthResultDto> RegisterAsync(RegisterRequestDto request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return new AuthResultDto
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
            return new AuthResultDto
            {
                Success = false,
                Message = $"Registration failed: {errors}"
            };
        }

        var (token, expiration) = GenerateJwtToken(user);

        return new AuthResultDto
        {
            Success = true,
            Message = "User registered successfully.",
            TokenData = new AuthTokenDto
            {
                Token = token,
                Expiration = expiration
            },
            User = new AuthUserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                Role = user.Role.ToString()
            }
        };
    }

    public async Task<AuthResultDto> LoginAsync(LoginRequestDto request)
    {
        var identifier = (request.Username ?? request.Email ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(identifier))
        {
            return new AuthResultDto
            {
                Success = false,
                Message = "Invalid username or password."
            };
        }

        var user = await _userManager.FindByNameAsync(identifier)
                ?? await _userManager.FindByEmailAsync(identifier);

        // Identical generic error message to prevent user enumeration
        if (user == null || !user.IsActive)
        {
            return new AuthResultDto
            {
                Success = false,
                Message = "Invalid username or password."
            };
        }

        // Account lockout check for brute-force protection
        if (await _userManager.IsLockedOutAsync(user))
        {
            return new AuthResultDto
            {
                Success = false,
                Message = "Account is temporarily locked due to multiple failed login attempts. Please try again later."
            };
        }

        var decryptedPassword = request.GetDecryptedPassword();
        var isPasswordValid = await _userManager.CheckPasswordAsync(user, decryptedPassword);
        if (!isPasswordValid)
        {
            // Record failed attempt for brute-force lockout policy
            await _userManager.AccessFailedAsync(user);

            return new AuthResultDto
            {
                Success = false,
                Message = "Invalid username or password."
            };
        }

        // Reset failed attempt counter upon successful login
        await _userManager.ResetAccessFailedCountAsync(user);

        var (token, expiration) = GenerateJwtToken(user);

        return new AuthResultDto
        {
            Success = true,
            Message = "Login successful.",
            TokenData = new AuthTokenDto
            {
                Token = token,
                Expiration = expiration
            },
            User = new AuthUserDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                Role = user.Role.ToString()
            }
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
