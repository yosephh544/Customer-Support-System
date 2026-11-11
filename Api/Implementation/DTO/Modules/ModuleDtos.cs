using System.ComponentModel.DataAnnotations;
using Implementation.DTO.Common;

namespace Implementation.DTO.Modules;

// Master Module DTOs
public class MasterModuleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int LinkedProjectsCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateMasterModuleDto
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
}

public class UpdateMasterModuleDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; }
}

public class MasterModuleFilterRequest : PaginationRequest
{
    public bool? IsActive { get; set; }
}

// Project Module DTOs (Modules assigned under a Project)
public class ProjectModuleDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public Guid MasterModuleId { get; set; }
    public string ModuleName { get; set; } = string.Empty;
    public string ModuleCode { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public string? Version { get; set; }
    public string? CustomNotes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class AssignProjectModuleDto
{
    [Required]
    public Guid MasterModuleId { get; set; }

    public bool IsEnabled { get; set; } = true;

    [MaxLength(50)]
    public string? Version { get; set; }

    [MaxLength(500)]
    public string? CustomNotes { get; set; }
}

public class UpdateProjectModuleDto
{
    public bool IsEnabled { get; set; } = true;

    [MaxLength(50)]
    public string? Version { get; set; }

    [MaxLength(500)]
    public string? CustomNotes { get; set; }
}

