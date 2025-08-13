using Core.External.PokeApi;
using Application.Services;
using Core.Entities;
using Core.Interfaces;
using Moq;
using Xunit;

namespace Testing.ApplicationTests
{
    public class PokemonServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IPokemonRepository> _mockPokemonRepository;
        private readonly Mock<ITypeSyncStatusRepository> _mockTypeSyncStatusRepository;
        private readonly Mock<IPokeApiService> _mockPokeApiService;
        private readonly Mock<ILogger> _mockLogger;
        private readonly PokemonService _pokemonService;

        public PokemonServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockPokemonRepository = new Mock<IPokemonRepository>();
            _mockTypeSyncStatusRepository = new Mock<ITypeSyncStatusRepository>();
            _mockPokeApiService = new Mock<IPokeApiService>();
            _mockLogger = new Mock<ILogger>();

            _mockUnitOfWork.Setup(x => x.PokemonRepository).Returns(_mockPokemonRepository.Object);
            _mockUnitOfWork.Setup(x => x.TypeSyncStatusRepository).Returns(_mockTypeSyncStatusRepository.Object);

            _pokemonService = new PokemonService(_mockUnitOfWork.Object, _mockPokeApiService.Object, _mockLogger.Object);
        }

        [Fact]
        // Test that when all Pokemon in a page range exist locally, no API calls are made
        public async Task GetOrFetchPagedListOfPokemonAsync_WithCompleteRange_ReturnsLocalDataOnly()
        {
            var pageIndex = 0;
            var pageSize = 5;
            var expectedPokemon = CreateTestPokemonList(1, 5);

            _mockPokemonRepository
                .Setup(x => x.GetPokemonByPokeApiIdRangeAsync(1, 5))
                .ReturnsAsync(expectedPokemon);

            var result = await _pokemonService.GetOrFetchPagedListOfPokemonAsync(pageIndex, pageSize);

            Assert.Equal(5, result.Count);
            Assert.Equal(expectedPokemon, result);

            _mockPokeApiService.Verify(x => x.GetAsync<It.IsAnyType>(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        // Test that when some Pokemon are missing from local cache, only the missing ones are fetched from API
        public async Task GetOrFetchPagedListOfPokemonAsync_WithMissingPokemon_FetchesMissingOnly()
        {
            var pageIndex = 0;
            var pageSize = 5;
            var existingPokemon = CreateTestPokemonList(new[] { 1, 3, 5 });
            var completeRange = CreateTestPokemonList(1, 5);

            _mockPokemonRepository
                .SetupSequence(x => x.GetPokemonByPokeApiIdRangeAsync(1, 5))
                .ReturnsAsync(existingPokemon)
                .ReturnsAsync(completeRange);

            _mockPokeApiService.Setup(x => x.GetAsync<PokeApiPokemonResponse>($"pokemon/2"))
                .ReturnsAsync(CreateMockPokeApiResponse(2, "ivysaur"));
            _mockPokeApiService.Setup(x => x.GetAsync<PokeApiPokemonResponse>($"pokemon/4"))
                .ReturnsAsync(CreateMockPokeApiResponse(4, "charmander"));

            _mockPokemonRepository.Setup(x => x.AddPokemonAsync(It.IsAny<Pokemon>()))
                .ReturnsAsync((Pokemon p) => p);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            var result = await _pokemonService.GetOrFetchPagedListOfPokemonAsync(pageIndex, pageSize);

            Assert.Equal(5, result.Count);

            _mockPokeApiService.Verify(x => x.GetAsync<PokeApiPokemonResponse>("pokemon/2"), Times.Once);
            _mockPokeApiService.Verify(x => x.GetAsync<PokeApiPokemonResponse>("pokemon/4"), Times.Once);
            _mockPokeApiService.Verify(x => x.GetAsync<PokeApiPokemonResponse>("pokemon/1"), Times.Never);
            _mockPokeApiService.Verify(x => x.GetAsync<PokeApiPokemonResponse>("pokemon/3"), Times.Never);
            _mockPokeApiService.Verify(x => x.GetAsync<PokeApiPokemonResponse>("pokemon/5"), Times.Never);
        }

        [Fact]
        // Test that when a Pokemon type is incomplete, background sync is triggered and local data is returned
        public async Task GetOrFetchPokemonByTypeAsync_WithIncompleteType_TriggersTypeSyncInBackground()
        {
            var typeName = "fire";
            var pageIndex = 0;
            var pageSize = 10;
            var localResults = CreateTestPokemonList(1, 3);

            _mockTypeSyncStatusRepository
                .Setup(x => x.IsTypeCompleteAsync(typeName))
                .ReturnsAsync(false);

            _mockPokemonRepository
                .Setup(x => x.GetPokemonByTypeAsync(typeName, pageIndex, pageSize))
                .ReturnsAsync(localResults);

            var result = await _pokemonService.GetOrFetchPokemonByTypeAsync(typeName, pageIndex, pageSize);

            Assert.Equal(localResults, result);

            _mockTypeSyncStatusRepository.Verify(x => x.IsTypeCompleteAsync(typeName), Times.Once);
        }

        [Fact]
        // Test that when a Pokemon type is complete, only local data is used without triggering sync
        public async Task GetOrFetchPokemonByTypeAsync_WithCompleteType_UsesLocalDataOnly()
        {
            var typeName = "water";
            var pageIndex = 0;
            var pageSize = 10;
            var localResults = CreateTestPokemonList(1, 10);

            _mockTypeSyncStatusRepository
                .Setup(x => x.IsTypeCompleteAsync(typeName))
                .ReturnsAsync(true);

            _mockPokemonRepository
                .Setup(x => x.GetPokemonByTypeAsync(typeName, pageIndex, pageSize))
                .ReturnsAsync(localResults);

            var result = await _pokemonService.GetOrFetchPokemonByTypeAsync(typeName, pageIndex, pageSize);

            Assert.Equal(localResults, result);
            _mockTypeSyncStatusRepository.Verify(x => x.IsTypeCompleteAsync(typeName), Times.Once);
        }

        [Fact]
        // Test that type sync marks the type as complete when all Pokemon are successfully fetched
        public async Task SyncPokemonByTypeAsync_MarksTypeAsCompleteWhenSuccessful()
        {
            var typeName = "electric";
            var pokemonIds = new List<int> { 25, 26, 100 };

            _mockPokeApiService
                .Setup(x => x.GetPokemonIdsByTypeAsync(typeName))
                .ReturnsAsync(pokemonIds);

            _mockPokemonRepository
                .Setup(x => x.GetPokemonByPokeApiIdAsync(It.IsAny<int>()))
                .ReturnsAsync((Pokemon?)null);

            _mockPokeApiService.Setup(x => x.GetAsync<PokeApiPokemonResponse>(It.IsAny<string>()))
                .ReturnsAsync((string endpoint) => CreateMockPokeApiResponse(
                    int.Parse(endpoint.Split('/').Last()), "test-pokemon"));

            _mockPokemonRepository.Setup(x => x.AddPokemonAsync(It.IsAny<Pokemon>()))
                .ReturnsAsync((Pokemon p) => p);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            await _pokemonService.SyncPokemonByTypeAsync(typeName);

            _mockTypeSyncStatusRepository.Verify(x => x.MarkTypeAsIncompleteAsync(typeName), Times.Once);
            _mockTypeSyncStatusRepository.Verify(x => x.MarkTypeAsCompleteAsync(typeName), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.AtLeastOnce);
        }

        [Fact]
        // Test that type sync marks the type as incomplete when an error occurs during fetching
        public async Task SyncPokemonByTypeAsync_MarksTypeAsIncompleteOnError()
        {
            var typeName = "poison";

            _mockPokeApiService
                .Setup(x => x.GetPokemonIdsByTypeAsync(typeName))
                .ThrowsAsync(new Exception("API Error"));

            await Assert.ThrowsAsync<Exception>(() => _pokemonService.SyncPokemonByTypeAsync(typeName));

            _mockTypeSyncStatusRepository.Verify(x => x.MarkTypeAsIncompleteAsync(typeName), Times.AtLeast(1));
        }

        [Fact]
        // Test that a valid Pokemon ID returns the expected Pokemon from the database
        public async Task GetPokemonByIdAsync_ValidId_ReturnsExpectedPokemon()
        {
            var pokemonId = 1;
            var expectedPokemon = CreateTestPokemon(pokemonId, "test-pokemon");

            _mockPokemonRepository.Setup(x => x.GetPokemonByIdAsync(pokemonId))
                .ReturnsAsync(expectedPokemon);

            var result = await _pokemonService.GetPokemonByIdAsync(pokemonId);

            Assert.NotNull(result);
            Assert.Equal(expectedPokemon.Name, result.Name);
            Assert.Equal(expectedPokemon.Id, result.Id);
        }

        [Fact]
        // Test that an invalid Pokemon ID returns null instead of throwing an error
        public async Task GetPokemonByIdAsync_InvalidId_ReturnsNull()
        {
            var invalidId = 999999;

            _mockPokemonRepository.Setup(x => x.GetPokemonByIdAsync(invalidId))
                .ReturnsAsync((Pokemon?)null);

            var result = await _pokemonService.GetPokemonByIdAsync(invalidId);

            Assert.Null(result);
        }

        [Fact]
        // Test that searching with an empty term returns an empty list without errors
        public async Task SearchPokemonByNameAsync_EmptySearchTerm_ReturnsEmptyList()
        {
            var emptySearchTerm = "";
            var pageIndex = 0;
            var pageSize = 10;

            _mockPokemonRepository.Setup(x => x.SearchPokemonByNameAsync(emptySearchTerm, pageIndex, pageSize))
                .ReturnsAsync(new List<Pokemon>());

            var result = await _pokemonService.SearchPokemonByNameAsync(emptySearchTerm, pageIndex, pageSize);

            Assert.NotNull(result);
            Assert.Empty(result);
        }

        [Fact]
        // Test that pagination works correctly by returning the right page of Pokemon
        public async Task GetOrFetchPagedListOfPokemonAsync_ValidPagination_ReturnsCorrectPage()
        {
            var pageIndex = 1;
            var pageSize = 5;
            var startId = 6; // (1 * 5) + 1
            var endId = 10; // startId + pageSize - 1
            var expectedPokemon = CreateTestPokemonList(6, 5);

            _mockPokemonRepository.Setup(x => x.GetPokemonByPokeApiIdRangeAsync(startId, endId))
                .ReturnsAsync(expectedPokemon);

            var result = await _pokemonService.GetOrFetchPagedListOfPokemonAsync(pageIndex, pageSize);

            Assert.NotNull(result);
            Assert.Equal(5, result.Count);
            Assert.Equal("pokemon-6", result.First().Name);
            Assert.Equal("pokemon-10", result.Last().Name);
        }

        [Fact]
        // Test that the total Pokemon count is correctly retrieved from the PokeAPI service
        public async Task GetTotalPokemonCountAsync_ReturnsPokeApiServiceCount()
        {
            var expectedCount = 1025;
            _mockPokeApiService.Setup(x => x.GetTotalPokemonCountAsync())
                .ReturnsAsync(expectedCount);

            var result = await _pokemonService.GetTotalPokemonCountAsync();

            Assert.Equal(expectedCount, result);
            _mockPokeApiService.Verify(x => x.GetTotalPokemonCountAsync(), Times.Once);
        }

        [Fact]
        // Test that when a Pokemon exists in cache, it's returned without calling the API
        public async Task GetOrFetchPokemonByPokeApiIdAsync_ExistingPokemon_ReturnsPokemon()
        {
            var pokeApiId = 25;
            var expectedPokemon = CreateTestPokemon(pokeApiId, "pikachu");

            _mockPokemonRepository.Setup(x => x.GetPokemonByPokeApiIdAsync(pokeApiId))
                .ReturnsAsync(expectedPokemon);

            var result = await _pokemonService.GetOrFetchPokemonByPokeApiIdAsync(pokeApiId);

            Assert.NotNull(result);
            Assert.Equal(expectedPokemon.PokeApiId, result.PokeApiId);
            Assert.Equal(expectedPokemon.Name, result.Name);
        }

        [Fact]
        // Test that when a Pokemon doesn't exist in cache, it's fetched from the API and cached
        public async Task GetOrFetchPokemonByPokeApiIdAsync_NonExistingPokemon_FetchesFromApi()
        {
            var pokeApiId = 150;
            var apiResponse = CreateMockPokeApiResponse(pokeApiId, "mewtwo");

            _mockPokemonRepository.Setup(x => x.GetPokemonByPokeApiIdAsync(pokeApiId))
                .ReturnsAsync((Pokemon?)null);
            _mockPokeApiService.Setup(x => x.GetAsync<PokeApiPokemonResponse>($"pokemon/{pokeApiId}"))
                .ReturnsAsync(apiResponse);
            _mockPokemonRepository.Setup(x => x.AddPokemonAsync(It.IsAny<Pokemon>()))
                .ReturnsAsync((Pokemon p) => p);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            var result = await _pokemonService.GetOrFetchPokemonByPokeApiIdAsync(pokeApiId);

            Assert.NotNull(result);
            Assert.Equal(pokeApiId, result.PokeApiId);
            Assert.Equal("mewtwo", result.Name);
            _mockPokeApiService.Verify(x => x.GetAsync<PokeApiPokemonResponse>($"pokemon/{pokeApiId}"), Times.Once);
            _mockPokemonRepository.Verify(x => x.AddPokemonAsync(It.IsAny<Pokemon>()), Times.Once);
        }

        [Fact]
        // Test that searching by name returns Pokemon that match the search term
        public async Task SearchPokemonByNameAsync_ValidSearchTerm_ReturnsMatchingPokemon()
        {
            var searchTerm = "pi";
            var pageIndex = 0;
            var pageSize = 10;
            var expectedResults = new List<Pokemon>
            {
                CreateTestPokemon(25, "pikachu"),
                CreateTestPokemon(172, "pichu")
            };

            _mockPokemonRepository.Setup(x => x.SearchPokemonByNameAsync(searchTerm, pageIndex, pageSize))
                .ReturnsAsync(expectedResults);

            var result = await _pokemonService.SearchPokemonByNameAsync(searchTerm, pageIndex, pageSize);

            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
            Assert.All(result, p => Assert.True(p.Name.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)));
        }

        [Fact]
        // Test that when a Pokemon name exists in cache, it's returned without calling the API
        public async Task GetOrFetchPokemonByNameAsync_ExistingPokemon_ReturnsPokemon()
        {
            var pokemonName = "pikachu";
            var expectedPokemon = CreateTestPokemon(25, pokemonName);

            _mockPokemonRepository.Setup(x => x.SearchPokemonByNameAsync(pokemonName, 0, 1))
                .ReturnsAsync(new List<Pokemon> { expectedPokemon });

            var result = await _pokemonService.GetOrFetchPokemonByNameAsync(pokemonName);

            Assert.NotNull(result);
            Assert.Equal(expectedPokemon.Name, result.Name);
            Assert.Equal(expectedPokemon.PokeApiId, result.PokeApiId);
            _mockPokeApiService.Verify(x => x.GetAsync<PokeApiPokemonResponse>(It.IsAny<string>()), Times.Never);
        }

        [Fact]
        // Test that when a Pokemon name doesn't exist in cache, it's fetched from the API by name
        public async Task GetOrFetchPokemonByNameAsync_NonExistingPokemon_FetchesFromApi()
        {
            var pokemonName = "mewtwo";
            var apiResponse = CreateMockPokeApiResponse(150, pokemonName);

            _mockPokemonRepository.Setup(x => x.SearchPokemonByNameAsync(pokemonName, 0, 1))
                .ReturnsAsync(new List<Pokemon>());
            _mockPokeApiService.Setup(x => x.GetAsync<PokeApiPokemonResponse>($"pokemon/{pokemonName}"))
                .ReturnsAsync(apiResponse);
            _mockPokemonRepository.Setup(x => x.AddPokemonAsync(It.IsAny<Pokemon>()))
                .ReturnsAsync((Pokemon p) => p);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            var result = await _pokemonService.GetOrFetchPokemonByNameAsync(pokemonName);

            Assert.NotNull(result);
            Assert.Equal(pokemonName, result.Name);
            _mockPokeApiService.Verify(x => x.GetAsync<PokeApiPokemonResponse>($"pokemon/{pokemonName}"), Times.Once);
            _mockPokemonRepository.Verify(x => x.AddPokemonAsync(It.IsAny<Pokemon>()), Times.Once);
        }

        [Fact]
        // Test that admin sync successfully fetches and stores multiple Pokemon from the API
        public async Task SyncPokemonFromPokeApiAsync_AdminSync_FetchesPokemonSuccessfully()
        {
            var maxCount = 10;
            var apiResponses = Enumerable.Range(1, maxCount)
                .Select(id => CreateMockPokeApiResponse(id, $"pokemon-{id}"))
                .ToList();

            _mockPokemonRepository.Setup(x => x.GetPokemonByPokeApiIdAsync(It.IsAny<int>()))
                .ReturnsAsync((Pokemon?)null);

            foreach (var response in apiResponses)
            {
                _mockPokeApiService.Setup(x => x.GetAsync<PokeApiPokemonResponse>($"pokemon/{response.Id}"))
                    .ReturnsAsync(response);
            }

            _mockPokemonRepository.Setup(x => x.AddPokemonAsync(It.IsAny<Pokemon>()))
                .ReturnsAsync((Pokemon p) => p);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            await _pokemonService.SyncPokemonFromPokeApiAsync(maxCount);

            _mockPokemonRepository.Verify(x => x.AddPokemonAsync(It.IsAny<Pokemon>()), Times.Exactly(maxCount));
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.AtLeastOnce);
        }

        [Fact]
        // Test the complete flow of fetching a Pokemon from API and adding it to the database
        public async Task GetOrFetchPokemonByPokeApiIdAsync_PokemonNotInDb_FetchesFromApiAndAddsToDb()
        {
            var pokeApiId = 1;
            var expectedName = "bulbasaur";

            _mockPokemonRepository.Setup(x => x.GetPokemonByPokeApiIdAsync(pokeApiId))
                .ReturnsAsync((Pokemon?)null);

            var apiResponse = CreateMockPokeApiResponse(pokeApiId, expectedName);
            _mockPokeApiService.Setup(x => x.GetAsync<PokeApiPokemonResponse>($"pokemon/{pokeApiId}"))
                .ReturnsAsync(apiResponse);

            _mockPokemonRepository.Setup(x => x.AddPokemonAsync(It.IsAny<Pokemon>()))
                .ReturnsAsync((Pokemon p) => p);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            var result = await _pokemonService.GetOrFetchPokemonByPokeApiIdAsync(pokeApiId);

            Assert.NotNull(result);
            Assert.Equal(expectedName, result.Name);
            Assert.Equal(pokeApiId, result.PokeApiId);

            _mockPokemonRepository.Verify(x => x.GetPokemonByPokeApiIdAsync(pokeApiId), Times.Once);

            _mockPokeApiService.Verify(x => x.GetAsync<PokeApiPokemonResponse>($"pokemon/{pokeApiId}"), Times.Once);

            _mockPokemonRepository.Verify(x => x.AddPokemonAsync(It.IsAny<Pokemon>()), Times.Once);

            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }

        //Helper Functions
        private List<Pokemon> CreateTestPokemonList(int start, int count)
        {
            var pokemon = new List<Pokemon>();
            for (int i = 0; i < count; i++)
            {
                pokemon.Add(CreateTestPokemon(start + i, $"pokemon-{start + i}"));
            }
            return pokemon;
        }

        private List<Pokemon> CreateTestPokemonList(int[] ids)
        {
            return ids.Select(id => CreateTestPokemon(id, $"pokemon-{id}")).ToList();
        }

        private Pokemon CreateTestPokemon(int pokeApiId, string name)
        {
            return new Pokemon
            {
                Id = pokeApiId,
                PokeApiId = pokeApiId,
                Name = name,
                Height = 10,
                Weight = 100,
                HP = 50,
                Attack = 60,
                Defense = 50,
                SpecialAttack = 70,
                SpecialDefense = 60,
                Speed = 80,
                CreatedDate = DateTime.UtcNow,
                PokemonTypes = new List<PokemonType>
                {
                    new PokemonType { TypeName = "normal", Slot = 1 }
                }
            };
        }

        private PokeApiPokemonResponse CreateMockPokeApiResponse(int id, string name)
        {
            return new PokeApiPokemonResponse
            {
                Id = id,
                Name = name,
                Height = 10,
                Weight = 100,
                Stats = new List<PokeApiStat>
                {
                    new() { BaseStat = 50, Stat = new() { Name = "hp" } },
                    new() { BaseStat = 60, Stat = new() { Name = "attack" } },
                    new() { BaseStat = 50, Stat = new() { Name = "defense" } },
                    new() { BaseStat = 70, Stat = new() { Name = "special-attack" } },
                    new() { BaseStat = 60, Stat = new() { Name = "special-defense" } },
                    new() { BaseStat = 80, Stat = new() { Name = "speed" } }
                },
                Types = new List<PokeApiType>
                {
                    new() { Slot = 1, Type = new() { Name = "normal" } }
                },
                Sprites = new PokeApiSprites
                {
                    FrontDefault = "sprite-url",
                    Other = new PokeApiOther
                    {
                        OfficialArtwork = new PokeApiOfficialArtwork
                        {
                            FrontDefault = "artwork-url"
                        }
                    }
                }
            };
        }
    }
}
