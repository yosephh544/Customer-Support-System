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
    public string? ContactPersonName { get; set; }
    public string? ContactPersonPhone { get; set; }
    public string? SecondaryContactPersonName { get; set; }
    public string? SecondaryContactPersonPhone { get; set; }
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

    [MaxLength(120)]
    public string? ContactPersonName { get; set; }

    [Phone]
    [MaxLength(30)]
    public string? ContactPersonPhone { get; set; }

    [MaxLength(120)]
    public string? SecondaryContactPersonName { get; set; }

    [Phone]
    [MaxLength(30)]
    public string? SecondaryContactPersonPhone { get; set; }
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

    [MaxLength(120)]
    public string? ContactPersonName { get; set; }

    [Phone]
    [MaxLength(30)]
    public string? ContactPersonPhone { get; set; }

    [MaxLength(120)]
    public string? SecondaryContactPersonName { get; set; }

    [Phone]
    [MaxLength(30)]
    public string? SecondaryContactPersonPhone { get; set; }

    public string? CustomNotes
    {
        get => Description;
        set => Description = value;
    }
}

