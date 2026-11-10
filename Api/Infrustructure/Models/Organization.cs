using System.ComponentModel.DataAnnotations;

namespace Infrustructure.Models;

public class Organization : BaseEntity
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    [MaxLength(100)]
    public string? Email { get; set; }

    [MaxLength(30)]
    public string? Phone { get; set; }

    [MaxLength(250)]
    public string? Address { get; set; }

    // Navigation Properties
    public ICollection<Project> Projects { get; set; } = new List<Project>();
    public ICollection<ContactPerson> ContactPersons { get; set; } = new List<ContactPerson>();
}

