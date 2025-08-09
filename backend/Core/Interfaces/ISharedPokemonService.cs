using Core.Entities;

namespace Core.Interfaces
{
    public interface ISharedPokemonService
    {
        Task<SharedPokemon?> CreateSinglePokemonShareAsync(int userId, int caughtPokemonId, string? title = null, string? description = null, DateTime? expiresAt = null, int? maxViews = null);
        Task<SharedPokemon?> CreateCollectionShareAsync(int userId, string? title = null, string? description = null, DateTime? expiresAt = null, int? maxViews = null);
        Task<SharedPokemon?> GetSharedPokemonByTokenAsync(string shareToken);
        Task<IReadOnlyList<SharedPokemon>> GetUserSharedPokemonAsync(int userId);
        Task<bool> UpdateSharedPokemonAsync(int shareId, int userId, string? title = null, string? description = null, DateTime? expiresAt = null, int? maxViews = null, bool? isActive = null);
        Task<bool> DeleteSharedPokemonAsync(int shareId, int userId);
        Task<bool> IncrementViewCountAsync(string shareToken);
        Task<SharedPokemon?> ValidateAndGetSharedPokemonAsync(string shareToken);
        Task CleanupExpiredSharesAsync();
    }
}
