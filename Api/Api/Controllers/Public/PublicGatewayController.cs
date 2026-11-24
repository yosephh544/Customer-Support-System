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

    public PublicGatewayController(ILeadService leadService)
    {
        _leadService = leadService;
    }

    [HttpPost("leads")]
    [ProducesResponseType(typeof(ApiResponse<LeadDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitPublicInquiry([FromBody] PublicLeadSubmissionDto request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) ||
            string.IsNullOrWhiteSpace(request.OrganizationName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            return BadRequest(ApiResponse.Fail("Please fill out all required contact fields."));
        }

        var result = await _leadService.SubmitPublicLeadAsync(request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<LeadDto>.SuccessResult(result, "Thank you! Your inquiry has been submitted. Our enterprise solutions team will contact you shortly.", StatusCodes.Status201Created));
    }
}
