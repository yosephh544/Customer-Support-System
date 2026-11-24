using Infrustructure.Enums;

namespace Implementation.Interfaces.Tickets;

public interface IEthiopianSlaCalculator
{
    DateTime CalculateDeadline(DateTime startTimeUtc, TicketPriority priority);
    TimeSpan CalculateRemainingWorkingTime(DateTime deadlineUtc, DateTime nowUtc);
    bool IsBreached(DateTime deadlineUtc, DateTime nowUtc);
    double CalculateSlaConsumedPercent(DateTime startTimeUtc, DateTime deadlineUtc, DateTime nowUtc);
    int GetStandardWorkingHours(TicketPriority priority);
}
