using Implementation.DTO.Common;
using Implementation.DTO.Schedules;

namespace Implementation.Interfaces.Schedules;

public interface IScheduleService
{
    // Weekly Schedules
    Task<PagedResult<WeeklyScheduleSummaryDto>> GetSchedulesAsync(ScheduleFilterRequest filter);
    Task<WeeklyScheduleDetailsDto> GetScheduleByIdAsync(Guid id);
    Task<WeeklyScheduleDetailsDto> GetCurrentWeekScheduleAsync();
    Task<WeeklyScheduleDetailsDto> CreateScheduleAsync(CreateWeeklyScheduleDto dto);
    Task<WeeklyScheduleDetailsDto> UpdateScheduleAsync(Guid id, UpdateWeeklyScheduleDto dto);
    Task DeleteScheduleAsync(Guid id);
    Task<WeeklyScheduleDetailsDto> GenerateScheduleItemsAsync(Guid scheduleId);

    // Schedule Items (Touchpoints)
    Task<PagedResult<ScheduleItemDto>> GetScheduleItemsAsync(ScheduleItemFilterRequest filter);
    Task<ScheduleItemDto> GetScheduleItemByIdAsync(Guid itemId);
    Task<PagedResult<ScheduleItemDto>> GetMyScheduleItemsAsync(string userId, ScheduleItemFilterRequest filter);
    Task<ScheduleItemDto> CreateScheduleItemAsync(Guid scheduleId, CreateScheduleItemDto dto);
    Task<ScheduleItemDto> UpdateScheduleItemAsync(Guid itemId, UpdateScheduleItemDto dto);
    Task<ScheduleItemDto> UpdateScheduleItemStatusAsync(Guid itemId, string currentUserId, UpdateScheduleItemStatusDto dto);
    Task DeleteScheduleItemAsync(Guid itemId);
}

