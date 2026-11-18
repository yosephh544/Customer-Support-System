using Implementation.Interfaces.Schedules;

namespace Api.BackgroundServices;

public class TouchpointRescheduleWorker : BackgroundService
{
    private static readonly TimeSpan StartupDelay = TimeSpan.FromSeconds(10);
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TouchpointRescheduleWorker> _logger;

    public TouchpointRescheduleWorker(
        IServiceScopeFactory scopeFactory,
        ILogger<TouchpointRescheduleWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await Task.Delay(StartupDelay, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var scheduleService = scope.ServiceProvider.GetRequiredService<IScheduleService>();
                var result = await scheduleService.RescheduleOverdueTouchpointsAsync();

                if (result.RescheduledCount > 0)
                {
                    _logger.LogInformation(
                        "Automatic rescheduler moved {Count} missed touchpoint(s) into upcoming days ({Unplaced} unplaced).",
                        result.RescheduledCount,
                        result.UnplacedCount);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Automatic touchpoint rescheduling run failed.");
            }

            try
            {
                await Task.Delay(Interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
