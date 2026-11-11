using System.ComponentModel.DataAnnotations;
using Implementation.DTO.Common;
using Implementation.DTO.Projects;

namespace Implementation.DTO.Organizations;

public class OrganizationSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public int ProjectCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class OrganizationDetailsDto : OrganizationSummaryDto
{
    public List<ProjectSummaryDto> Projects { get; set; } = new();
}

public class CreateOrganizationDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    [MaxLength(100)]
    [EmailAddress]
    public string? Email { get; set; }

    [MaxLength(30)]
    [Phone]
    public string? Phone { get; set; }

    [MaxLength(250)]
    public string? Address { get; set; }
}

public class UpdateOrganizationDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    [MaxLength(100)]
    [EmailAddress]
    public string? Email { get; set; }

    [MaxLength(30)]
    [Phone]
    public string? Phone { get; set; }

    [MaxLength(250)]
    public string? Address { get; set; }
}

public class OrganizationFilterRequest : PaginationRequest
{
    public bool? IsActive { get; set; }
}

