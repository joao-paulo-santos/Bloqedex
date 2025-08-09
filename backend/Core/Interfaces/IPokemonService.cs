using Core.Entities;

namespace Core.Interfaces
{
    public interface IPokemonService
    {
        Task<Pokemon?> GetPokemonByIdAsync(int id);
        Task<Pokemon?> GetOrFetchPokemonByPokeApiIdAsync(int pokeApiId);
        Task<Pokemon?> GetOrFetchPokemonByNameAsync(string name);
        Task<IReadOnlyList<Pokemon>> GetOrFetchPagedListOfPokemonAsync(int pageIndex, int pageSize);
        Task<IReadOnlyList<Pokemon>> SearchPokemonByNameAsync(string name, int pageIndex, int pageSize);
        Task<IReadOnlyList<Pokemon>> GetOrFetchPokemonByTypeAsync(string typeName, int pageIndex, int pageSize);
        Task<int> GetTotalPokemonCountAsync();
        Task SyncPokemonFromPokeApiAsync(int maxCount = 0);
        Task SyncPokemonByTypeAsync(string typeName);
    }
}
