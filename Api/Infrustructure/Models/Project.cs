using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Infrustructure.Enums;

namespace Infrustructure.Models;

public class Project : BaseEntity
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

    // Navigation Properties
    [ForeignKey(nameof(OrganizationId))]
    public Organization Organization { get; set; } = null!;

    public ICollection<ProjectModule> ProjectModules { get; set; } = new List<ProjectModule>();
    public ICollection<ContactPerson> ContactPersons { get; set; } = new List<ContactPerson>();
    public ICollection<SupportAssignment> SupportAssignments { get; set; } = new List<SupportAssignment>();
}

