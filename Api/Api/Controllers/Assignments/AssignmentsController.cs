using Api.Authorization;
using Implementation.DTO.Assignments;
using Implementation.DTO.Common;
using Implementation.Interfaces.Assignments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Assignments;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentService _assignmentService;

    public AssignmentsController(IAssignmentService assignmentService)
    {
        _assignmentService = assignmentService;
    }

    [HttpGet]
    [HasPermission("Assignments.View")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<SupportAssignmentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAssignments([FromQuery] AssignmentFilterRequest filter)
    {
        var result = await _assignmentService.GetAssignmentsAsync(filter);
        return Ok(ApiResponse<PagedResult<SupportAssignmentDto>>.SuccessResult(result));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Assignments.View")]
    [ProducesResponseType(typeof(ApiResponse<SupportAssignmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAssignmentById(Guid id)
    {
        var result = await _assignmentService.GetAssignmentByIdAsync(id);
        return Ok(ApiResponse<SupportAssignmentDto>.SuccessResult(result));
    }

    [HttpGet("by-project/{projectId:guid}")]
    [HasPermission("Assignments.View")]
    [ProducesResponseType(typeof(ApiResponse<List<SupportAssignmentDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAssignmentsByProject(Guid projectId)
    {
        var result = await _assignmentService.GetAssignmentsByProjectIdAsync(projectId);
        return Ok(ApiResponse<List<SupportAssignmentDto>>.SuccessResult(result));
    }

    [HttpGet("by-user/{userId}")]
    [HasPermission("Assignments.View")]
    [ProducesResponseType(typeof(ApiResponse<List<SupportAssignmentDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAssignmentsByUser(string userId)
    {
        var result = await _assignmentService.GetAssignmentsByUserIdAsync(userId);
        return Ok(ApiResponse<List<SupportAssignmentDto>>.SuccessResult(result));
    }

    [HttpPost]
    [HasPermission("Assignments.Manage")]
    [ProducesResponseType(typeof(ApiResponse<SupportAssignmentDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateAssignment([FromBody] CreateAssignmentDto request)
    {
        var result = await _assignmentService.CreateAssignmentAsync(request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<SupportAssignmentDto>.SuccessResult(result, "Team member assigned to project/module successfully.", StatusCodes.Status201Created));
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Assignments.Manage")]
    [ProducesResponseType(typeof(ApiResponse<SupportAssignmentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAssignment(Guid id, [FromBody] UpdateAssignmentDto request)
    {
        var result = await _assignmentService.UpdateAssignmentAsync(id, request);
        return Ok(ApiResponse<SupportAssignmentDto>.SuccessResult(result, "Assignment updated successfully."));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Assignments.Manage")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAssignment(Guid id)
    {
        await _assignmentService.DeleteAssignmentAsync(id);
        return Ok(ApiResponse.SuccessResult("Assignment removed successfully."));
    }
}

