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

    // Convenience aliases for frontend consumption
    public string AgentName => !string.IsNullOrWhiteSpace(UserFullName) ? UserFullName : UserName;
    public string AgentEmail => UserEmail;

    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string? OrganizationName { get; set; }
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
    private string _userId = string.Empty;

    [Required]
    public string UserId
    {
        get => _userId;
        set => _userId = value ?? string.Empty;
    }

    /// <summary>
    /// Support alias for frontend payloads sending supportAgentId instead of userId.
    /// </summary>
    public string? SupportAgentId
    {
        get => _userId;
        set
        {
            if (!string.IsNullOrWhiteSpace(value))
                _userId = value;
        }
    }

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

