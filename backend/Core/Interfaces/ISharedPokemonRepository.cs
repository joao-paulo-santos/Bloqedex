using Core.Entities;

namespace Core.Interfaces
{
    public interface ISharedPokemonRepository
    {
        Task<SharedPokemon?> GetSharedPokemonByIdAsync(int id);
        Task<SharedPokemon?> GetSharedPokemonByTokenAsync(string shareToken);
        Task<IReadOnlyList<SharedPokemon>> GetUserSharedPokemonAsync(int userId);
        Task<SharedPokemon?> AddSharedPokemonAsync(SharedPokemon sharedPokemon);
        Task<SharedPokemon?> UpdateSharedPokemonAsync(SharedPokemon sharedPokemon);
        Task<bool> DeleteSharedPokemonAsync(SharedPokemon sharedPokemon);
        Task<bool> IncrementViewCountAsync(string shareToken);
        Task<IReadOnlyList<SharedPokemon>> GetExpiredSharedPokemonAsync();
    }
}
