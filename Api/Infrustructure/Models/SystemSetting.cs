using System.ComponentModel.DataAnnotations;

namespace Infrustructure.Models;

public class SystemSetting
{
    [Key]
    [MaxLength(150)]
    public string Key { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Value { get; set; } = string.Empty;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(450)]
    public string? UpdatedBy { get; set; }
}
