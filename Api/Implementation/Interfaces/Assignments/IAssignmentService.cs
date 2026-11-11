using Implementation.DTO.Assignments;
using Implementation.DTO.Common;

namespace Implementation.Interfaces.Assignments;

public interface IAssignmentService
{
    Task<PagedResult<SupportAssignmentDto>> GetAssignmentsAsync(AssignmentFilterRequest filter);
    Task<SupportAssignmentDto> GetAssignmentByIdAsync(Guid id);
    Task<List<SupportAssignmentDto>> GetAssignmentsByProjectIdAsync(Guid projectId);
    Task<List<SupportAssignmentDto>> GetAssignmentsByUserIdAsync(string userId);
    Task<SupportAssignmentDto> CreateAssignmentAsync(CreateAssignmentDto dto);
    Task<SupportAssignmentDto> UpdateAssignmentAsync(Guid id, UpdateAssignmentDto dto);
    Task DeleteAssignmentAsync(Guid id);
}

