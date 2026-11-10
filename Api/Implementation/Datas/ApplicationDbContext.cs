using Infrustructure.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Implementation.Datas;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<MasterModule> MasterModules => Set<MasterModule>();
    public DbSet<ProjectModule> ProjectModules => Set<ProjectModule>();
    public DbSet<ContactPerson> ContactPersons => Set<ContactPerson>();
    public DbSet<SupportAssignment> SupportAssignments => Set<SupportAssignment>();
    public DbSet<WeeklySchedule> WeeklySchedules => Set<WeeklySchedule>();
    public DbSet<ScheduleItem> ScheduleItems => Set<ScheduleItem>();
    public DbSet<Feedback> Feedbacks => Set<Feedback>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Customize ASP.NET Identity tables
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(u => u.FullName).HasMaxLength(150);
        });

        // 1. Organizations
        builder.Entity<Organization>(entity =>
        {
            entity.HasKey(o => o.Id);
            entity.Property(o => o.Name).IsRequired().HasMaxLength(150);
            entity.Property(o => o.Code).IsRequired().HasMaxLength(50);
            entity.HasIndex(o => o.Code).IsUnique();
        });

        // 2. Projects
        builder.Entity<Project>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Name).IsRequired().HasMaxLength(150);
            entity.Property(p => p.Code).HasMaxLength(50);

            entity.HasOne(p => p.Organization)
                  .WithMany(o => o.Projects)
                  .HasForeignKey(p => p.OrganizationId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(p => p.OrganizationId);
        });

        // 3. MasterModules
        builder.Entity<MasterModule>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.Property(m => m.Name).IsRequired().HasMaxLength(150);
            entity.Property(m => m.Code).IsRequired().HasMaxLength(50);
            entity.HasIndex(m => m.Code).IsUnique();
        });

        // 4. ProjectModules
        builder.Entity<ProjectModule>(entity =>
        {
            entity.HasKey(pm => pm.Id);

            entity.HasOne(pm => pm.Project)
                  .WithMany(p => p.ProjectModules)
                  .HasForeignKey(pm => pm.ProjectId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(pm => pm.MasterModule)
                  .WithMany(m => m.ProjectModules)
                  .HasForeignKey(pm => pm.MasterModuleId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(pm => new { pm.ProjectId, pm.MasterModuleId }).IsUnique();
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
