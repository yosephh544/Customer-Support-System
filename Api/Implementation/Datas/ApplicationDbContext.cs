using Infrustructure.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;

namespace Implementation.Datas;

public class ApplicationDbContext : IdentityUserContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        optionsBuilder.ConfigureWarnings(w => w
            .Ignore(RelationalEventId.PendingModelChangesWarning)
            .Ignore(new EventId(10628))
            .Ignore(new EventId(20411)));
    }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectModule> ProjectModules => Set<ProjectModule>();
    public DbSet<ContactPerson> ContactPersons => Set<ContactPerson>();
    public DbSet<SupportAssignment> SupportAssignments => Set<SupportAssignment>();
    public DbSet<WeeklySchedule> WeeklySchedules => Set<WeeklySchedule>();
    public DbSet<ScheduleItem> ScheduleItems => Set<ScheduleItem>();
    public DbSet<Feedback> Feedbacks => Set<Feedback>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Customize ASP.NET Identity tables - Remove "AspNet" prefix completely and use Role enum
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.ToTable("Users");
            entity.Property(u => u.FullName).HasMaxLength(150);
            entity.Property(u => u.Role)
                  .HasConversion<string>()
                  .HasMaxLength(50)
                  .IsRequired();
            entity.HasIndex(u => u.Role);
            entity.HasIndex(u => u.Email);

            // Remove unnecessary default Identity columns from the Users table
            entity.Ignore(u => u.NormalizedEmail);
            entity.Ignore(u => u.EmailConfirmed);
            entity.Ignore(u => u.SecurityStamp);
            entity.Ignore(u => u.ConcurrencyStamp);
            entity.Ignore(u => u.PhoneNumberConfirmed);
            entity.Ignore(u => u.TwoFactorEnabled);
            entity.Ignore(u => u.LockoutEnd);
            entity.Ignore(u => u.LockoutEnabled);
        });

        builder.Entity<IdentityUserClaim<string>>(entity =>
        {
            entity.ToTable("UserClaims");
        });

        builder.Entity<IdentityUserLogin<string>>(entity =>
        {
            entity.ToTable("UserLogins");
        });

        builder.Entity<IdentityUserToken<string>>(entity =>
        {
            entity.ToTable("UserTokens");
        });

        // 1. Organizations
        builder.Entity<Organization>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.Property(o => o.Name).IsRequired().HasMaxLength(150);
        });

        // 2. Projects
        builder.Entity<Project>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Name).IsRequired().HasMaxLength(150);

            entity.HasOne(p => p.Organization)
                  .WithMany(o => o.Projects)
                  .HasForeignKey(p => p.OrganizationId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(p => p.OrganizationId);
        });

        // 3. ProjectModules
        builder.Entity<ProjectModule>(entity =>
        {
            entity.HasKey(pm => pm.Id);
            entity.Property(pm => pm.Name).IsRequired().HasMaxLength(150);
            entity.Property(pm => pm.Version).HasMaxLength(50);
            entity.Property(pm => pm.Description).HasMaxLength(500);

            entity.HasOne(pm => pm.Project)
                  .WithMany(p => p.ProjectModules)
                  .HasForeignKey(pm => pm.ProjectId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(pm => pm.ProjectId);
        });

        // 5. ContactPersons
        builder.Entity<ContactPerson>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.FullName).IsRequired().HasMaxLength(120);
            entity.Property(c => c.Phone).IsRequired().HasMaxLength(30);

            entity.HasOne(c => c.Organization)
                  .WithMany(o => o.ContactPersons)
                  .HasForeignKey(c => c.OrganizationId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.Project)
                  .WithMany(p => p.ContactPersons)
                  .HasForeignKey(c => c.ProjectId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(c => c.ProjectModule)
                  .WithMany(pm => pm.ContactPersons)
                  .HasForeignKey(c => c.ProjectModuleId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(c => c.OrganizationId);
            entity.HasIndex(c => c.ProjectId);
            entity.HasIndex(c => c.ProjectModuleId);
        });

        // 6. SupportAssignments
        builder.Entity<SupportAssignment>(entity =>
        {
            entity.HasKey(sa => sa.Id);

            entity.HasOne(sa => sa.User)
                  .WithMany()
                  .HasForeignKey(sa => sa.UserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(sa => sa.Project)
                  .WithMany(p => p.SupportAssignments)
                  .HasForeignKey(sa => sa.ProjectId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sa => sa.ProjectModule)
                  .WithMany(pm => pm.SupportAssignments)
                  .HasForeignKey(sa => sa.ProjectModuleId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(sa => new { sa.UserId, sa.ProjectId });
        });

        // 7. WeeklySchedules
        builder.Entity<WeeklySchedule>(entity =>
        {
            entity.HasKey(ws => ws.Id);
            entity.HasIndex(ws => new { ws.Year, ws.WeekNumber }).IsUnique();
        });

        // 8. ScheduleItems
        builder.Entity<ScheduleItem>(entity =>
        {
            entity.HasKey(si => si.Id);

            entity.HasOne(si => si.WeeklySchedule)
                  .WithMany(ws => ws.ScheduleItems)
                  .HasForeignKey(si => si.WeeklyScheduleId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(si => si.AssignedUser)
                  .WithMany()
                  .HasForeignKey(si => si.AssignedUserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(si => si.ContactPerson)
                  .WithMany(cp => cp.ScheduleItems)
                  .HasForeignKey(si => si.ContactPersonId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(si => si.AssignedUserId);
            entity.HasIndex(si => si.Status);
        });

        // 9. Feedbacks
        builder.Entity<Feedback>(entity =>
        {
            entity.HasKey(f => f.Id);

            entity.HasOne(f => f.ScheduleItem)
                  .WithOne(si => si.Feedback)
                  .HasForeignKey<Feedback>(f => f.ScheduleItemId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(f => f.ScheduleItemId).IsUnique();

            entity.ToTable(t => t.HasCheckConstraint("CK_Feedback_Rating", "[Rating] >= 1 AND [Rating] <= 5"));
        });
    }
}
