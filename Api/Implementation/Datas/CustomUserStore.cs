using Infrustructure.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Implementation.Datas;

public class CustomUserStore : UserOnlyStore<ApplicationUser, ApplicationDbContext>
{
    public CustomUserStore(ApplicationDbContext context, IdentityErrorDescriber? describer = null)
        : base(context, describer)
    {
    }

    public override Task<ApplicationUser?> FindByEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ThrowIfDisposed();

        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return Task.FromResult<ApplicationUser?>(null);
        }

        var upper = normalizedEmail.ToUpper();
        return Users.FirstOrDefaultAsync(
            u => u.Email != null && (u.Email.ToUpper() == upper || u.Email == normalizedEmail),
            cancellationToken);
    }
}

