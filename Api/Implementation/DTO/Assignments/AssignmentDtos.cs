using System.ComponentModel.DataAnnotations;
using Implementation.DTO.Common;

namespace Implementation.DTO.Assignments;

public class SupportAssignmentDto
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string UserFullName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string? UserPhoneNumber { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public Guid? ProjectModuleId { get; set; }
    public string? ModuleName { get; set; }
    public bool IsActive { get; set; }
    public DateTime AssignedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateAssignmentDto
{
    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public Guid ProjectId { get; set; }

    public Guid? ProjectModuleId { get; set; }

    public bool IsActive { get; set; } = true;

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class UpdateAssignmentDto
{
    public Guid? ProjectModuleId { get; set; }

    public bool IsActive { get; set; } = true;

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class AssignmentFilterRequest : PaginationRequest
{
    public Guid? ProjectId { get; set; }
    public Guid? ProjectModuleId { get; set; }
    public string? UserId { get; set; }
    public bool? IsActive { get; set; }
}

