using Core.Entities;
using Core.Interfaces;
using Core.External.PokeApi;

namespace Application.Services
{
    public class PokemonService : IPokemonService
    {
        private const int MaxPageSize = 50;
        private const int DefaultPageSize = 20;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPokeApiService _pokeApiService;
        private readonly ILogger _logger;

        public PokemonService(IUnitOfWork unitOfWork, IPokeApiService pokeApiService, ILogger logger)
        {
            _unitOfWork = unitOfWork;
            _pokeApiService = pokeApiService;
            _logger = logger;
        }

        public async Task<Pokemon?> GetPokemonByIdAsync(int id)
        {
            return await _unitOfWork.PokemonRepository.GetPokemonByIdAsync(id);
        }

        public async Task<Pokemon?> GetOrFetchPokemonByPokeApiIdAsync(int pokeApiId)
        {
            // try to get from local db
            var pokemon = await _unitOfWork.PokemonRepository.GetPokemonByPokeApiIdAsync(pokeApiId);
            if (pokemon != null)
            {
                return pokemon;
            }

            // fetch from PokeAPI
            try
            {
                var pokeApiPokemon = await _pokeApiService.GetAsync<PokeApiPokemonResponse>($"pokemon/{pokeApiId}");
                if (pokeApiPokemon == null)
                    return null;

                // Create entity from PokeAPI response
                pokemon = Pokemon.FromPokeApiResponse(pokeApiPokemon);

                // cache the new pokemon
                var result = await _unitOfWork.PokemonRepository.AddPokemonAsync(pokemon);
                if (result != null)
                {
                    await _unitOfWork.SaveChangesAsync();
                    _logger.LogInformation($"Cached Pokemon {pokemon.Name} (ID: {pokeApiId}) from PokeAPI");
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching Pokemon {pokeApiId} from PokeAPI", ex);
                return null;
            }
        }

        public async Task<Pokemon?> GetOrFetchPokemonByNameAsync(string name)
        {
            // try to get from local db
            var pokemonList = await _unitOfWork.PokemonRepository.SearchPokemonByNameAsync(name.ToLower(), 0, 1);
            var pokemon = pokemonList.FirstOrDefault(p => p.Name.Equals(name, StringComparison.OrdinalIgnoreCase));

            if (pokemon != null)
            {
                return pokemon;
            }

            // fetch from PokeAPI
            try
            {
                var pokeApiPokemon = await _pokeApiService.GetAsync<PokeApiPokemonResponse>($"pokemon/{name.ToLower()}");
                if (pokeApiPokemon == null)
                    return null;

                // Create entity from PokeAPI response
                pokemon = Pokemon.FromPokeApiResponse(pokeApiPokemon);

                // cache the new pokemon
                var result = await _unitOfWork.PokemonRepository.AddPokemonAsync(pokemon);
                if (result != null)
                {
                    await _unitOfWork.SaveChangesAsync();
                    _logger.LogInformation($"Cached Pokemon {pokemon.Name} from PokeAPI via name search");
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error fetching Pokemon '{name}' from PokeAPI", ex);
                return null;
            }
        }

        public async Task<IReadOnlyList<Pokemon>> GetOrFetchPagedListOfPokemonAsync(int pageIndex, int pageSize)
        {
            pageSize = Math.Min(pageSize <= 0 ? DefaultPageSize : pageSize, MaxPageSize);

            // Calculate the PokeAPI ID range for this page
            var startId = (pageIndex * pageSize) + 1;
            var endId = startId + pageSize - 1;

            var existingPokemon = await _unitOfWork.PokemonRepository.GetPokemonByPokeApiIdRangeAsync(startId, endId);
            var existingIds = existingPokemon.Select(p => p.PokeApiId).ToHashSet();

            // Missing pokemons
            var missingIds = new List<int>();
            for (int id = startId; id <= endId; id++)
            {
                if (!existingIds.Contains(id))
                {
                    missingIds.Add(id);
                }
            }

            // Fetch missing
            if (missingIds.Any())
            {
                _logger.LogInformation($"Fetching {missingIds.Count} missing Pokemon for page {pageIndex} (IDs: {string.Join(", ", missingIds)})");

                foreach (var missingId in missingIds)
                {
                    try
                    {
                        await GetOrFetchPokemonByPokeApiIdAsync(missingId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"Failed to fetch Pokemon with ID {missingId}: {ex.Message}");
                    }
                }

                existingPokemon = await _unitOfWork.PokemonRepository.GetPokemonByPokeApiIdRangeAsync(startId, endId);
            }

            return existingPokemon;
        }

        public async Task<IReadOnlyList<Pokemon>> SearchPokemonByNameAsync(string name, int pageIndex, int pageSize)
        {
            pageSize = Math.Min(pageSize <= 0 ? DefaultPageSize : pageSize, MaxPageSize);
            return await _unitOfWork.PokemonRepository.SearchPokemonByNameAsync(name, pageIndex, pageSize);
        }

        public async Task<IReadOnlyList<Pokemon>> GetOrFetchPokemonByTypeAsync(string typeName, int pageIndex, int pageSize)
        {
            pageSize = Math.Min(pageSize <= 0 ? DefaultPageSize : pageSize, MaxPageSize);

            var isTypeComplete = await _unitOfWork.TypeSyncStatusRepository.IsTypeCompleteAsync(typeName);

            if (!isTypeComplete)
            {
                // Sync all in background
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await SyncPokemonByTypeAsync(typeName);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"Error syncing Pokemon for type '{typeName}'", ex);
                    }
                });
            }

            // Return local results while syncing
            return await _unitOfWork.PokemonRepository.GetPokemonByTypeAsync(typeName, pageIndex, pageSize);
        }

        public async Task<int> GetTotalPokemonCountAsync()
        {
            return await _pokeApiService.GetTotalPokemonCountAsync();
        }

        public async Task SyncPokemonFromPokeApiAsync(int maxCount = 0)
        {
            try
            {
                if (maxCount <= 0)
                {
                    maxCount = await _pokeApiService.GetTotalPokemonCountAsync();
                    _logger.LogInformation($"Retrieved total Pokemon count from PokeAPI: {maxCount}");
                }

                _logger.LogInformation($"Starting Pokemon sync from PokeAPI (max: {maxCount})");

                for (int i = 1; i <= maxCount; i++)
                {
                    var existingPokemon = await _unitOfWork.PokemonRepository.GetPokemonByPokeApiIdAsync(i);
                    if (existingPokemon != null)
                        continue;

                    await GetOrFetchPokemonByPokeApiIdAsync(i);

                    if (i % 50 == 0)
                    {
                        _logger.LogInformation($"Synced {i}/{maxCount} Pokemon");
                    }
                }

                _logger.LogInformation($"Completed Pokemon sync from PokeAPI");
            }
            catch (Exception ex)
            {
                _logger.LogError("Error during Pokemon sync", ex);
                throw;
            }
        }

        public async Task SyncPokemonByTypeAsync(string typeName)
        {
            try
            {
                _logger.LogInformation($"Starting Pokemon sync for type '{typeName}' from PokeAPI");

                await _unitOfWork.TypeSyncStatusRepository.MarkTypeAsIncompleteAsync(typeName);
                await _unitOfWork.SaveChangesAsync();

                var pokemonIds = await _pokeApiService.GetPokemonIdsByTypeAsync(typeName);

                _logger.LogInformation($"Found {pokemonIds.Count} Pokemon of type '{typeName}' in PokeAPI");

                // Fetch Missing
                int fetchedCount = 0;
                foreach (var pokemonId in pokemonIds)
                {
                    var existingPokemon = await _unitOfWork.PokemonRepository.GetPokemonByPokeApiIdAsync(pokemonId);
                    if (existingPokemon == null)
                    {
                        await GetOrFetchPokemonByPokeApiIdAsync(pokemonId);
                        fetchedCount++;
                    }
                }

                // Complete
                await _unitOfWork.TypeSyncStatusRepository.MarkTypeAsCompleteAsync(typeName);
                await _unitOfWork.SaveChangesAsync();

                _logger.LogInformation($"Completed Pokemon sync for type '{typeName}'. Fetched {fetchedCount} new Pokemon");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error during Pokemon sync for type '{typeName}'", ex);
                // incomplete
                try
                {
                    await _unitOfWork.TypeSyncStatusRepository.MarkTypeAsIncompleteAsync(typeName);
                    await _unitOfWork.SaveChangesAsync();
                }
                catch (Exception saveEx)
                {
                    _logger.LogError($"Error updating type sync status after failure", saveEx);
                }
                throw;
            }
        }
    }
}
