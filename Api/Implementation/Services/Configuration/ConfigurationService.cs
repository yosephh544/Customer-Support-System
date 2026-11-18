using Implementation.Datas;
using Implementation.DTO.Configuration;
using Implementation.Exceptions;
using Implementation.Interfaces.Configuration;
using Infrustructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Implementation.Services.Configuration;

public class ConfigurationService : IConfigurationService
{
    public const string DefaultDailyTouchpointTargetKey = "Schedules.DefaultDailyTouchpointTarget";
    public const string MaxDailyTouchpointTargetKey = "Schedules.MaxDailyTouchpointTarget";

    private const int DefaultTouchpointTarget = 1;
    private const int MinTouchpointTarget = 1;
    private const int MaxTouchpointTarget = 10;

    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<ConfigurationService> _logger;

    public ConfigurationService(ApplicationDbContext dbContext, ILogger<ConfigurationService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<SystemConfigurationDto> GetConfigurationAsync()
    {
        var settings = await _dbContext.SystemSettings
            .AsNoTracking()
            .Where(s => s.Key == DefaultDailyTouchpointTargetKey || s.Key == MaxDailyTouchpointTargetKey)
            .ToListAsync();

        var max = ParseSetting(settings, MaxDailyTouchpointTargetKey, MaxTouchpointTarget);
        var defaultTarget = ParseSetting(settings, DefaultDailyTouchpointTargetKey, DefaultTouchpointTarget);

        // The default can never exceed the maximum allowed by policy.
        if (defaultTarget > max)
        {
            defaultTarget = max;
        }

        var latest = settings
            .OrderByDescending(s => s.UpdatedAt)
            .FirstOrDefault();

        string? updatedByName = null;
        if (!string.IsNullOrWhiteSpace(latest?.UpdatedBy))
        {
            updatedByName = await _dbContext.Users
                .Where(u => u.Id == latest!.UpdatedBy)
                .Select(u => u.FullName)
                .FirstOrDefaultAsync();
        }

        return new SystemConfigurationDto
        {
            DefaultDailyTouchpointTarget = defaultTarget,
            MaxDailyTouchpointTarget = max,
            UpdatedAt = latest != null ? DateTime.SpecifyKind(latest.UpdatedAt, DateTimeKind.Utc) : null,
            UpdatedBy = latest?.UpdatedBy,
            UpdatedByName = updatedByName
        };
    }

    public async Task<SystemConfigurationDto> UpdateConfigurationAsync(UpdateSystemConfigurationDto dto, string? updatedByUserId)
    {
        if (dto.DefaultDailyTouchpointTarget > dto.MaxDailyTouchpointTarget)
        {
            throw new BadRequestException("The default daily touchpoint target cannot be greater than the maximum daily touchpoint target.");
        }

        var existing = await _dbContext.SystemSettings
            .Where(s => s.Key == DefaultDailyTouchpointTargetKey || s.Key == MaxDailyTouchpointTargetKey)
            .ToDictionaryAsync(s => s.Key);

        var now = DateTime.UtcNow;

        Upsert(existing, DefaultDailyTouchpointTargetKey, dto.DefaultDailyTouchpointTarget.ToString(), now, updatedByUserId);
        Upsert(existing, MaxDailyTouchpointTargetKey, dto.MaxDailyTouchpointTarget.ToString(), now, updatedByUserId);

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation(
            "Updated touchpoint scheduling configuration: default={Default}, max={Max}",
            dto.DefaultDailyTouchpointTarget,
            dto.MaxDailyTouchpointTarget);

        return await GetConfigurationAsync();
    }

    private void Upsert(
        Dictionary<string, SystemSetting> existing,
        string key,
        string value,
        DateTime now,
        string? updatedByUserId)
    {
        if (existing.TryGetValue(key, out var setting))
        {
            setting.Value = value;
            setting.UpdatedAt = now;
            setting.UpdatedBy = updatedByUserId;
            return;
        }

        _dbContext.SystemSettings.Add(new SystemSetting
        {
            Key = key,
            Value = value,
            UpdatedAt = now,
            UpdatedBy = updatedByUserId
        });
    }

    private static int ParseSetting(List<SystemSetting> settings, string key, int fallback)
    {
        var raw = settings.FirstOrDefault(s => s.Key == key)?.Value;
        if (!int.TryParse(raw, out var value))
        {
            return fallback;
        }

        return Math.Clamp(value, MinTouchpointTarget, MaxTouchpointTarget);
    }
}
