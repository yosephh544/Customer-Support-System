using Implementation.DTO.Configuration;

namespace Implementation.Interfaces.Configuration;

public interface IConfigurationService
{
    Task<SystemConfigurationDto> GetConfigurationAsync();

    Task<SystemConfigurationDto> UpdateConfigurationAsync(UpdateSystemConfigurationDto dto, string? updatedByUserId);
}
