using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using Implementation.DTO.Commercial;
using Implementation.DTO.Common;
using Implementation.Interfaces.Commercial;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Public;

[ApiController]
[Route("api/public")]
[AllowAnonymous]
public class PublicGatewayController : ControllerBase
{
    private readonly ILeadService _leadService;

    // In-memory thread-safe sliding window rate-limiter (5 inquiries per 10 minutes per IP)
    private static readonly ConcurrentDictionary<string, ConcurrentQueue<DateTime>> _ipRequestLog = new();
    private static readonly TimeSpan RateLimitWindow = TimeSpan.FromMinutes(10);
    private const int MaxRequestsPerWindow = 5;

    public PublicGatewayController(ILeadService leadService)
    {
        _leadService = leadService;
    }

    [HttpPost("leads")]
    [ProducesResponseType(typeof(ApiResponse<LeadDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> SubmitPublicInquiry([FromBody] PublicLeadSubmissionDto request)
    {
        // 1. IP Throttling / Rate-Limiting Protection
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown-ip";
        var now = DateTime.UtcNow;

        var queue = _ipRequestLog.GetOrAdd(clientIp, _ => new ConcurrentQueue<DateTime>());
        while (queue.TryPeek(out var oldest) && (now - oldest) > RateLimitWindow)
        {
            queue.TryDequeue(out _);
        }

        if (queue.Count >= MaxRequestsPerWindow)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests,
                ApiResponse.Fail("Too many inquiry requests from your IP. Please wait a few minutes before submitting again."));
        }

        // 2. Input Validation
        if (string.IsNullOrWhiteSpace(request.FullName) ||
            string.IsNullOrWhiteSpace(request.OrganizationName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            return BadRequest(ApiResponse.Fail("Please fill out all required contact fields."));
        }

        // Validate email format
        var emailRegex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.IgnoreCase);
        if (!emailRegex.IsMatch(request.Email.Trim()))
        {
            return BadRequest(ApiResponse.Fail("Please provide a valid email address."));
        }

        // Validate phone number: minimum 7 digits
        var digitsOnly = Regex.Replace(request.PhoneNumber, @"[^\d]", "");
        if (digitsOnly.Length < 7 || digitsOnly.Length > 15)
        {
            return BadRequest(ApiResponse.Fail("Please provide a valid phone number."));
        }

        // 3. Input Sanitization (strip HTML / script tags)
        request.FullName = Sanitize(request.FullName);
        request.OrganizationName = Sanitize(request.OrganizationName);
        request.Email = request.Email.Trim().ToLowerInvariant();
        request.PhoneNumber = request.PhoneNumber.Trim();
        request.Region = string.IsNullOrWhiteSpace(request.Region) ? "Addis Ababa" : Sanitize(request.Region);
        request.InterestedModules = Sanitize(request.InterestedModules);
        request.Notes = Sanitize(request.Notes);

        queue.Enqueue(now);

        var result = await _leadService.SubmitPublicLeadAsync(request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<LeadDto>.SuccessResult(result, "Thank you! Your inquiry has been submitted. Our enterprise solutions team will contact you shortly.", StatusCodes.Status201Created));
    }

    private static string Sanitize(string? input)
    {
        if (string.IsNullOrEmpty(input)) return string.Empty;
        // Strip HTML tags and potential script injections
        var clean = Regex.Replace(input, @"<[^>]*>", string.Empty);
        return clean.Trim();
    }
}
