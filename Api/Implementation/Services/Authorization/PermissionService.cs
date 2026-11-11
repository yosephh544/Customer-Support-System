using System.Security.Claims;
using System.Text.Json;
using Implementation.DTO.Authorization;
using Implementation.Exceptions;
using Implementation.Interfaces.Authorization;
using Infrustructure.Enums;
using Infrustructure.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace Implementation.Services.Authorization;

public class PermissionService : IPermissionService
{
    private const string PermissionClaimType = "Permission";
    private static readonly SemaphoreSlim FileLock = new(1, 1);

    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<PermissionService> _logger;

    private static PermissionsCatalogDto? _cachedCatalog;
    private static DateTime _lastLoadedTime = DateTime.MinValue;

    public PermissionService(
        UserManager<ApplicationUser> userManager,
        ILogger<PermissionService> logger)
    {
        _userManager = userManager;
        _logger = logger;
    }

    private static string GetPermissionsFilePath()
    {
        // 1. Current working directory (where the web app runs)
        var currentDirFile = Path.Combine(Directory.GetCurrentDirectory(), "permissions.json");
        if (File.Exists(currentDirFile))
        {
            return currentDirFile;
        }

        // 2. Subfolder "Api/permissions.json" if running from solution root
        var apiSubfolderFile = Path.Combine(Directory.GetCurrentDirectory(), "Api", "permissions.json");
        if (File.Exists(apiSubfolderFile))
        {
            return apiSubfolderFile;
        }

        // 3. AppContext BaseDirectory (bin output)
        var baseDirFile = Path.Combine(AppContext.BaseDirectory, "permissions.json");
        if (File.Exists(baseDirFile))
        {
            return baseDirFile;
        }

        return currentDirFile;
    }

    public async Task<PermissionsCatalogDto> GetCatalogAsync()
    {
        if (_cachedCatalog != null)
        {
            return _cachedCatalog;
        }

        await FileLock.WaitAsync();
        try
        {
            if (_cachedCatalog != null)
            {
                return _cachedCatalog;
            }

            var filePath = GetPermissionsFilePath();
            if (!File.Exists(filePath))
            {
                _logger.LogWarning("Permissions file not found at {FilePath}. Initializing empty catalog.", filePath);
                _cachedCatalog = new PermissionsCatalogDto();
                return _cachedCatalog;
            }

            var json = await File.ReadAllTextAsync(filePath);
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            _cachedCatalog = JsonSerializer.Deserialize<PermissionsCatalogDto>(json, options) ?? new PermissionsCatalogDto();
            _lastLoadedTime = DateTime.UtcNow;

            return _cachedCatalog;
        }
        finally
        {
            FileLock.Release();
        }
    }

    public async Task<IReadOnlyList<string>> GetAllPermissionIdsAsync()
    {
        var catalog = await GetCatalogAsync();
        return catalog.Modules
            .SelectMany(m => m.Permissions.Select(p => p.Id))
            .Distinct()
            .OrderBy(p => p)
            .ToList();
    }

    public async Task<IReadOnlyList<string>> GetRolePermissionsAsync(string roleName)
    {
        var catalog = await GetCatalogAsync();
        if (catalog.RoleDefaultPermissions.TryGetValue(roleName, out var permissions))
        {
            if (permissions.Contains("*"))
            {
                return await GetAllPermissionIdsAsync();
            }
            return permissions.OrderBy(p => p).ToList();
        }

        return Array.Empty<string>();
    }

    public async Task<Dictionary<string, List<string>>> GetRolePermissionMatrixAsync()
    {
        var catalog = await GetCatalogAsync();
        return catalog.RoleDefaultPermissions;
    }

    public async Task UpdateRolePermissionsAsync(string roleName, IEnumerable<string> permissions)
    {
        if (!Enum.TryParse<UserRole>(roleName, true, out _))
        {
            throw new NotFoundException($"Role '{roleName}' was not found. Valid static roles are: {string.Join(", ", AppRoles.All)}.");
        }

        await FileLock.WaitAsync();
        try
        {
            var catalog = await GetCatalogAsync();
            var distinctPermissions = permissions.Distinct().ToList();

            catalog.RoleDefaultPermissions[roleName] = distinctPermissions;

            var filePath = GetPermissionsFilePath();
            var options = new JsonSerializerOptions { WriteIndented = true };
            var json = JsonSerializer.Serialize(catalog, options);

            await File.WriteAllTextAsync(filePath, json);
            _cachedCatalog = catalog;
            _logger.LogInformation("Updated permissions for role '{RoleName}' in {FilePath}.", roleName, filePath);
        }
        finally
        {
            FileLock.Release();
        }
    }

    public async Task<UserPermissionsDto> GetUserPermissionsAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new NotFoundException(nameof(ApplicationUser), userId);

        var userRoleName = user.Role.ToString();
        var roles = new List<string> { userRoleName };
        var catalog = await GetCatalogAsync();
        var allPermissions = await GetAllPermissionIdsAsync();

        // Calculate role permissions
        var rolePermissionsSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (catalog.RoleDefaultPermissions.TryGetValue(userRoleName, out var rolePerms))
        {
            if (rolePerms.Contains("*") || user.Role == UserRole.Admin)
            {
                foreach (var p in allPermissions) rolePermissionsSet.Add(p);
            }
            else
            {
                foreach (var p in rolePerms) rolePermissionsSet.Add(p);
            }
        }

        // Direct user claims
        var claims = await _userManager.GetClaimsAsync(user);
        var directPermissions = claims
            .Where(c => c.Type == PermissionClaimType)
            .Select(c => c.Value)
            .Distinct()
            .OrderBy(p => p)
            .ToList();

        // Effective permissions = Role permissions + Direct permissions
        var effectiveSet = new HashSet<string>(rolePermissionsSet, StringComparer.OrdinalIgnoreCase);
        foreach (var dp in directPermissions)
        {
            effectiveSet.Add(dp);
        }

        return new UserPermissionsDto
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            Role = userRoleName,
            RolePermissions = rolePermissionsSet.OrderBy(p => p).ToList(),
            DirectPermissions = directPermissions,
            EffectivePermissions = effectiveSet.OrderBy(p => p).ToList()
        };
    }

    public async Task<IReadOnlyList<string>> GetUserDirectPermissionsAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new NotFoundException(nameof(ApplicationUser), userId);

        var claims = await _userManager.GetClaimsAsync(user);
        return claims
            .Where(c => c.Type == PermissionClaimType)
            .Select(c => c.Value)
            .Distinct()
            .OrderBy(p => p)
            .ToList();
    }

    public async Task<IReadOnlyList<string>> GetUserEffectivePermissionsAsync(string userId)
    {
        var userPermissions = await GetUserPermissionsAsync(userId);
        return userPermissions.EffectivePermissions;
    }

    public async Task<bool> HasPermissionAsync(string userId, string permission)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null || !user.IsActive)
        {
            return false;
        }

        if (user.Role == UserRole.Admin)
        {
            return true;
        }

        var effectivePermissions = await GetUserEffectivePermissionsAsync(userId);
        return effectivePermissions.Contains("*", StringComparer.OrdinalIgnoreCase) ||
               effectivePermissions.Contains(permission, StringComparer.OrdinalIgnoreCase);
    }

    public async Task SetUserDirectPermissionsAsync(string userId, IEnumerable<string> permissions)
    {
        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new NotFoundException(nameof(ApplicationUser), userId);

        var existingClaims = await _userManager.GetClaimsAsync(user);
        var permissionClaims = existingClaims.Where(c => c.Type == PermissionClaimType).ToList();

        if (permissionClaims.Count > 0)
        {
            await _userManager.RemoveClaimsAsync(user, permissionClaims);
        }

        var validPermissionIds = (await GetAllPermissionIdsAsync()).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var newClaims = permissions
            .Where(p => validPermissionIds.Contains(p) || p == "*")
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Select(p => new Claim(PermissionClaimType, p))
            .ToList();

        if (newClaims.Count > 0)
        {
            await _userManager.AddClaimsAsync(user, newClaims);
        }

        _logger.LogInformation("Updated direct permissions for user {UserId} ({Count} assigned).", userId, newClaims.Count);
    }

    public Task ReloadPermissionsAsync()
    {
        _cachedCatalog = null;
        return Task.CompletedTask;
    }
}
