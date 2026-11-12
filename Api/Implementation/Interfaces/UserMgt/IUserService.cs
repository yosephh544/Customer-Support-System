using Implementation.DTO.Common;
using Implementation.DTO.UserMgt;

namespace Implementation.Interfaces.UserMgt;

public interface IUserService
{
    Task<PagedResult<UserSummaryDto>> GetUsersAsync(UserFilterRequest filter);
    Task<UserDetailsDto> GetUserByIdAsync(string id);
    Task<UserDetailsDto> CreateUserAsync(CreateUserDto request);
    Task<UserDetailsDto> UpdateUserAsync(string id, UpdateUserDto request);
    Task<bool> ChangePasswordAsync(string id, ChangePasswordDto request);
    Task<bool> ToggleUserStatusAsync(string id, bool isActive);
    Task<UserDetailsDto> UpdateUserRolesAsync(string id, UpdateUserRolesDto request);
    Task DeleteUserAsync(string id);
    Task EnsureAdminUserAsync();
}

