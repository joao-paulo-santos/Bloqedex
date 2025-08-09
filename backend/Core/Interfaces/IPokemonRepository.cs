using Core.Entities;

namespace Core.Interfaces
{
    public interface IPokemonRepository
    {
        Task<Pokemon?> GetPokemonByIdAsync(int id);
        Task<Pokemon?> GetPokemonByPokeApiIdAsync(int pokeApiId);
        Task<IReadOnlyList<Pokemon>> GetPokemonByPokeApiIdRangeAsync(int startId, int endId);
        Task<IReadOnlyList<Pokemon>> GetPagedListOfPokemonAsync(int pageIndex, int pageSize);
        Task<IReadOnlyList<Pokemon>> SearchPokemonByNameAsync(string name, int pageIndex, int pageSize);
        Task<IReadOnlyList<Pokemon>> GetPokemonByTypeAsync(string typeName, int pageIndex, int pageSize);
        Task<Pokemon?> AddPokemonAsync(Pokemon pokemon);
        Task<Pokemon?> UpdatePokemonAsync(Pokemon pokemon);
        Task<bool> DeletePokemonAsync(Pokemon pokemon);
        Task<int> GetTotalPokemonCountAsync();
    }
}
