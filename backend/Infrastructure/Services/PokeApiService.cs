using Core.Interfaces;
using Core.External.PokeApi;
using Newtonsoft.Json;
using System.Net;

namespace Infrastructure.Services
{
    public class PokeApiService : IPokeApiService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger _logger;
        private readonly IPokeApiRateLimiter _rateLimiter;
        private readonly string _baseUrl = "https://pokeapi.co/api/v2/";
        private static int? _cachedTotalCount = null;
        private static DateTime? _cacheExpiry = null;
        private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(24);

        public PokeApiService(HttpClient httpClient, ILogger logger, IPokeApiRateLimiter rateLimiter)
        {
            _httpClient = httpClient;
            _logger = logger;
            _rateLimiter = rateLimiter;
            _httpClient.BaseAddress = new Uri(_baseUrl);
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "BloqedexApi/1.0");
        }

        public async Task<T?> GetAsync<T>(string endpoint)
        {
            try
            {
                await _rateLimiter.DelayIfNeededAsync();

                var response = await _httpClient.GetAsync(endpoint);

                if (response.StatusCode == HttpStatusCode.NotFound)
                {
                    return default(T);
                }

                if (response.StatusCode == HttpStatusCode.TooManyRequests)
                {
                    _logger.LogWarning($"Rate limit exceeded for PokeAPI endpoint: {endpoint}");

                    // Wait longer and retry once
                    await Task.Delay(TimeSpan.FromSeconds(3));
                    response = await _httpClient.GetAsync(endpoint);
                }

                response.EnsureSuccessStatusCode();

                var jsonContent = await response.Content.ReadAsStringAsync();
                var result = JsonConvert.DeserializeObject<T>(jsonContent);

                return result;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError($"HTTP error when calling PokeAPI endpoint {endpoint}", ex);
                throw;
            }
            catch (JsonException ex)
            {
                _logger.LogError($"JSON deserialization error for PokeAPI endpoint {endpoint}", ex);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Unexpected error when calling PokeAPI endpoint {endpoint}", ex);
                throw;
            }
        }

        public async Task<int> GetTotalPokemonCountAsync()
        {
            try
            {
                if (_cachedTotalCount.HasValue && _cacheExpiry.HasValue && DateTime.UtcNow < _cacheExpiry.Value)
                {
                    return _cachedTotalCount.Value;
                }

                var response = await GetAsync<PokeApiResourceList>("pokemon-species?limit=1");
                var totalCount = response?.Count ?? 1025;

                _cachedTotalCount = totalCount;
                _cacheExpiry = DateTime.UtcNow.Add(CacheDuration);

                return totalCount;
            }
            catch (Exception ex)
            {
                _logger.LogError("Error getting total Pokemon count from PokeAPI", ex);

                if (_cachedTotalCount.HasValue)
                {
                    return _cachedTotalCount.Value;
                }

                return 1025;
            }
        }

        public async Task<List<int>> GetPokemonIdsByTypeAsync(string typeName)
        {
            try
            {
                var response = await GetAsync<PokeApiTypeResponse>($"type/{typeName.ToLower()}");
                if (response?.Pokemon == null)
                    return new List<int>();

                var pokemonIds = new List<int>();
                foreach (var pokemonEntry in response.Pokemon)
                {
                    var url = pokemonEntry.Pokemon.Url;
                    var segments = url.TrimEnd('/').Split('/');
                    if (segments.Length > 0 && int.TryParse(segments[^1], out int id))
                    {
                        pokemonIds.Add(id);
                    }
                }

                return pokemonIds;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting Pokemon IDs for type '{typeName}' from PokeAPI", ex);
                return new List<int>();
            }
        }
    }
}
