using Implementation.DTO.Common;
using Microsoft.EntityFrameworkCore;

namespace Implementation.Helpers;

public static class QueryableExtensions
{
    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> source,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var safePageNumber = pageNumber < 1 ? 1 : pageNumber;
        var safePageSize = pageSize < 1 ? 10 : (pageSize > 100 ? 100 : pageSize);

        var count = await source.CountAsync(cancellationToken);
        if (count == 0)
        {
            return new PagedResult<T>(Array.Empty<T>(), 0, safePageNumber, safePageSize);
        }

        var items = await source
            .Skip((safePageNumber - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<T>(items, count, safePageNumber, safePageSize);
    }
}

