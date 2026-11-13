using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Implementation.DTO.Notifications;
using Implementation.Interfaces.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Notifications;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    private string? CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    [HttpGet]
    public async Task<ActionResult<NotificationListResult>> GetMyNotifications([FromQuery] bool? unreadOnly, [FromQuery] int limit = 50)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _notificationService.GetUserNotificationsAsync(userId, unreadOnly, limit);
        return Ok(result);
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount()
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var count = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(count);
    }

    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var success = await _notificationService.MarkAsReadAsync(userId, id);
        if (!success)
            return NotFound();

        return Ok(new { success = true, id });
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var count = await _notificationService.MarkAllAsReadAsync(userId);
        return Ok(new { success = true, updatedCount = count });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteNotification(Guid id)
    {
        var userId = CurrentUserId;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var success = await _notificationService.DeleteNotificationAsync(userId, id);
        if (!success)
            return NotFound();

        return Ok(new { success = true });
    }
}

