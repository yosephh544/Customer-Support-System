using Implementation.Interfaces.Tickets;
using Infrustructure.Enums;

namespace Implementation.Services.Tickets;

public class EthiopianSlaCalculator : IEthiopianSlaCalculator
{
    // UTC+3 East Africa Time offset
    private static readonly TimeSpan EatOffset = TimeSpan.FromHours(3);

    public int GetStandardWorkingHours(TicketPriority priority) => priority switch
    {
        TicketPriority.Blocker => 4,   // 4 working hours
        TicketPriority.High => 8,      // 8 working hours (1 business day)
        TicketPriority.Medium => 24,   // 24 working hours (3 business days)
        TicketPriority.Low => 48,      // 48 working hours (6 business days)
        _ => 24
    };

    public DateTime CalculateDeadline(DateTime startTimeUtc, TicketPriority priority)
    {
        int requiredWorkingHours = GetStandardWorkingHours(priority);
        double remainingMinutes = requiredWorkingHours * 60.0;

        // Convert UTC start time to local Ethiopian time (UTC+3)
        DateTime currentEat = startTimeUtc.Add(EatOffset);

        // Advance to next valid working slot if current time is outside working hours
        currentEat = FastForwardToNextWorkingSlot(currentEat);

        while (remainingMinutes > 0)
        {
            var dayOfWeek = currentEat.DayOfWeek;
            var timeOfDay = currentEat.TimeOfDay;

            // Determine current or next window for today
            TimeSpan windowStart;
            TimeSpan windowEnd;

            if (dayOfWeek == DayOfWeek.Sunday)
            {
                // Advance to Monday 08:30
                currentEat = currentEat.Date.AddDays(1).Add(new TimeSpan(8, 30, 0));
                continue;
            }
            else if (dayOfWeek == DayOfWeek.Saturday)
            {
                windowStart = new TimeSpan(8, 30, 0);
                windowEnd = new TimeSpan(12, 30, 0);

                if (timeOfDay < windowStart)
                {
                    currentEat = currentEat.Date.Add(windowStart);
                    continue;
                }
                if (timeOfDay >= windowEnd)
                {
                    // Saturday afternoon off -> advance to Monday 08:30
                    currentEat = currentEat.Date.AddDays(2).Add(new TimeSpan(8, 30, 0));
                    continue;
                }
            }
            else
            {
                // Monday - Friday
                // Morning window: 08:30 - 12:30
                // Afternoon window: 13:30 - 17:30
                var mStart = new TimeSpan(8, 30, 0);
                var mEnd = new TimeSpan(12, 30, 0);
                var aStart = new TimeSpan(13, 30, 0);
                var aEnd = new TimeSpan(17, 30, 0);

                if (timeOfDay < mStart)
                {
                    currentEat = currentEat.Date.Add(mStart);
                    continue;
                }
                else if (timeOfDay >= mStart && timeOfDay < mEnd)
                {
                    windowStart = mStart;
                    windowEnd = mEnd;
                }
                else if (timeOfDay >= mEnd && timeOfDay < aStart)
                {
                    // In lunch break (12:30 - 13:30) -> advance to 13:30
                    currentEat = currentEat.Date.Add(aStart);
                    continue;
                }
                else if (timeOfDay >= aStart && timeOfDay < aEnd)
                {
                    windowStart = aStart;
                    windowEnd = aEnd;
                }
                else
                {
                    // After 17:30 -> advance to next day 08:30
                    currentEat = currentEat.Date.AddDays(1).Add(new TimeSpan(8, 30, 0));
                    continue;
                }
            }

            // Calculate available minutes in this slot
            double availableInSlot = (windowEnd - currentEat.TimeOfDay).TotalMinutes;
            if (availableInSlot <= 0)
            {
                currentEat = currentEat.AddMinutes(1);
                continue;
            }

            if (remainingMinutes <= availableInSlot)
            {
                currentEat = currentEat.AddMinutes(remainingMinutes);
                remainingMinutes = 0;
            }
            else
            {
                remainingMinutes -= availableInSlot;
                currentEat = currentEat.Date.Add(windowEnd);
            }
        }

        // Convert resulting EAT time back to UTC
        return currentEat.Subtract(EatOffset);
    }

    private static DateTime FastForwardToNextWorkingSlot(DateTime eat)
    {
        var dayOfWeek = eat.DayOfWeek;
        var time = eat.TimeOfDay;

        if (dayOfWeek == DayOfWeek.Sunday)
        {
            return eat.Date.AddDays(1).Add(new TimeSpan(8, 30, 0));
        }

        if (dayOfWeek == DayOfWeek.Saturday)
        {
            if (time < new TimeSpan(8, 30, 0)) return eat.Date.Add(new TimeSpan(8, 30, 0));
            if (time >= new TimeSpan(12, 30, 0)) return eat.Date.AddDays(2).Add(new TimeSpan(8, 30, 0));
            return eat;
        }

        // Mon-Fri
        if (time < new TimeSpan(8, 30, 0)) return eat.Date.Add(new TimeSpan(8, 30, 0));
        if (time >= new TimeSpan(12, 30, 0) && time < new TimeSpan(13, 30, 0)) return eat.Date.Add(new TimeSpan(13, 30, 0));
        if (time >= new TimeSpan(17, 30, 0))
        {
            var nextDay = eat.Date.AddDays(1);
            if (nextDay.DayOfWeek == DayOfWeek.Saturday)
                return nextDay.Add(new TimeSpan(8, 30, 0));
            if (nextDay.DayOfWeek == DayOfWeek.Sunday)
                return nextDay.AddDays(1).Add(new TimeSpan(8, 30, 0));
            return nextDay.Add(new TimeSpan(8, 30, 0));
        }

        return eat;
    }

    public TimeSpan CalculateRemainingWorkingTime(DateTime deadlineUtc, DateTime nowUtc)
    {
        if (nowUtc >= deadlineUtc)
        {
            return TimeSpan.Zero;
        }
        return deadlineUtc - nowUtc;
    }

    public bool IsBreached(DateTime deadlineUtc, DateTime nowUtc)
    {
        return nowUtc > deadlineUtc;
    }

    public double CalculateSlaConsumedPercent(DateTime startTimeUtc, DateTime deadlineUtc, DateTime nowUtc)
    {
        if (deadlineUtc <= startTimeUtc) return 100.0;
        if (nowUtc <= startTimeUtc) return 0.0;
        if (nowUtc >= deadlineUtc) return 100.0;

        double totalMs = (deadlineUtc - startTimeUtc).TotalMilliseconds;
        double elapsedMs = (nowUtc - startTimeUtc).TotalMilliseconds;

        return Math.Round(Math.Clamp((elapsedMs / totalMs) * 100.0, 0.0, 100.0), 1);
    }
}
