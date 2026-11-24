using Implementation.DTO.Commercial;

namespace Implementation.Interfaces.Commercial;

public interface ICampaignService
{
    Task<List<CampaignDto>> GetCampaignsAsync();
    Task<CampaignDto> GetCampaignByIdAsync(Guid id);
    Task<CampaignDto> CreateCampaignAsync(CreateCampaignDto request);
    Task<CampaignDto> UpdateCampaignAsync(Guid id, UpdateCampaignDto request);
    Task<bool> DeleteCampaignAsync(Guid id);
}
