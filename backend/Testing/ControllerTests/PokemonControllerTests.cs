using BloqedexApi.Controllers;
using BloqedexApi.DTOs;
using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using Xunit;

namespace Testing.ControllerTests
{
    public class PokemonControllerTests
    {
        private readonly Mock<IPokemonService> _mockPokemonService;
        private readonly Mock<ICaughtPokemonService> _mockCaughtPokemonService;
        private readonly Mock<IUserService> _mockUserService;
        private readonly PokemonController _controller;

        public PokemonControllerTests()
        {
            _mockPokemonService = new Mock<IPokemonService>();
            _mockCaughtPokemonService = new Mock<ICaughtPokemonService>();
            _mockUserService = new Mock<IUserService>();
            _controller = new PokemonController(
                _mockPokemonService.Object,
                _mockCaughtPokemonService.Object,
                _mockUserService.Object
            );
        }

        // Tests retrieving paginated Pokemon list with default page index
        [Fact]
        public async Task GetPokemon_WithPageIndex_ReturnsPaginatedPokemon()
        {
            var searchDto = new PokemonSearchDto
            {
                PageIndex = 0,
                PageSize = 20
            };

            var pokemon = new List<Pokemon>
            {
                new Pokemon { Id = 1, PokeApiId = 1, Name = "Bulbasaur" },
                new Pokemon { Id = 2, PokeApiId = 2, Name = "Ivysaur" }
            };

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            _mockPokemonService.Setup(s => s.GetOrFetchPagedListOfPokemonAsync(searchDto.PageIndex, searchDto.PageSize))
                .ReturnsAsync(pokemon);
            _mockPokemonService.Setup(s => s.GetTotalPokemonCountAsync())
                .ReturnsAsync(151);

            var result = await _controller.GetPokemon(searchDto);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var pokemonListDto = Assert.IsType<PokemonListDto>(okResult.Value);
            Assert.Equal(151, pokemonListDto.TotalCount);
            Assert.Equal(0, pokemonListDto.PageIndex);
            Assert.Equal(20, pokemonListDto.PageSize);
        }

        // Tests searching for Pokemon by name returns specific Pokemon
        [Fact]
        public async Task GetPokemon_WithName_ReturnsSpecificPokemon()
        {
            var searchDto = new PokemonSearchDto
            {
                Name = "Pikachu",
                PageIndex = 0,
                PageSize = 20
            };

            var pokemon = new Pokemon { Id = 25, PokeApiId = 25, Name = "Pikachu" };

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            _mockPokemonService.Setup(s => s.GetOrFetchPokemonByNameAsync(searchDto.Name))
                .ReturnsAsync(pokemon);

            var result = await _controller.GetPokemon(searchDto);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var pokemonListDto = Assert.IsType<PokemonListDto>(okResult.Value);
            Assert.Equal(1, pokemonListDto.TotalCount);
            Assert.Single(pokemonListDto.Pokemon);
            Assert.Equal("Pikachu", pokemonListDto.Pokemon[0].Name);
        }

        // Tests filtering Pokemon by type returns Pokemon matching that type
        [Fact]
        public async Task GetPokemon_WithType_ReturnsPokemonOfType()
        {
            var searchDto = new PokemonSearchDto
            {
                Type = "Fire",
                PageIndex = 0,
                PageSize = 20
            };

            var pokemon = new List<Pokemon>
            {
                new Pokemon { Id = 4, PokeApiId = 4, Name = "Charmander" },
                new Pokemon { Id = 5, PokeApiId = 5, Name = "Charmeleon" }
            };

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            _mockPokemonService.Setup(s => s.GetOrFetchPokemonByTypeAsync(searchDto.Type, searchDto.PageIndex, searchDto.PageSize))
                .ReturnsAsync(pokemon);

            var result = await _controller.GetPokemon(searchDto);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var pokemonListDto = Assert.IsType<PokemonListDto>(okResult.Value);
            Assert.Equal(2, pokemonListDto.TotalCount);
            Assert.Equal(2, pokemonListDto.Pokemon.Count);
        }

        // Tests authenticated user gets Pokemon list with caught status included
        [Fact]
        public async Task GetPokemon_WithLoggedInUser_IncludesCaughtStatus()
        {
            var userId = 1;
            var searchDto = new PokemonSearchDto
            {
                PageIndex = 0,
                PageSize = 20
            };

            var pokemon = new List<Pokemon>
            {
                new Pokemon { Id = 1, PokeApiId = 1, Name = "Bulbasaur" }
            };

            var caughtPokemon = new List<CaughtPokemon>
            {
                new CaughtPokemon { Id = 1, UserId = userId, PokemonId = 1 }
            };

            SetupUserContext(userId);

            _mockPokemonService.Setup(s => s.GetOrFetchPagedListOfPokemonAsync(searchDto.PageIndex, searchDto.PageSize))
                .ReturnsAsync(pokemon);
            _mockPokemonService.Setup(s => s.GetTotalPokemonCountAsync())
                .ReturnsAsync(151);
            _mockCaughtPokemonService.Setup(s => s.GetUserCaughtPokemonByPokemonIdsAsync(userId, It.IsAny<List<int>>()))
                .ReturnsAsync(caughtPokemon);

            var result = await _controller.GetPokemon(searchDto);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var pokemonListDto = Assert.IsType<PokemonListDto>(okResult.Value);
            Assert.Single(pokemonListDto.Pokemon);
        }

        // Tests retrieving specific Pokemon by internal database ID
        [Fact]
        public async Task GetPokemonById_ExistingPokemon_ReturnsPokemon()
        {
            var pokemonId = 1;
            var pokemon = new Pokemon { Id = pokemonId, PokeApiId = 1, Name = "Bulbasaur" };

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            _mockPokemonService.Setup(s => s.GetPokemonByIdAsync(pokemonId))
                .ReturnsAsync(pokemon);

            var result = await _controller.GetPokemonById(pokemonId);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var pokemonDto = Assert.IsType<PokemonDto>(okResult.Value);
            Assert.Equal(pokemonId, pokemonDto.Id);
            Assert.Equal("Bulbasaur", pokemonDto.Name);
        }

        // Tests retrieving non-existent Pokemon by ID returns not found
        [Fact]
        public async Task GetPokemonById_NonExistentPokemon_ReturnsNotFound()
        {
            var pokemonId = 9999;

            _mockPokemonService.Setup(s => s.GetPokemonByIdAsync(pokemonId))
                .ReturnsAsync((Pokemon?)null);

            var result = await _controller.GetPokemonById(pokemonId);

            Assert.IsType<NotFoundResult>(result.Result);
        }

        // Tests authenticated user gets Pokemon details with caught status and date
        [Fact]
        public async Task GetPokemonById_WithLoggedInUserAndCaughtPokemon_ReturnsCaughtStatus()
        {
            var userId = 1;
            var pokemonId = 1;
            var pokemon = new Pokemon { Id = pokemonId, PokeApiId = 1, Name = "Bulbasaur" };
            var caughtPokemon = new CaughtPokemon
            {
                Id = 1,
                UserId = userId,
                PokemonId = pokemonId,
                CreatedDate = DateTime.UtcNow,
                CaughtDate = DateTime.UtcNow,
            };

            SetupUserContext(userId);

            _mockPokemonService.Setup(s => s.GetPokemonByIdAsync(pokemonId))
                .ReturnsAsync(pokemon);
            _mockCaughtPokemonService.Setup(s => s.GetUserCaughtPokemonAsync(userId, pokemonId))
                .ReturnsAsync(caughtPokemon);

            var result = await _controller.GetPokemonById(pokemonId);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var pokemonDto = Assert.IsType<PokemonDto>(okResult.Value);
            Assert.Equal(pokemonId, pokemonDto.Id);
        }

        // Tests retrieving Pokemon by PokeAPI ID returns correct Pokemon
        [Fact]
        public async Task GetPokemonByPokeApiId_ExistingPokemon_ReturnsPokemon()
        {
            var pokeApiId = 25;
            var pokemon = new Pokemon { Id = 25, PokeApiId = pokeApiId, Name = "Pikachu" };

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            _mockPokemonService.Setup(s => s.GetOrFetchPokemonByPokeApiIdAsync(pokeApiId))
                .ReturnsAsync(pokemon);

            var result = await _controller.GetPokemonByPokeApiId(pokeApiId);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var pokemonDto = Assert.IsType<PokemonDto>(okResult.Value);
            Assert.Equal(pokeApiId, pokemonDto.PokeApiId);
            Assert.Equal("Pikachu", pokemonDto.Name);
        }

        // Tests retrieving non-existent Pokemon by PokeAPI ID returns not found
        [Fact]
        public async Task GetPokemonByPokeApiId_NonExistentPokemon_ReturnsNotFound()
        {
            var pokeApiId = 9999;

            _mockPokemonService.Setup(s => s.GetOrFetchPokemonByPokeApiIdAsync(pokeApiId))
                .ReturnsAsync((Pokemon?)null);

            var result = await _controller.GetPokemonByPokeApiId(pokeApiId);

            Assert.IsType<NotFoundResult>(result.Result);
        }

        // Tests getting Pokemon summary by name returns simplified Pokemon data
        [Fact]
        public async Task GetPokemonSummary_WithName_ReturnsSpecificPokemonSummary()
        {
            var searchDto = new PokemonSearchDto
            {
                Name = "Pikachu",
                PageIndex = 0,
                PageSize = 20
            };

            var pokemon = new Pokemon { Id = 25, PokeApiId = 25, Name = "Pikachu" };

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            _mockPokemonService.Setup(s => s.GetOrFetchPokemonByNameAsync(searchDto.Name))
                .ReturnsAsync(pokemon);

            var result = await _controller.GetPokemonSummary(searchDto);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var pokemonSummaryListDto = Assert.IsType<PokemonSummaryListDto>(okResult.Value);
            Assert.Equal(1, pokemonSummaryListDto.TotalCount);
            Assert.Single(pokemonSummaryListDto.Pokemon);
            Assert.Equal("Pikachu", pokemonSummaryListDto.Pokemon[0].Name);
        }

        // Tests admin user can sync Pokemon data from PokeAPI
        [Fact]
        public async Task SyncPokemonFromPokeApi_ValidAdminRequest_ReturnsSuccess()
        {
            var userId = 1;
            var maxCount = 100;

            SetupAdminUserContext(userId);

            _mockPokemonService.Setup(s => s.SyncPokemonFromPokeApiAsync(maxCount))
                .Returns(Task.CompletedTask);

            var result = await _controller.SyncPokemonFromPokeApi(maxCount);

            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = okResult.Value;
            Assert.NotNull(response);
        }

        // Tests Pokemon sync handles service errors and returns server error
        [Fact]
        public async Task SyncPokemonFromPokeApi_ServiceThrowsException_ReturnsInternalServerError()
        {
            var userId = 1;
            var maxCount = 100;

            SetupAdminUserContext(userId);

            _mockPokemonService.Setup(s => s.SyncPokemonFromPokeApiAsync(maxCount))
                .ThrowsAsync(new Exception("Sync failed"));

            var result = await _controller.SyncPokemonFromPokeApi(maxCount);

            var statusCodeResult = Assert.IsType<ObjectResult>(result);
            Assert.Equal(500, statusCodeResult.StatusCode);
        }

        // Tests getting Pokemon statistics with user shows user's caught count
        [Fact]
        public async Task GetPokemonStats_WithUser_ReturnsStatsWithUserCaughtCount()
        {
            var userId = 1;
            var user = new User
            {
                Id = userId,
                Username = "testuser",
                Email = "test@example.com",
                PasswordHash = "hash",
                CaughtCount = 50
            };

            SetupUserContext(userId);

            _mockPokemonService.Setup(s => s.GetTotalPokemonCountAsync())
                .ReturnsAsync(151);
            _mockUserService.Setup(s => s.GetUserByIdAsync(userId))
                .ReturnsAsync(user);

            var result = await _controller.GetPokemonStats();

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        // Helper functions
        private void SetupUserContext(int userId)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
        }

        private void SetupAdminUserContext(int userId)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, "Admin")
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
        }
    }
}
