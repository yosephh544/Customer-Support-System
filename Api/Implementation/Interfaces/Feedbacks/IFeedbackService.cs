using Implementation.DTO.Common;
using Implementation.DTO.Feedbacks;

namespace Implementation.Interfaces.Feedbacks;

public interface IFeedbackService
{
    Task<PagedResult<FeedbackDto>> GetFeedbacksAsync(FeedbackFilterRequest filter);
    Task<FeedbackDto> GetFeedbackByIdAsync(Guid id);
    Task<FeedbackDto?> GetFeedbackByScheduleItemIdAsync(Guid scheduleItemId);
    Task<FeedbackDto> CreateFeedbackAsync(CreateFeedbackDto dto);
    Task<FeedbackDto> UpdateFeedbackAsync(Guid id, UpdateFeedbackDto dto);
    Task<FeedbackAnalyticsDto> GetFeedbackAnalyticsAsync();
}

