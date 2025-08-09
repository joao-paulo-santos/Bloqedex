using Core.Entities;

namespace Core.Interfaces
{
    public interface ICaughtPokemonService
    {
        Task<CaughtPokemon?> GetCaughtPokemonByIdAsync(int id);
        Task<CaughtPokemon?> GetUserCaughtPokemonAsync(int userId, int pokemonId);
        Task<IReadOnlyList<CaughtPokemon>> GetUserCaughtPokemonPagedAsync(int userId, int pageIndex, int pageSize);
        Task<IReadOnlyList<CaughtPokemon>> GetUserFavoritePokemonAsync(int userId);
        Task<CaughtPokemon?> CatchPokemonAsync(int userId, int pokemonId, string? notes = null);
        Task<CaughtPokemon?> UpdateCaughtPokemonAsync(int caughtPokemonId, string? notes, bool? isFavorite);
        Task<bool> ReleasePokemonAsync(int userId, int caughtPokemonId);
        Task<int> GetUserCaughtPokemonCountAsync(int userId);
        Task<bool> IsPokemonCaughtByUserAsync(int userId, int pokemonId);
        Task<bool> SyncUserCaughtCountAsync(int userId);
        Task<IReadOnlyList<CaughtPokemon>> GetUserCaughtPokemonByPokemonIdsAsync(int userId, IEnumerable<int> pokemonIds);
        Task<(List<CaughtPokemon> SuccessfulCatches, List<string> Errors)> BulkCatchPokemonAsync(int userId, List<(int PokemonId, string? Notes)> pokemonToCatch);
        Task<(int SuccessfulReleases, List<string> Errors)> BulkReleasePokemonAsync(int userId, List<int> caughtPokemonIds);
    }
}
