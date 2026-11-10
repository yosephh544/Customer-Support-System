using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Infrustructure.Models;

public class ProjectModule : BaseEntity
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    public Guid MasterModuleId { get; set; }

    public bool IsEnabled { get; set; } = true;

    [MaxLength(50)]
    public string? Version { get; set; }

    [MaxLength(500)]
    public string? CustomNotes { get; set; }

    // Navigation Properties
    [ForeignKey(nameof(ProjectId))]
    public Project Project { get; set; } = null!;

    [ForeignKey(nameof(MasterModuleId))]
    public MasterModule MasterModule { get; set; } = null!;

    public ICollection<ContactPerson> ContactPersons { get; set; } = new List<ContactPerson>();
    public ICollection<SupportAssignment> SupportAssignments { get; set; } = new List<SupportAssignment>();
}

