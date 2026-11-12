using System.ComponentModel.DataAnnotations;
using Implementation.DTO.Common;

namespace Implementation.DTO.Modules;

// Project Module DTOs
public class ProjectModuleDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string ModuleName => Name; // backward compatibility
    public string? Description { get; set; }
    public string? CustomNotes => Description; // backward compatibility
    public bool IsEnabled { get; set; }
    public string? Version { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateProjectModuleDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Version { get; set; } = "v1.0";

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsEnabled { get; set; } = true;
}

public class AssignProjectModuleDto : CreateProjectModuleDto
{
}

public class UpdateProjectModuleDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Version { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsEnabled { get; set; } = true;

    public string? CustomNotes
    {
        get => Description;
        set => Description = value;
    }
}

