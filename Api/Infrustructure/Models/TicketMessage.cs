using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Infrustructure.Models;

public class TicketMessage : BaseEntity
{
    [Required]
    public Guid TicketId { get; set; }

    [Required]
    public string SenderUserId { get; set; } = string.Empty;

    public bool IsInternalNote { get; set; } = false;

    [Required]
    [MaxLength(4000)]
    public string Message { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? AttachmentUrl { get; set; }

    // Navigation Properties
    [ForeignKey(nameof(TicketId))]
    public Ticket Ticket { get; set; } = null!;

    [ForeignKey(nameof(SenderUserId))]
    public ApplicationUser SenderUser { get; set; } = null!;
}
