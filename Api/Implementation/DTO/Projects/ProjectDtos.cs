using System.ComponentModel.DataAnnotations;
using Implementation.DTO.Common;
using Implementation.DTO.Modules;
using Infrustructure.Enums;

namespace Implementation.DTO.Projects;

public class ProjectSummaryDto
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    public string OrganizationName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ProjectStatus Status { get; set; }
    public string StatusName => Status.ToString();
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int ModuleCount { get; set; }
    public string? ContactPersonName { get; set; }
    public string? ContactPersonPhone { get; set; }
    public string? SecondaryContactPersonName { get; set; }
    public string? SecondaryContactPersonPhone { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class ProjectDetailsDto : ProjectSummaryDto
{
    public List<ProjectModuleDto> Modules { get; set; } = new();
}

public class CreateProjectModuleItemDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Version { get; set; } = "v1.0";

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(120)]
    public string? ContactPersonName { get; set; }

    [MaxLength(30)]
    public string? ContactPersonPhone { get; set; }

    [MaxLength(120)]
    public string? SecondaryContactPersonName { get; set; }

    [MaxLength(30)]
    public string? SecondaryContactPersonPhone { get; set; }
}

public class CreateProjectDto
{
    [Required]
    public Guid OrganizationId { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public ProjectStatus Status { get; set; } = ProjectStatus.Active;

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    [MaxLength(120)]
    public string? ContactPersonName { get; set; }

    [MaxLength(30)]
    public string? ContactPersonPhone { get; set; }

    [MaxLength(120)]
    public string? SecondaryContactPersonName { get; set; }

    [MaxLength(30)]
    public string? SecondaryContactPersonPhone { get; set; }

    public List<CreateProjectModuleItemDto>? Modules { get; set; } = new();
}

public class UpdateProjectDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public ProjectStatus Status { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    [MaxLength(120)]
    public string? ContactPersonName { get; set; }

    [MaxLength(30)]
    public string? ContactPersonPhone { get; set; }

    [MaxLength(120)]
    public string? SecondaryContactPersonName { get; set; }

    [MaxLength(30)]
    public string? SecondaryContactPersonPhone { get; set; }
}

public class ProjectFilterRequest : PaginationRequest
{
    public Guid? OrganizationId { get; set; }
    public ProjectStatus? Status { get; set; }
}

