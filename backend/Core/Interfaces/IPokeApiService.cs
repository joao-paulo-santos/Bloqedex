namespace Core.Interfaces
{
    public interface IPokeApiService
    {
        Task<T?> GetAsync<T>(string endpoint);
        Task<int> GetTotalPokemonCountAsync();
        Task<List<int>> GetPokemonIdsByTypeAsync(string typeName);
    }
}
