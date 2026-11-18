using System.ComponentModel.DataAnnotations;

namespace Implementation.DTO.Configuration;

public class SystemConfigurationDto
{
    public int DefaultDailyTouchpointTarget { get; set; } = 1;

    public int MaxDailyTouchpointTarget { get; set; } = 10;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public string? UpdatedByName { get; set; }
}

public class UpdateSystemConfigurationDto
{
    [Range(1, 10)]
    public int DefaultDailyTouchpointTarget { get; set; } = 1;

    [Range(1, 10)]
    public int MaxDailyTouchpointTarget { get; set; } = 10;
}
