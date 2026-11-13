using System;
using System.Threading.Tasks;
using Implementation.DTO.Notifications;
using Infrustructure.Enums;

namespace Implementation.Interfaces.Notifications;

public interface INotificationService
{
    Task<NotificationListResult> GetUserNotificationsAsync(string userId, bool? unreadOnly = null, int limit = 50);
    Task<int> GetUnreadCountAsync(string userId);
    Task<bool> MarkAsReadAsync(string userId, Guid notificationId);
    Task<int> MarkAllAsReadAsync(string userId);
    Task<bool> DeleteNotificationAsync(string userId, Guid notificationId);
    Task<NotificationDto> CreateNotificationAsync(string userId, string title, string message, string type, string? relatedEntityId = null);
    Task CreateNotificationForRoleAsync(UserRole role, string title, string message, string type, string? relatedEntityId = null);
}

