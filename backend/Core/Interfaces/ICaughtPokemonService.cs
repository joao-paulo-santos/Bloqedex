using Core.Entities;

namespace Core.Interfaces
{
    public interface ICaughtPokemonService
    {
        Task<CaughtPokemon?> GetCaughtPokemonByIdAsync(int id);
        Task<CaughtPokemon?> GetUserCaughtPokemonAsync(int userId, int pokemonId);
        Task<IReadOnlyList<CaughtPokemon>> GetUserCaughtPokemonPagedAsync(int userId, int pageIndex, int pageSize);
        Task<IReadOnlyList<CaughtPokemon>> GetUserFavoritePokemonAsync(int userId);
        Task<CaughtPokemon?> CatchPokemonAsync(int userId, int pokeApiId, string? notes = null);
        Task<CaughtPokemon?> UpdateCaughtPokemonAsync(int userId, int pokeApiId, string? notes, bool? isFavorite);
        Task<bool> ReleasePokemonAsync(int userId, int pokeApiId);
        Task<int> GetUserCaughtPokemonCountAsync(int userId);
        Task<bool> IsPokemonCaughtByUserAsync(int userId, int pokeApiId);
        Task<bool> SyncUserCaughtCountAsync(int userId);
        Task<IReadOnlyList<CaughtPokemon>> GetUserCaughtPokemonByPokemonIdsAsync(int userId, IEnumerable<int> pokemonIds);
        Task<(List<CaughtPokemon> SuccessfulCatches, List<string> Errors)> BulkCatchPokemonAsync(int userId, List<(int PokeApiId, string? Notes)> pokemonToCatch);
        Task<(int SuccessfulReleases, List<string> Errors)> BulkReleasePokemonAsync(int userId, List<int> pokeApiIds);
    }
}
