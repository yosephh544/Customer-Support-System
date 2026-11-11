namespace Implementation.DTO;

public class UserProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Role { get; set; }
    public IList<string> Roles => string.IsNullOrEmpty(Role) ? new List<string>() : new List<string> { Role };
    public DateTime CreatedAt { get; set; }
}

