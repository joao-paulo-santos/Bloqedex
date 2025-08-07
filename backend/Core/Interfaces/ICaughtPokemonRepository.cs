using Core.Entities;

namespace Core.Interfaces
{
    public interface ICaughtPokemonRepository
    {
        Task<CaughtPokemon?> GetCaughtPokemonByIdAsync(int id);
        Task<CaughtPokemon?> GetUserCaughtPokemonAsync(int userId, int pokemonId);
        Task<IReadOnlyList<CaughtPokemon>> GetUserCaughtPokemonPagedAsync(int userId, int pageIndex, int pageSize);
        Task<IReadOnlyList<CaughtPokemon>> GetUserFavoritePokemonAsync(int userId);
        Task<CaughtPokemon?> AddCaughtPokemonAsync(CaughtPokemon caughtPokemon);
        Task<CaughtPokemon?> UpdateCaughtPokemonAsync(CaughtPokemon caughtPokemon);
        Task<bool> DeleteCaughtPokemonAsync(CaughtPokemon caughtPokemon);
        Task<int> GetUserCaughtPokemonCountAsync(int userId);
    }
}
