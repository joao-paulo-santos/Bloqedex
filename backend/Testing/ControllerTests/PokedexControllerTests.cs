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
    public class PokedexControllerTests
    {
        private readonly Mock<ICaughtPokemonService> _mockCaughtPokemonService;
        private readonly Mock<IPokemonService> _mockPokemonService;
        private readonly PokedexController _controller;

        public PokedexControllerTests()
        {
            _mockCaughtPokemonService = new Mock<ICaughtPokemonService>();
            _mockPokemonService = new Mock<IPokemonService>();
            _controller = new PokedexController(_mockCaughtPokemonService.Object, _mockPokemonService.Object);
        }

        // Tests retrieving user's caught Pokemon with pagination
        [Fact]
        public async Task GetCaughtPokemon_ValidUser_ReturnsCaughtPokemon()
        {
            var userId = 1;
            var pageIndex = 0;
            var pageSize = 20;

            var caughtPokemon = new List<CaughtPokemon>
            {
                new CaughtPokemon
                {
                    Id = 1,
                    UserId = userId,
                    PokemonId = 1,
                    Pokemon = new Pokemon { Id = 1, PokeApiId = 1, Name = "Bulbasaur" },
                    CreatedDate = DateTime.UtcNow
                }
            };

            SetupUserContext(userId);

            _mockCaughtPokemonService.Setup(s => s.GetUserCaughtPokemonPagedAsync(userId, pageIndex, pageSize))
                .ReturnsAsync(caughtPokemon);
            _mockCaughtPokemonService.Setup(s => s.GetUserCaughtPokemonCountAsync(userId))
                .ReturnsAsync(1);

            var result = await _controller.GetCaughtPokemon(pageIndex, pageSize);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var caughtPokemonListDto = Assert.IsType<CaughtPokemonListDto>(okResult.Value);
            Assert.Equal(1, caughtPokemonListDto.TotalCount);
            Assert.Equal(pageIndex, caughtPokemonListDto.PageIndex);
            Assert.Equal(pageSize, caughtPokemonListDto.PageSize);
        }

        // Tests getting caught Pokemon without authentication returns unauthorized
        [Fact]
        public async Task GetCaughtPokemon_NoUser_ReturnsUnauthorized()
        {
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            var result = await _controller.GetCaughtPokemon();

            Assert.IsType<UnauthorizedResult>(result.Result);
        }

        // Tests retrieving user's favorite Pokemon collection
        [Fact]
        public async Task GetFavoritePokemon_ValidUser_ReturnsFavorites()
        {
            var userId = 1;
            var favoritePokemon = new List<CaughtPokemon>
            {
                new CaughtPokemon
                {
                    Id = 1,
                    UserId = userId,
                    PokemonId = 1,
                    Pokemon = new Pokemon { Id = 1, PokeApiId = 1, Name = "Bulbasaur" },
                    IsFavorite = true,
                    CreatedDate = DateTime.UtcNow
                }
            };

            SetupUserContext(userId);

            _mockCaughtPokemonService.Setup(s => s.GetUserFavoritePokemonAsync(userId))
                .ReturnsAsync(favoritePokemon);

            var result = await _controller.GetFavoritePokemon();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var caughtPokemonDtos = Assert.IsType<List<CaughtPokemonDto>>(okResult.Value);
            Assert.Single(caughtPokemonDtos);
        }

        // Tests getting favorite Pokemon without authentication returns unauthorized
        [Fact]
        public async Task GetFavoritePokemon_NoUser_ReturnsUnauthorized()
        {
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            var result = await _controller.GetFavoritePokemon();

            Assert.IsType<UnauthorizedResult>(result.Result);
        }

        // Tests catching a Pokemon with valid request returns caught Pokemon
        [Fact]
        public async Task CatchPokemon_ValidRequest_ReturnsCaughtPokemon()
        {
            var userId = 1;
            var catchDto = new CatchPokemonDto
            {
                PokemonId = 1,
                Notes = "Caught in the wild"
            };

            var caughtPokemon = new CaughtPokemon
            {
                Id = 1,
                UserId = userId,
                PokemonId = 1,
                Pokemon = new Pokemon { Id = 1, PokeApiId = 1, Name = "Bulbasaur" },
                Notes = catchDto.Notes,
                CreatedDate = DateTime.UtcNow
            };

            SetupUserContext(userId);

            _mockCaughtPokemonService.Setup(s => s.CatchPokemonAsync(userId, catchDto.PokemonId, catchDto.Notes))
                .ReturnsAsync(caughtPokemon);

            var result = await _controller.CatchPokemon(catchDto);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var caughtPokemonDto = Assert.IsType<CaughtPokemonDto>(okResult.Value);
            Assert.Equal(caughtPokemon.Id, caughtPokemonDto.Id);
            Assert.Equal(caughtPokemon.Notes, caughtPokemonDto.Notes);
        }

        // Tests catching non-existent Pokemon returns bad request
        [Fact]
        public async Task CatchPokemon_PokemonNotFound_ReturnsBadRequest()
        {
            var userId = 1;
            var catchDto = new CatchPokemonDto
            {
                PokemonId = 999,
                Notes = "Non-existent Pokemon"
            };

            SetupUserContext(userId);

            _mockCaughtPokemonService.Setup(s => s.CatchPokemonAsync(userId, catchDto.PokemonId, catchDto.Notes))
                .ReturnsAsync((CaughtPokemon?)null);

            var result = await _controller.CatchPokemon(catchDto);

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Pokemon not found or already caught", badRequestResult.Value);
        }

        // Tests bulk catching multiple Pokemon returns operation results
        [Fact]
        public async Task BulkCatchPokemon_ValidRequest_ReturnsOperationResult()
        {
            var userId = 1;
            var bulkCatchDto = new BulkCatchPokemonDto
            {
                PokemonToCatch = new List<CatchPokemonDto>
                {
                    new CatchPokemonDto { PokemonId = 1, Notes = "Bulbasaur" },
                    new CatchPokemonDto { PokemonId = 2, Notes = "Ivysaur" }
                }
            };

            var successfulCatches = new List<CaughtPokemon>
            {
                new CaughtPokemon
                {
                    Id = 1,
                    UserId = userId,
                    PokemonId = 1,
                    Pokemon = new Pokemon { Id = 1, PokeApiId = 1, Name = "Bulbasaur" },
                    CreatedDate = DateTime.UtcNow
                }
            };

            var errors = new List<string> { "Pokemon 2 not found" };

            SetupUserContext(userId);

            var pokemonToCatch = bulkCatchDto.PokemonToCatch
                .Select(p => (p.PokemonId, p.Notes))
                .ToList();

            _mockCaughtPokemonService.Setup(s => s.BulkCatchPokemonAsync(userId, pokemonToCatch))
                .ReturnsAsync((successfulCatches, errors));

            var result = await _controller.BulkCatchPokemon(bulkCatchDto);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var bulkOperationResult = Assert.IsType<BulkOperationResultDto>(okResult.Value);
            Assert.Equal(1, bulkOperationResult.SuccessfulOperations);
            Assert.Equal(1, bulkOperationResult.FailedOperations);
            Assert.Single(bulkOperationResult.Errors);
            Assert.Single(bulkOperationResult.CaughtPokemon!);
        }

        // Tests bulk catching with empty list returns bad request
        [Fact]
        public async Task BulkCatchPokemon_EmptyList_ReturnsBadRequest()
        {
            var userId = 1;
            var bulkCatchDto = new BulkCatchPokemonDto
            {
                PokemonToCatch = new List<CatchPokemonDto>()
            };

            SetupUserContext(userId);

            var result = await _controller.BulkCatchPokemon(bulkCatchDto);

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("No Pokemon specified for bulk catch operation", badRequestResult.Value);
        }

        // Tests updating caught Pokemon by valid owner returns updated data
        [Fact]
        public async Task UpdateCaughtPokemon_ValidOwner_ReturnsUpdatedPokemon()
        {
            var userId = 1;
            var pokeApiId = 1;
            var updateDto = new UpdateCaughtPokemonDto
            {
                Notes = "Updated notes",
                IsFavorite = true
            };

            var updatedCaughtPokemon = new CaughtPokemon
            {
                Id = 1,
                UserId = userId,
                PokemonId = 1,
                Pokemon = new Pokemon { Id = 1, PokeApiId = pokeApiId, Name = "Bulbasaur" },
                Notes = updateDto.Notes,
                IsFavorite = updateDto.IsFavorite ?? false
            };

            SetupUserContext(userId);

            _mockCaughtPokemonService.Setup(s => s.UpdateCaughtPokemonAsync(userId, pokeApiId, updateDto.Notes, updateDto.IsFavorite))
                .ReturnsAsync(updatedCaughtPokemon);

            var result = await _controller.UpdateCaughtPokemon(pokeApiId, updateDto);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var caughtPokemonDto = Assert.IsType<CaughtPokemonDto>(okResult.Value);
            Assert.Equal(updateDto.Notes, caughtPokemonDto.Notes);
            Assert.Equal(updateDto.IsFavorite, caughtPokemonDto.IsFavorite);
        }

        // Tests updating non-existent caught Pokemon returns not found
        [Fact]
        public async Task UpdateCaughtPokemon_NotFound_ReturnsNotFound()
        {
            var userId = 1;
            var pokeApiId = 999;
            var updateDto = new UpdateCaughtPokemonDto
            {
                Notes = "Updated notes"
            };

            SetupUserContext(userId);

            _mockCaughtPokemonService.Setup(s => s.UpdateCaughtPokemonAsync(userId, pokeApiId, updateDto.Notes, updateDto.IsFavorite))
                .ReturnsAsync((CaughtPokemon?)null);

            var result = await _controller.UpdateCaughtPokemon(pokeApiId, updateDto);

            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        // Tests updating caught Pokemon that doesn't exist for user returns bad request
        [Fact]
        public async Task UpdateCaughtPokemon_NotCaughtByUser_ReturnsBadRequest()
        {
            var userId = 1;
            var pokeApiId = 1;
            var updateDto = new UpdateCaughtPokemonDto
            {
                Notes = "Updated notes"
            };

            SetupUserContext(userId);

            _mockCaughtPokemonService.Setup(s => s.UpdateCaughtPokemonAsync(userId, pokeApiId, updateDto.Notes, updateDto.IsFavorite))
                .ReturnsAsync((CaughtPokemon?)null);

            var result = await _controller.UpdateCaughtPokemon(pokeApiId, updateDto);

            Assert.IsType<BadRequestObjectResult>(result.Result);
        }

        // Tests releasing Pokemon with valid request returns success
        [Fact]
        public async Task ReleasePokemon_ValidRequest_ReturnsOk()
        {
            var userId = 1;
            var caughtPokemonId = 1;

            SetupUserContext(userId);

            _mockCaughtPokemonService.Setup(s => s.ReleasePokemonAsync(userId, caughtPokemonId))
                .ReturnsAsync(true);

            var result = await _controller.ReleasePokemon(caughtPokemonId);

            Assert.IsType<OkResult>(result);
        }

        // Tests releasing Pokemon that fails returns bad request
        [Fact]
        public async Task ReleasePokemon_Failed_ReturnsBadRequest()
        {
            var userId = 1;
            var pokeApiId = 999;

            SetupUserContext(userId);

            _mockCaughtPokemonService.Setup(s => s.ReleasePokemonAsync(userId, pokeApiId))
                .ReturnsAsync(false);

            var result = await _controller.ReleasePokemon(pokeApiId);

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Failed to release Pokemon - not caught or not found", badRequestResult.Value);
        }

        // Tests bulk releasing multiple Pokemon returns operation results
        [Fact]
        public async Task BulkReleasePokemon_ValidRequest_ReturnsOperationResult()
        {
            var userId = 1;
            var bulkReleaseDto = new BulkReleasePokemonDto
            {
                PokeApiIds = new List<int> { 1, 2, 3 }
            };

            var successfulReleases = 2;
            var errors = new List<string> { "Failed to release Pokemon with PokeApiId 3" };

            SetupUserContext(userId);

            _mockCaughtPokemonService.Setup(s => s.BulkReleasePokemonAsync(userId, bulkReleaseDto.PokeApiIds))
                .ReturnsAsync((successfulReleases, errors));

            var result = await _controller.BulkReleasePokemon(bulkReleaseDto);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var bulkOperationResult = Assert.IsType<BulkOperationResultDto>(okResult.Value);
            Assert.Equal(2, bulkOperationResult.SuccessfulOperations);
            Assert.Equal(1, bulkOperationResult.FailedOperations);
            Assert.Single(bulkOperationResult.Errors);
        }

        // Tests bulk releasing with empty list returns bad request
        [Fact]
        public async Task BulkReleasePokemon_EmptyList_ReturnsBadRequest()
        {
            var userId = 1;
            var bulkReleaseDto = new BulkReleasePokemonDto
            {
                PokeApiIds = new List<int>()
            };

            SetupUserContext(userId);

            var result = await _controller.BulkReleasePokemon(bulkReleaseDto);

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("No Pokemon specified for bulk release operation", badRequestResult.Value);
        }

        // Tests checking if Pokemon is caught by user returns boolean result
        [Fact]
        public async Task IsPokemonCaught_ValidRequest_ReturnsBool()
        {
            var userId = 1;
            var pokemonId = 1;

            SetupUserContext(userId);

            _mockCaughtPokemonService.Setup(s => s.IsPokemonCaughtByUserAsync(userId, pokemonId))
                .ReturnsAsync(true);

            var result = await _controller.IsPokemonCaught(pokemonId);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var isCaught = Assert.IsType<bool>(okResult.Value);
            Assert.True(isCaught);
        }

        // Tests getting Pokedex statistics for authenticated user
        [Fact]
        public async Task GetPokedexStats_ValidUser_ReturnsStats()
        {
            var userId = 1;
            var totalCaught = 50;
            var totalPokemon = 1010;
            var favoritePokemon = new List<CaughtPokemon>
            {
                new CaughtPokemon
                {
                    Id = 1,
                    UserId = userId,
                    PokemonId = 1,
                    Pokemon = new Pokemon { Id = 1, PokeApiId = 1, Name = "Bulbasaur" },
                    IsFavorite = true
                }
            };

            SetupUserContext(userId);

            _mockCaughtPokemonService.Setup(s => s.GetUserCaughtPokemonCountAsync(userId))
                .ReturnsAsync(totalCaught);
            _mockCaughtPokemonService.Setup(s => s.GetUserFavoritePokemonAsync(userId))
                .ReturnsAsync(favoritePokemon);
            _mockPokemonService.Setup(s => s.GetTotalPokemonCountAsync())
                .ReturnsAsync(totalPokemon);

            var result = await _controller.GetPokedexStats();

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        // Tests getting Pokedex stats without authentication returns unauthorized
        [Fact]
        public async Task GetPokedexStats_NoUser_ReturnsUnauthorized()
        {
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            var result = await _controller.GetPokedexStats();

            Assert.IsType<UnauthorizedResult>(result);
        }

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
    }
}
