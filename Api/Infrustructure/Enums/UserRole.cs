namespace Infrustructure.Enums;

public enum UserRole
{
    Admin,
    Director,
    TeamLead,
    SupportAgent,
    Customer
}

public static class AppRoles
{
    public const string Admin = "Admin";
    public const string Director = "Director";
    public const string TeamLead = "TeamLead";
    public const string SupportAgent = "SupportAgent";
    public const string Customer = "Customer";

    public static readonly IReadOnlyList<string> All = new[] { Admin, Director, TeamLead, SupportAgent, Customer };
}
