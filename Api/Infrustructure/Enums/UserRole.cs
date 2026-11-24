namespace Infrustructure.Enums;

public enum UserRole
{
    Admin = 1,
    Director = 2,
    TeamLead = 3,
    SupportAgent = 4,
    ClientPortalUser = 5
}

public static class AppRoles
{
    public const string Admin = "Admin";
    public const string Director = "Director";
    public const string TeamLead = "TeamLead";
    public const string SupportAgent = "SupportAgent";
    public const string ClientPortalUser = "ClientPortalUser";

    public static readonly IReadOnlyList<string> All = new[] { Admin, Director, TeamLead, SupportAgent, ClientPortalUser };
}

