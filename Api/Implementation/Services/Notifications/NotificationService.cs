using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Implementation.Datas;
using Implementation.DTO.Notifications;
using Implementation.Interfaces.Notifications;
using Infrustructure.Enums;
using Infrustructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Implementation.Services.Notifications;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(ApplicationDbContext context, ILogger<NotificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<NotificationListResult> GetUserNotificationsAsync(string userId, bool? unreadOnly = null, int limit = 50)
    {
        var query = _context.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId);

        if (unreadOnly == true)
        {
            query = query.Where(n => !n.IsRead);
        }

        var total = await query.CountAsync();
        var unread = await _context.Notifications.AsNoTracking().CountAsync(n => n.UserId == userId && !n.IsRead);

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                UserId = n.UserId,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                IsRead = n.IsRead,
                RelatedEntityId = n.RelatedEntityId,
                CreatedAt = n.CreatedAt,
                ReadAt = n.ReadAt
            })
            .ToListAsync();

        return new NotificationListResult
        {
            Items = items,
            TotalCount = total,
            UnreadCount = unread
        };
    }

    public async Task<int> GetUnreadCountAsync(string userId)
    {
        return await _context.Notifications.AsNoTracking().CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task<bool> MarkAsReadAsync(string userId, Guid notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null) return false;

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<int> MarkAllAsReadAsync(string userId)
    {
        var unreadItems = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        var now = DateTime.UtcNow;
        foreach (var item in unreadItems)
        {
            item.IsRead = true;
            item.ReadAt = now;
        }

        return await _context.SaveChangesAsync();
    }

    public async Task<bool> DeleteNotificationAsync(string userId, Guid notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null) return false;

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<NotificationDto> CreateNotificationAsync(
        string userId,
        string title,
        string message,
        string type,
        string? relatedEntityId = null)
    {
        try
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                IsRead = false,
                RelatedEntityId = relatedEntityId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return new NotificationDto
            {
                Id = notification.Id,
                UserId = notification.UserId,
                Title = notification.Title,
                Message = notification.Message,
                Type = notification.Type,
                IsRead = notification.IsRead,
                RelatedEntityId = notification.RelatedEntityId,
                CreatedAt = notification.CreatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create notification for user {UserId}", userId);
            return new NotificationDto
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    public async Task CreateNotificationForRoleAsync(
        UserRole role,
        string title,
        string message,
        string type,
        string? relatedEntityId = null)
    {
        try
        {
            var targetUsers = await _context.Users
                .AsNoTracking()
                .Where(u => u.Role == role && u.IsActive)
                .Select(u => u.Id)
                .ToListAsync();

            if (!targetUsers.Any()) return;

            var notifications = targetUsers.Select(uid => new Notification
            {
                Id = Guid.NewGuid(),
                UserId = uid,
                Title = title,
                Message = message,
                Type = type,
                IsRead = false,
                RelatedEntityId = relatedEntityId,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to broadcast notifications to role {Role}", role);
        }
    }
}

