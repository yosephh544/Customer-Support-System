using System.Globalization;
using Implementation.Datas;
using Implementation.DTO.Common;
using Implementation.DTO.Schedules;
using Implementation.Exceptions;
using Implementation.Interfaces.Schedules;
using Infrustructure.Enums;
using Infrustructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Implementation.Services.Schedules;

public class ScheduleService : IScheduleService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ILogger<ScheduleService> _logger;

    public ScheduleService(ApplicationDbContext dbContext, ILogger<ScheduleService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    #region Weekly Schedule

    public async Task<PagedResult<WeeklyScheduleSummaryDto>> GetSchedulesAsync(ScheduleFilterRequest filter)
    {
        var query = _dbContext.WeeklySchedules
            .AsNoTracking()
            .Include(ws => ws.ScheduleItems)
            .AsQueryable();

        if (filter.Year.HasValue)
        {
            query = query.Where(ws => ws.Year == filter.Year.Value);
        }

        if (filter.WeekNumber.HasValue)
        {
            query = query.Where(ws => ws.WeekNumber == filter.WeekNumber.Value);
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(ws => ws.Status == filter.Status.Value);
        }

        // Sorting
        query = filter.SortBy?.ToLower() switch
        {
            "year" => filter.IsDescending ? query.OrderByDescending(ws => ws.Year).ThenByDescending(ws => ws.WeekNumber) : query.OrderBy(ws => ws.Year).ThenBy(ws => ws.WeekNumber),
            "weeknumber" => filter.IsDescending ? query.OrderByDescending(ws => ws.WeekNumber) : query.OrderBy(ws => ws.WeekNumber),
            "status" => filter.IsDescending ? query.OrderByDescending(ws => ws.Status) : query.OrderBy(ws => ws.Status),
            "startdate" => filter.IsDescending ? query.OrderByDescending(ws => ws.WeekStartDate) : query.OrderBy(ws => ws.WeekStartDate),
            _ => query.OrderByDescending(ws => ws.Year).ThenByDescending(ws => ws.WeekNumber)
        };

        var safePageNumber = filter.PageNumber < 1 ? 1 : filter.PageNumber;
        var safePageSize = filter.PageSize < 1 ? 10 : (filter.PageSize > 100 ? 100 : filter.PageSize);

        var totalCount = await query.CountAsync();
        var pagedItems = await query
            .Skip((safePageNumber - 1) * safePageSize)
            .Take(safePageSize)
            .Select(ws => new WeeklyScheduleSummaryDto
            {
                Id = ws.Id,
                WeekStartDate = ws.WeekStartDate,
                WeekEndDate = ws.WeekEndDate,
                WeekNumber = ws.WeekNumber,
                Year = ws.Year,
                Status = ws.Status,
                Notes = ws.Notes,
                TotalItems = ws.ScheduleItems.Count,
                PendingItems = ws.ScheduleItems.Count(i => i.Status == ScheduleItemStatus.Pending),
                CompletedItems = ws.ScheduleItems.Count(i => i.Status == ScheduleItemStatus.Completed),
                SkippedItems = ws.ScheduleItems.Count(i => i.Status == ScheduleItemStatus.Skipped),
                CreatedAt = ws.CreatedAt,
                UpdatedAt = ws.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<WeeklyScheduleSummaryDto>
        {
            Items = pagedItems,
            TotalCount = totalCount,
            PageNumber = safePageNumber,
            PageSize = safePageSize
        };
    }

    public async Task<WeeklyScheduleDetailsDto> GetScheduleByIdAsync(Guid id)
    {
        var ws = await _dbContext.WeeklySchedules
            .AsNoTracking()
            .Include(s => s.ScheduleItems)
                .ThenInclude(i => i.AssignedUser)
            .Include(s => s.ScheduleItems)
                .ThenInclude(i => i.ContactPerson)
                    .ThenInclude(cp => cp.Organization)
            .Include(s => s.ScheduleItems)
                .ThenInclude(i => i.ContactPerson)
                    .ThenInclude(cp => cp.Project)
            .Include(s => s.ScheduleItems)
                .ThenInclude(i => i.ContactPerson)
                    .ThenInclude(cp => cp.ProjectModule)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (ws == null)
        {
            throw new NotFoundException("WeeklySchedule", id);
        }

        return MapToDetailsDto(ws);
    }

    public async Task<WeeklyScheduleDetailsDto> GetCurrentWeekScheduleAsync()
    {
        var today = DateTime.UtcNow.Date;
        var (weekStart, _, weekNum, year) = ComputeWeekRange(today);

        var ws = await _dbContext.WeeklySchedules
            .AsNoTracking()
            .Include(s => s.ScheduleItems)
                .ThenInclude(i => i.AssignedUser)
            .Include(s => s.ScheduleItems)
                .ThenInclude(i => i.ContactPerson)
                    .ThenInclude(cp => cp.Organization)
            .Include(s => s.ScheduleItems)
                .ThenInclude(i => i.ContactPerson)
                    .ThenInclude(cp => cp.Project)
            .Include(s => s.ScheduleItems)
                .ThenInclude(i => i.ContactPerson)
                    .ThenInclude(cp => cp.ProjectModule)
            .OrderByDescending(s => s.WeekStartDate)
            .FirstOrDefaultAsync(s => (today >= s.WeekStartDate.Date && today <= s.WeekEndDate.Date) || (s.Year == year && s.WeekNumber == weekNum));

        if (ws == null)
        {
            // Fallback to the latest available schedule
            ws = await _dbContext.WeeklySchedules
                .AsNoTracking()
                .Include(s => s.ScheduleItems)
                    .ThenInclude(i => i.AssignedUser)
                .Include(s => s.ScheduleItems)
                    .ThenInclude(i => i.ContactPerson)
                        .ThenInclude(cp => cp.Organization)
                .Include(s => s.ScheduleItems)
                    .ThenInclude(i => i.ContactPerson)
                        .ThenInclude(cp => cp.Project)
                .Include(s => s.ScheduleItems)
                    .ThenInclude(i => i.ContactPerson)
                        .ThenInclude(cp => cp.ProjectModule)
                .OrderByDescending(s => s.WeekStartDate)
                .FirstOrDefaultAsync();
        }

        if (ws == null)
        {
            throw new NotFoundException($"No schedule found for the current week (Year {year}, Week {weekNum}).");
        }

        return MapToDetailsDto(ws);
    }

    public async Task<WeeklyScheduleDetailsDto> CreateScheduleAsync(CreateWeeklyScheduleDto dto)
    {
        DateTime startDate;
        DateTime endDate;
        int weekNumber;
        int year;

        var cal = CultureInfo.InvariantCulture.Calendar;

        if (dto.WeekStartDate.HasValue && dto.WeekEndDate.HasValue)
        {
            // Custom plan duration (some days or custom period)
            startDate = dto.WeekStartDate.Value.Date;
            endDate = dto.WeekEndDate.Value.Date.AddHours(23).AddMinutes(59).AddSeconds(59);

            if (endDate < startDate)
            {
                throw new BadRequestException("Cycle end date cannot be earlier than start date.");
            }

            weekNumber = cal.GetWeekOfYear(startDate, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
            year = startDate.Year;
        }
        else if (dto.WeekStartDate.HasValue)
        {
            // Standard weekly plan starting on chosen date
            startDate = dto.WeekStartDate.Value.Date;
            endDate = startDate.AddDays(6).Date.AddHours(23).AddMinutes(59).AddSeconds(59);
            weekNumber = cal.GetWeekOfYear(startDate, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
            year = startDate.Year;
        }
        else if (dto.Year.HasValue && dto.WeekNumber.HasValue)
        {
            year = dto.Year.Value;
            weekNumber = dto.WeekNumber.Value;
            startDate = FirstDateOfWeekISO8601(year, weekNumber);
            endDate = startDate.AddDays(6).Date.AddHours(23).AddMinutes(59).AddSeconds(59);
        }
        else
        {
            (startDate, endDate, weekNumber, year) = ComputeWeekRange(DateTime.UtcNow);
        }

        // Check for duplicate schedule covering the exact same date range
        var exactDuplicate = await _dbContext.WeeklySchedules
            .AnyAsync(ws => ws.WeekStartDate.Date == startDate.Date && ws.WeekEndDate.Date == endDate.Date);

        if (exactDuplicate)
        {
            throw new BadRequestException($"A schedule cycle from {startDate:MMM dd, yyyy} to {endDate:MMM dd, yyyy} already exists.");
        }

        var schedule = new WeeklySchedule
        {
            Id = Guid.NewGuid(),
            WeekStartDate = startDate,
            WeekEndDate = endDate,
            WeekNumber = weekNumber,
            Year = year,
            Status = dto.Status,
            Notes = dto.Notes?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.WeeklySchedules.Add(schedule);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Created WeeklySchedule {Id} ({StartDate:yyyy-MM-dd} to {EndDate:yyyy-MM-dd}) for Year {Year}, Week {Week}", schedule.Id, startDate, endDate, year, weekNumber);

        return await GetScheduleByIdAsync(schedule.Id);
    }

    public async Task<WeeklyScheduleDetailsDto> UpdateScheduleAsync(Guid id, UpdateWeeklyScheduleDto dto)
    {
        var schedule = await _dbContext.WeeklySchedules.FirstOrDefaultAsync(ws => ws.Id == id);
        if (schedule == null)
        {
            throw new NotFoundException("WeeklySchedule", id);
        }

        if (dto.WeekStartDate.HasValue)
        {
            DateTime start = dto.WeekStartDate.Value.Date;
            DateTime end = dto.WeekEndDate?.Date.AddHours(23).AddMinutes(59).AddSeconds(59)
                           ?? start.AddDays(6).Date.AddHours(23).AddMinutes(59).AddSeconds(59);

            if (end < start)
            {
                throw new BadRequestException("Cycle end date cannot be earlier than start date.");
            }

            var cal = CultureInfo.InvariantCulture.Calendar;
            schedule.WeekStartDate = start;
            schedule.WeekEndDate = end;
            schedule.WeekNumber = cal.GetWeekOfYear(start, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
            schedule.Year = start.Year;
        }

        schedule.Status = dto.Status;
        if (dto.Notes != null)
        {
            schedule.Notes = dto.Notes.Trim();
        }
        schedule.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Updated WeeklySchedule {Id}", id);

        return await GetScheduleByIdAsync(schedule.Id);
    }

    public async Task DeleteScheduleAsync(Guid id)
    {
        var schedule = await _dbContext.WeeklySchedules
            .Include(ws => ws.ScheduleItems)
            .FirstOrDefaultAsync(ws => ws.Id == id);

        if (schedule == null)
        {
            throw new NotFoundException("WeeklySchedule", id);
        }

        _dbContext.WeeklySchedules.Remove(schedule);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Deleted WeeklySchedule {Id}", id);
    }

    public async Task<WeeklyScheduleDetailsDto> GenerateScheduleItemsAsync(Guid scheduleId)
    {
        var schedule = await _dbContext.WeeklySchedules
            .Include(ws => ws.ScheduleItems)
            .FirstOrDefaultAsync(ws => ws.Id == scheduleId);

        if (schedule == null)
        {
            throw new NotFoundException("WeeklySchedule", scheduleId);
        }

        // 1. Fetch active support assignments
        var activeAssignments = await _dbContext.SupportAssignments
            .AsNoTracking()
            .Where(sa => sa.IsActive)
            .ToListAsync();

        if (!activeAssignments.Any())
        {
            throw new BadRequestException("No active project/module team member assignments found to generate schedule items from.");
        }

        // 2. Fetch already scheduled contact persons for this schedule
        var existingContactIds = schedule.ScheduleItems.Select(si => si.ContactPersonId).ToHashSet();

        // 3. For each assignment, find active contact persons for that project / module
        var createdCount = 0;
        var workDays = new[] { 0, 1, 2, 3, 4 }; // Monday to Friday offsets
        var dayIndex = 0;

        foreach (var assignment in activeAssignments)
        {
            var contactsQuery = _dbContext.ContactPersons
                .AsNoTracking()
                .Where(cp => cp.IsActive);

            if (assignment.ProjectModuleId.HasValue)
            {
                contactsQuery = contactsQuery.Where(cp =>
                    (cp.ProjectId == assignment.ProjectId && cp.ProjectModuleId == assignment.ProjectModuleId) ||
                    (cp.ProjectId == assignment.ProjectId && cp.ProjectModuleId == null));
            }
            else
            {
                contactsQuery = contactsQuery.Where(cp => cp.ProjectId == assignment.ProjectId);
            }

            var contacts = await contactsQuery.ToListAsync();

            foreach (var contact in contacts)
            {
                if (existingContactIds.Contains(contact.Id))
                {
                    continue; // Skip already scheduled
                }

                // Schedule distributed across cycle duration days
                var durationDays = Math.Max(1, (int)(schedule.WeekEndDate.Date - schedule.WeekStartDate.Date).TotalDays + 1);
                var dayOffset = dayIndex % durationDays;
                var scheduledDate = schedule.WeekStartDate.Date.AddDays(dayOffset).AddHours(10); // default 10:00 AM
                dayIndex++;

                var item = new ScheduleItem
                {
                    Id = Guid.NewGuid(),
                    WeeklyScheduleId = schedule.Id,
                    AssignedUserId = assignment.UserId,
                    ContactPersonId = contact.Id,
                    ScheduledDate = scheduledDate,
                    Status = ScheduleItemStatus.Pending,
                    Notes = $"Auto-generated for project assignment on {schedule.WeekStartDate:yyyy-MM-dd}",
                    CreatedAt = DateTime.UtcNow
                };

                _dbContext.ScheduleItems.Add(item);
                existingContactIds.Add(contact.Id);
                createdCount++;
            }
        }

        if (createdCount > 0)
        {
            schedule.Status = WeeklyScheduleStatus.Active;
            await _dbContext.SaveChangesAsync();
            _logger.LogInformation("Auto-generated {Count} schedule touchpoints for WeeklySchedule {ScheduleId}", createdCount, scheduleId);
        }

        return await GetScheduleByIdAsync(scheduleId);
    }

    #endregion

    #region Schedule Items (Touchpoints)

    public async Task<PagedResult<ScheduleItemDto>> GetScheduleItemsAsync(ScheduleItemFilterRequest filter)
    {
        var query = _dbContext.ScheduleItems
            .AsNoTracking()
            .Include(si => si.WeeklySchedule)
            .Include(si => si.AssignedUser)
            .Include(si => si.ContactPerson)
                .ThenInclude(cp => cp.Organization)
            .Include(si => si.ContactPerson)
                .ThenInclude(cp => cp.Project)
            .Include(si => si.ContactPerson)
                .ThenInclude(cp => cp.ProjectModule)
            .AsQueryable();

        if (filter.WeeklyScheduleId.HasValue)
        {
            query = query.Where(si => si.WeeklyScheduleId == filter.WeeklyScheduleId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.AssignedUserId))
        {
            query = query.Where(si => si.AssignedUserId == filter.AssignedUserId);
        }

        if (filter.ProjectId.HasValue)
        {
            query = query.Where(si => si.ContactPerson.ProjectId == filter.ProjectId.Value);
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(si => si.Status == filter.Status.Value);
        }

        if (filter.FromDate.HasValue)
        {
            query = query.Where(si => si.ScheduledDate >= filter.FromDate.Value);
        }

        if (filter.ToDate.HasValue)
        {
            query = query.Where(si => si.ScheduledDate <= filter.ToDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var search = filter.SearchTerm.Trim().ToLower();
            query = query.Where(si => si.ContactPerson.FullName.ToLower().Contains(search) ||
                                     si.ContactPerson.Phone.Contains(search) ||
                                     si.ContactPerson.Organization.Name.ToLower().Contains(search) ||
                                     si.AssignedUser.FullName.ToLower().Contains(search));
        }

        query = filter.SortBy?.ToLower() switch
        {
            "scheduleddate" => filter.IsDescending ? query.OrderByDescending(si => si.ScheduledDate) : query.OrderBy(si => si.ScheduledDate),
            "status" => filter.IsDescending ? query.OrderByDescending(si => si.Status) : query.OrderBy(si => si.Status),
            "contact" => filter.IsDescending ? query.OrderByDescending(si => si.ContactPerson.FullName) : query.OrderBy(si => si.ContactPerson.FullName),
            _ => query.OrderBy(si => si.ScheduledDate)
        };

        var safePageNumber = filter.PageNumber < 1 ? 1 : filter.PageNumber;
        var safePageSize = filter.PageSize < 1 ? 10 : (filter.PageSize > 100 ? 100 : filter.PageSize);

        var totalCount = await query.CountAsync();
        var pagedItems = await query
            .Skip((safePageNumber - 1) * safePageSize)
            .Take(safePageSize)
            .Select(si => MapItemToDto(si))
            .ToListAsync();

        return new PagedResult<ScheduleItemDto>
        {
            Items = pagedItems,
            TotalCount = totalCount,
            PageNumber = safePageNumber,
            PageSize = safePageSize
        };
    }

    public async Task<ScheduleItemDto> GetScheduleItemByIdAsync(Guid itemId)
    {
        var item = await _dbContext.ScheduleItems
            .AsNoTracking()
            .Include(si => si.WeeklySchedule)
            .Include(si => si.AssignedUser)
            .Include(si => si.ContactPerson)
                .ThenInclude(cp => cp.Organization)
            .Include(si => si.ContactPerson)
                .ThenInclude(cp => cp.Project)
            .Include(si => si.ContactPerson)
                .ThenInclude(cp => cp.ProjectModule)
            .FirstOrDefaultAsync(si => si.Id == itemId);

        if (item == null)
        {
            throw new NotFoundException("ScheduleItem", itemId);
        }

        return MapItemToDto(item);
    }

    public async Task<PagedResult<ScheduleItemDto>> GetMyScheduleItemsAsync(string userId, ScheduleItemFilterRequest filter)
    {
        filter.AssignedUserId = userId;
        return await GetScheduleItemsAsync(filter);
    }

    public async Task<ScheduleItemDto> CreateScheduleItemAsync(Guid scheduleId, CreateScheduleItemDto dto)
    {
        var schedule = await _dbContext.WeeklySchedules.FirstOrDefaultAsync(ws => ws.Id == scheduleId);
        if (schedule == null)
        {
            throw new NotFoundException("WeeklySchedule", scheduleId);
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == dto.AssignedUserId);
        if (user == null)
        {
            throw new NotFoundException("User", dto.AssignedUserId);
        }

        var contact = await _dbContext.ContactPersons.FirstOrDefaultAsync(cp => cp.Id == dto.ContactPersonId);
        if (contact == null)
        {
            throw new NotFoundException("ContactPerson", dto.ContactPersonId);
        }

        var alreadyScheduled = await _dbContext.ScheduleItems
            .AnyAsync(si => si.WeeklyScheduleId == scheduleId && si.ContactPersonId == dto.ContactPersonId);

        if (alreadyScheduled)
        {
            throw new BadRequestException($"Contact person '{contact.FullName}' is already scheduled in this weekly cycle.");
        }

        var item = new ScheduleItem
        {
            Id = Guid.NewGuid(),
            WeeklyScheduleId = scheduleId,
            AssignedUserId = dto.AssignedUserId,
            ContactPersonId = dto.ContactPersonId,
            ScheduledDate = dto.ScheduledDate ?? schedule.WeekStartDate.Date.AddHours(10),
            Status = ScheduleItemStatus.Pending,
            Notes = dto.Notes?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.ScheduleItems.Add(item);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Created ScheduleItem {ItemId} for user {UserId} in Schedule {ScheduleId}", item.Id, dto.AssignedUserId, scheduleId);

        return await GetScheduleItemByIdAsync(item.Id);
    }

    public async Task<ScheduleItemDto> UpdateScheduleItemAsync(Guid itemId, UpdateScheduleItemDto dto)
    {
        var item = await _dbContext.ScheduleItems.FirstOrDefaultAsync(si => si.Id == itemId);
        if (item == null)
        {
            throw new NotFoundException("ScheduleItem", itemId);
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == dto.AssignedUserId);
        if (user == null)
        {
            throw new NotFoundException("User", dto.AssignedUserId);
        }

        var contact = await _dbContext.ContactPersons.FirstOrDefaultAsync(cp => cp.Id == dto.ContactPersonId);
        if (contact == null)
        {
            throw new NotFoundException("ContactPerson", dto.ContactPersonId);
        }

        if (dto.ContactPersonId != item.ContactPersonId)
        {
            var alreadyScheduled = await _dbContext.ScheduleItems
                .AnyAsync(si => si.WeeklyScheduleId == item.WeeklyScheduleId && si.ContactPersonId == dto.ContactPersonId && si.Id != itemId);

            if (alreadyScheduled)
            {
                throw new BadRequestException($"Contact person '{contact.FullName}' is already scheduled in this weekly cycle.");
            }
        }

        item.AssignedUserId = dto.AssignedUserId;
        item.ContactPersonId = dto.ContactPersonId;
        item.ScheduledDate = dto.ScheduledDate;
        item.Status = dto.Status;
        if (dto.Status == ScheduleItemStatus.Completed && item.CompletedAt == null)
        {
            item.CompletedAt = DateTime.UtcNow;
        }
        item.Notes = dto.Notes?.Trim();
        item.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Updated ScheduleItem {ItemId}", itemId);

        return await GetScheduleItemByIdAsync(itemId);
    }

    public async Task<ScheduleItemDto> UpdateScheduleItemStatusAsync(Guid itemId, string currentUserId, UpdateScheduleItemStatusDto dto)
    {
        var item = await _dbContext.ScheduleItems.FirstOrDefaultAsync(si => si.Id == itemId);
        if (item == null)
        {
            throw new NotFoundException("ScheduleItem", itemId);
        }

        item.Status = dto.Status;
        if (dto.Status == ScheduleItemStatus.Completed)
        {
            item.CompletedAt = DateTime.UtcNow;

            var existingFeedback = await _dbContext.Feedbacks.FirstOrDefaultAsync(f => f.ScheduleItemId == item.Id);
            if (existingFeedback == null)
            {
                var feedback = new Feedback
                {
                    Id = Guid.NewGuid(),
                    ScheduleItemId = item.Id,
                    Rating = 5,
                    Priority = FeedbackPriority.Medium,
                    Status = FeedbackStatus.Resolved,
                    Remarks = !string.IsNullOrWhiteSpace(dto.Notes) ? dto.Notes.Trim() : "Customer touchpoint completed with positive reception.",
                    ResolutionNotes = dto.Notes?.Trim(),
                    ResolvedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.Feedbacks.Add(feedback);
            }
            else if (!string.IsNullOrWhiteSpace(dto.Notes))
            {
                existingFeedback.Remarks = dto.Notes.Trim();
                existingFeedback.ResolutionNotes = dto.Notes.Trim();
                existingFeedback.Status = FeedbackStatus.Resolved;
                existingFeedback.ResolvedAt = DateTime.UtcNow;
                existingFeedback.UpdatedAt = DateTime.UtcNow;
            }
        }
        else if (dto.Status == ScheduleItemStatus.Pending)
        {
            item.CompletedAt = null;
        }

        if (!string.IsNullOrWhiteSpace(dto.Notes))
        {
            item.Notes = dto.Notes.Trim();
        }

        item.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Updated status of ScheduleItem {ItemId} to {Status} by user {UserId}", itemId, dto.Status, currentUserId);

        return await GetScheduleItemByIdAsync(itemId);
    }

    public async Task DeleteScheduleItemAsync(Guid itemId)
    {
        var item = await _dbContext.ScheduleItems.FirstOrDefaultAsync(si => si.Id == itemId);
        if (item == null)
        {
            throw new NotFoundException("ScheduleItem", itemId);
        }

        _dbContext.ScheduleItems.Remove(item);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Deleted ScheduleItem {ItemId}", itemId);
    }

    #endregion

    #region Helper Methods

    private static (DateTime start, DateTime end, int weekNum, int year) ComputeWeekRange(DateTime date)
    {
        // Monday as first day of week
        var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
        var monday = date.Date.AddDays(-1 * diff);
        var sunday = monday.AddDays(6).Date.AddHours(23).AddMinutes(59).AddSeconds(59);

        var cal = CultureInfo.InvariantCulture.Calendar;
        var weekNum = cal.GetWeekOfYear(monday, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
        var year = monday.Year;

        return (monday, sunday, weekNum, year);
    }

    private static DateTime FirstDateOfWeekISO8601(int year, int weekOfYear)
    {
        var jan1 = new DateTime(year, 1, 1);
        var daysOffset = DayOfWeek.Thursday - jan1.DayOfWeek;

        var firstThursday = jan1.AddDays(daysOffset);
        var cal = CultureInfo.InvariantCulture.Calendar;
        var firstWeek = cal.GetWeekOfYear(firstThursday, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);

        var weekNum = weekOfYear;
        if (firstWeek == 1)
        {
            weekNum -= 1;
        }

        var result = firstThursday.AddDays(weekNum * 7);
        return result.AddDays(-3); // Back to Monday
    }

    private static WeeklyScheduleDetailsDto MapToDetailsDto(WeeklySchedule ws)
    {
        return new WeeklyScheduleDetailsDto
        {
            Id = ws.Id,
            WeekStartDate = ws.WeekStartDate,
            WeekEndDate = ws.WeekEndDate,
            WeekNumber = ws.WeekNumber,
            Year = ws.Year,
            Status = ws.Status,
            Notes = ws.Notes,
            TotalItems = ws.ScheduleItems.Count,
            PendingItems = ws.ScheduleItems.Count(i => i.Status == ScheduleItemStatus.Pending),
            CompletedItems = ws.ScheduleItems.Count(i => i.Status == ScheduleItemStatus.Completed),
            SkippedItems = ws.ScheduleItems.Count(i => i.Status == ScheduleItemStatus.Skipped),
            CreatedAt = ws.CreatedAt,
            UpdatedAt = ws.UpdatedAt,
            Items = ws.ScheduleItems.Select(MapItemToDto).ToList()
        };
    }

    private static ScheduleItemDto MapItemToDto(ScheduleItem si)
    {
        return new ScheduleItemDto
        {
            Id = si.Id,
            WeeklyScheduleId = si.WeeklyScheduleId,
            WeekNumber = si.WeeklySchedule != null ? si.WeeklySchedule.WeekNumber : 0,
            Year = si.WeeklySchedule != null ? si.WeeklySchedule.Year : 0,
            AssignedUserId = si.AssignedUserId,
            AssignedUserName = si.AssignedUser?.UserName ?? string.Empty,
            AssignedUserFullName = si.AssignedUser?.FullName ?? string.Empty,
            ContactPersonId = si.ContactPersonId,
            ContactPersonName = si.ContactPerson?.FullName ?? string.Empty,
            ContactPersonPhone = si.ContactPerson?.Phone ?? string.Empty,
            ContactPersonEmail = si.ContactPerson?.Email,
            ContactPersonJobTitle = si.ContactPerson?.JobTitle,
            OrganizationId = si.ContactPerson?.OrganizationId ?? Guid.Empty,
            OrganizationName = si.ContactPerson?.Organization?.Name ?? string.Empty,
            ProjectId = si.ContactPerson?.ProjectId,
            ProjectName = si.ContactPerson?.Project?.Name,
            ProjectModuleId = si.ContactPerson?.ProjectModuleId,
            ModuleName = si.ContactPerson?.ProjectModule?.Name,
            ScheduledDate = si.ScheduledDate,
            Status = si.Status,
            CompletedAt = si.CompletedAt,
            Notes = si.Notes,
            CreatedAt = si.CreatedAt,
            UpdatedAt = si.UpdatedAt
        };
    }

    #endregion
}

