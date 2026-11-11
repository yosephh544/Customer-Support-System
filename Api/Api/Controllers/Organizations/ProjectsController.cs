using Api.Authorization;
using Implementation.DTO.Common;
using Implementation.DTO.Modules;
using Implementation.DTO.Projects;
using Implementation.Interfaces.Modules;
using Implementation.Interfaces.Projects;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers.Organizations;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;
    private readonly IModuleService _moduleService;

    public ProjectsController(IProjectService projectService, IModuleService moduleService)
    {
        _projectService = projectService;
        _moduleService = moduleService;
    }

    #region Projects CRUD

    [HttpGet]
    [HasPermission("Projects.View")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ProjectSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProjects([FromQuery] ProjectFilterRequest filter)
    {
        var result = await _projectService.GetProjectsAsync(filter);
        return Ok(ApiResponse<PagedResult<ProjectSummaryDto>>.SuccessResult(result));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Projects.View")]
    [ProducesResponseType(typeof(ApiResponse<ProjectDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProjectById(Guid id)
    {
        var result = await _projectService.GetProjectByIdAsync(id);
        return Ok(ApiResponse<ProjectDetailsDto>.SuccessResult(result));
    }

    [HttpGet("by-organization/{organizationId:guid}")]
    [HasPermission("Projects.View")]
    [ProducesResponseType(typeof(ApiResponse<List<ProjectSummaryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProjectsByOrganization(Guid organizationId)
    {
        var result = await _projectService.GetProjectsByOrganizationIdAsync(organizationId);
        return Ok(ApiResponse<List<ProjectSummaryDto>>.SuccessResult(result));
    }

    [HttpPost]
    [HasPermission("Projects.Create")]
    [ProducesResponseType(typeof(ApiResponse<ProjectDetailsDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectDto request)
    {
        var result = await _projectService.CreateProjectAsync(request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<ProjectDetailsDto>.SuccessResult(result, "Project created successfully.", StatusCodes.Status201Created));
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Projects.Edit")]
    [ProducesResponseType(typeof(ApiResponse<ProjectDetailsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProject(Guid id, [FromBody] UpdateProjectDto request)
    {
        var result = await _projectService.UpdateProjectAsync(id, request);
        return Ok(ApiResponse<ProjectDetailsDto>.SuccessResult(result, "Project updated successfully."));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Projects.Delete")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProject(Guid id)
    {
        await _projectService.DeleteProjectAsync(id);
        return Ok(ApiResponse.SuccessResult("Project deleted successfully."));
    }

    #endregion

    #region Modules Under Project

    [HttpGet("{projectId:guid}/modules")]
    [HasPermission("Modules.View")]
    [ProducesResponseType(typeof(ApiResponse<List<ProjectModuleDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProjectModules(Guid projectId)
    {
        var result = await _moduleService.GetModulesByProjectIdAsync(projectId);
        return Ok(ApiResponse<List<ProjectModuleDto>>.SuccessResult(result));
    }

    [HttpGet("{projectId:guid}/modules/{moduleId:guid}")]
    [HasPermission("Modules.View")]
    [ProducesResponseType(typeof(ApiResponse<ProjectModuleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProjectModuleById(Guid projectId, Guid moduleId)
    {
        var result = await _moduleService.GetProjectModuleByIdAsync(projectId, moduleId);
        return Ok(ApiResponse<ProjectModuleDto>.SuccessResult(result));
    }

    [HttpPost("{projectId:guid}/modules")]
    [HasPermission("Modules.Create")]
    [ProducesResponseType(typeof(ApiResponse<ProjectModuleDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignModuleToProject(Guid projectId, [FromBody] AssignProjectModuleDto request)
    {
        var result = await _moduleService.AssignModuleToProjectAsync(projectId, request);
        return StatusCode(StatusCodes.Status201Created,
            ApiResponse<ProjectModuleDto>.SuccessResult(result, "Module assigned to project successfully.", StatusCodes.Status201Created));
    }

    [HttpPut("{projectId:guid}/modules/{moduleId:guid}")]
    [HasPermission("Modules.Edit")]
    [ProducesResponseType(typeof(ApiResponse<ProjectModuleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProjectModule(Guid projectId, Guid moduleId, [FromBody] UpdateProjectModuleDto request)
    {
        var result = await _moduleService.UpdateProjectModuleAsync(projectId, moduleId, request);
        return Ok(ApiResponse<ProjectModuleDto>.SuccessResult(result, "Project module updated successfully."));
    }

    [HttpDelete("{projectId:guid}/modules/{moduleId:guid}")]
    [HasPermission("Modules.Delete")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveModuleFromProject(Guid projectId, Guid moduleId)
    {
        await _moduleService.RemoveModuleFromProjectAsync(projectId, moduleId);
        return Ok(ApiResponse.SuccessResult("Module removed from project successfully."));
    }

    #endregion
}

