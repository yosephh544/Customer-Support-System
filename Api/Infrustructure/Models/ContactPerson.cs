using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Infrustructure.Models;

public class ContactPerson : BaseEntity
{
    [Required]
    public Guid OrganizationId { get; set; }

    public Guid? ProjectId { get; set; }

    public Guid? ProjectModuleId { get; set; }

    [Required]
    [MaxLength(120)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Email { get; set; }

    [MaxLength(100)]
    public string? JobTitle { get; set; }

    public bool IsPrimary { get; set; } = false;

    public bool IsActive { get; set; } = true;

    [MaxLength(500)]
    public string? Notes { get; set; }

    // Navigation Properties
    [ForeignKey(nameof(OrganizationId))]
    public Organization Organization { get; set; } = null!;

    [ForeignKey(nameof(ProjectId))]
    public Project? Project { get; set; }

    [ForeignKey(nameof(ProjectModuleId))]
    public ProjectModule? ProjectModule { get; set; }

    public ICollection<ScheduleItem> ScheduleItems { get; set; } = new List<ScheduleItem>();
}

