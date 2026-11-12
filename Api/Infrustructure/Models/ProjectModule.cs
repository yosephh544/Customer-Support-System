using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Infrustructure.Models;

public class ProjectModule : BaseEntity
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? Version { get; set; } = "v1.0";

    public bool IsEnabled { get; set; } = true;

    [MaxLength(500)]
    public string? CustomNotes { get; set; }

    [MaxLength(120)]
    public string? ContactPersonName { get; set; }

    [MaxLength(30)]
    public string? ContactPersonPhone { get; set; }

    [MaxLength(120)]
    public string? SecondaryContactPersonName { get; set; }

    [MaxLength(30)]
    public string? SecondaryContactPersonPhone { get; set; }

    // Navigation Properties
    [ForeignKey(nameof(ProjectId))]
    public Project Project { get; set; } = null!;

    public ICollection<ContactPerson> ContactPersons { get; set; } = new List<ContactPerson>();
    public ICollection<SupportAssignment> SupportAssignments { get; set; } = new List<SupportAssignment>();
}

