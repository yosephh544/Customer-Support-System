using System.ComponentModel.DataAnnotations;

namespace Infrustructure.Models;

public class MasterModule : BaseEntity
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation Properties
    public ICollection<ProjectModule> ProjectModules { get; set; } = new List<ProjectModule>();
}

