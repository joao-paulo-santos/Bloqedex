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
    public class SharingControllerTests
    {
        private readonly Mock<ISharedPokemonService> _mockSharedPokemonService;
        private readonly Mock<ICaughtPokemonService> _mockCaughtPokemonService;
        private readonly Mock<IUserService> _mockUserService;
        private readonly SharingController _controller;

        public SharingControllerTests()
        {
            _mockSharedPokemonService = new Mock<ISharedPokemonService>();
            _mockCaughtPokemonService = new Mock<ICaughtPokemonService>();
            _mockUserService = new Mock<IUserService>();
            _controller = new SharingController(
                _mockSharedPokemonService.Object,
                _mockCaughtPokemonService.Object,
                _mockUserService.Object
            );
        }

        // Tests creating a single Pokemon share returns shared Pokemon DTO
        [Fact]
        public async Task CreateShare_SinglePokemon_ReturnsSharedPokemonDto()
        {
            var userId = 1;
            var request = new CreateShareRequest
            {
                ShareType = ShareType.SinglePokemon,
                CaughtPokemonId = 1,
                Title = "My Favorite Pokemon",
                Description = "Check out my Pikachu!",
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                MaxViews = 100
            };

            var sharedPokemon = new SharedPokemon
            {
                Id = 1,
                ShareToken = "abc123",
                ShareType = ShareType.SinglePokemon,
                Title = request.Title,
                Description = request.Description,
                ExpiresAt = request.ExpiresAt,
                MaxViews = request.MaxViews,
                UserId = userId,
                CreatedDate = DateTime.UtcNow
            };

            SetupUserContext(userId);
            SetupHttpContext();

            _mockSharedPokemonService.Setup(s => s.CreateSinglePokemonShareAsync(
                userId, request.CaughtPokemonId.Value, request.Title, request.Description, request.ExpiresAt, request.MaxViews))
                .ReturnsAsync(sharedPokemon);

            var result = await _controller.CreateShare(request);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var sharedPokemonDto = Assert.IsType<SharedPokemonDto>(okResult.Value);
            Assert.Equal(sharedPokemon.Id, sharedPokemonDto.Id);
            Assert.Equal(sharedPokemon.ShareToken, sharedPokemonDto.ShareToken);
        }

        // Tests creating a Pokemon collection share returns shared Pokemon DTO
        [Fact]
        public async Task CreateShare_Collection_ReturnsSharedPokemonDto()
        {
            var userId = 1;
            var request = new CreateShareRequest
            {
                ShareType = ShareType.Collection,
                Title = "My Pokemon Collection",
                Description = "Check out my complete collection!",
                ExpiresAt = DateTime.UtcNow.AddDays(30),
                MaxViews = 500
            };

            var sharedPokemon = new SharedPokemon
            {
                Id = 2,
                ShareToken = "xyz789",
                ShareType = ShareType.Collection,
                Title = request.Title,
                Description = request.Description,
                ExpiresAt = request.ExpiresAt,
                MaxViews = request.MaxViews,
                UserId = userId,
                CreatedDate = DateTime.UtcNow
            };

            SetupUserContext(userId);
            SetupHttpContext();

            _mockSharedPokemonService.Setup(s => s.CreateCollectionShareAsync(
                userId, request.Title, request.Description, request.ExpiresAt, request.MaxViews))
                .ReturnsAsync(sharedPokemon);

            var result = await _controller.CreateShare(request);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var sharedPokemonDto = Assert.IsType<SharedPokemonDto>(okResult.Value);
            Assert.Equal(sharedPokemon.Id, sharedPokemonDto.Id);
            Assert.Equal(sharedPokemon.ShareToken, sharedPokemonDto.ShareToken);
        }

        // Tests creating single Pokemon share without Pokemon ID returns bad request
        [Fact]
        public async Task CreateShare_SinglePokemonMissingId_ReturnsBadRequest()
        {
            var userId = 1;
            var request = new CreateShareRequest
            {
                ShareType = ShareType.SinglePokemon,
                Title = "My Pokemon",
                Description = "A Pokemon"
            };

            SetupUserContext(userId);

            var result = await _controller.CreateShare(request);

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("CaughtPokemonId is required for single Pokemon shares", badRequestResult.Value);
        }

        // Tests creating share when service fails returns bad request
        [Fact]
        public async Task CreateShare_ServiceReturnsNull_ReturnsBadRequest()
        {
            var userId = 1;
            var request = new CreateShareRequest
            {
                ShareType = ShareType.SinglePokemon,
                CaughtPokemonId = 1,
                Title = "My Pokemon"
            };

            SetupUserContext(userId);

            _mockSharedPokemonService.Setup(s => s.CreateSinglePokemonShareAsync(
                userId, request.CaughtPokemonId.Value, request.Title, request.Description, request.ExpiresAt, request.MaxViews))
                .ReturnsAsync((SharedPokemon?)null);

            var result = await _controller.CreateShare(request);

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Failed to create share", badRequestResult.Value);
        }

        // Tests creating share without authentication returns unauthorized
        [Fact]
        public async Task CreateShare_NoUser_ReturnsUnauthorized()
        {
            var request = new CreateShareRequest
            {
                ShareType = ShareType.SinglePokemon,
                CaughtPokemonId = 1
            };

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            var result = await _controller.CreateShare(request);

            Assert.IsType<UnauthorizedResult>(result.Result);
        }

        // Tests retrieving user's own shares returns list of shares
        [Fact]
        public async Task GetMyShares_ValidUser_ReturnsUserShares()
        {
            var userId = 1;
            var shares = new List<SharedPokemon>
            {
                new SharedPokemon
                {
                    Id = 1,
                    ShareToken = "abc123",
                    ShareType = ShareType.SinglePokemon,
                    Title = "My Pokemon",
                    UserId = userId,
                    CreatedDate = DateTime.UtcNow
                }
            };

            SetupUserContext(userId);
            SetupHttpContext();

            _mockSharedPokemonService.Setup(s => s.GetUserSharedPokemonAsync(userId))
                .ReturnsAsync(shares);

            var result = await _controller.GetMyShares();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var userSharedPokemonListDto = Assert.IsType<UserSharedPokemonListDto>(okResult.Value);
            Assert.Single(userSharedPokemonListDto.SharedPokemons);
        }

        // Tests getting user shares without authentication returns unauthorized
        [Fact]
        public async Task GetMyShares_NoUser_ReturnsUnauthorized()
        {
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            var result = await _controller.GetMyShares();

            Assert.IsType<UnauthorizedResult>(result.Result);
        }

        // Tests viewing valid single Pokemon share returns shared Pokemon view
        [Fact]
        public async Task ViewSharedPokemon_ValidSinglePokemonShare_ReturnsSharedPokemonView()
        {
            var shareToken = "abc123";
            var pokemon = new Pokemon { Id = 1, PokeApiId = 25, Name = "Pikachu" };
            var caughtPokemon = new CaughtPokemon
            {
                Id = 1,
                UserId = 1,
                PokemonId = 1,
                Pokemon = pokemon,
                CreatedDate = DateTime.UtcNow
            };
            var user = new User
            {
                Id = 1,
                Username = "testuser",
                Email = "test@example.com",
                PasswordHash = "hash"
            };

            var sharedPokemon = new SharedPokemon
            {
                Id = 1,
                ShareToken = shareToken,
                ShareType = ShareType.SinglePokemon,
                Title = "My Pikachu",
                Description = "A cute Pikachu",
                UserId = 1,
                User = user,
                CaughtPokemon = caughtPokemon,
                ViewCount = 5,
                CreatedDate = DateTime.UtcNow
            };

            _mockSharedPokemonService.Setup(s => s.ValidateAndGetSharedPokemonAsync(shareToken))
                .ReturnsAsync(sharedPokemon);
            _mockSharedPokemonService.Setup(s => s.IncrementViewCountAsync(shareToken))
                .ReturnsAsync(true);

            var result = await _controller.ViewSharedPokemon(shareToken);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var sharedPokemonViewDto = Assert.IsType<SharedPokemonViewDto>(okResult.Value);
            Assert.Equal(sharedPokemon.Title, sharedPokemonViewDto.Title);
            Assert.Equal(sharedPokemon.Description, sharedPokemonViewDto.Description);
            Assert.Equal(sharedPokemon.ShareType, sharedPokemonViewDto.ShareType);
            Assert.Equal(user.Username, sharedPokemonViewDto.OwnerUsername);
            Assert.Equal(6, sharedPokemonViewDto.ViewCount); // Incremented by 1
            Assert.NotNull(sharedPokemonViewDto.Pokemon);
        }

        // Tests viewing valid collection share returns shared Pokemon view with collection
        [Fact]
        public async Task ViewSharedPokemon_ValidCollectionShare_ReturnsSharedPokemonView()
        {
            var shareToken = "xyz789";
            var user = new User
            {
                Id = 1,
                Username = "testuser",
                Email = "test@example.com",
                PasswordHash = "hash"
            };

            var sharedPokemon = new SharedPokemon
            {
                Id = 2,
                ShareToken = shareToken,
                ShareType = ShareType.Collection,
                Title = "My Collection",
                Description = "My Pokemon collection",
                UserId = 1,
                User = user,
                ViewCount = 10,
                CreatedDate = DateTime.UtcNow
            };

            var caughtPokemons = new List<CaughtPokemon>
            {
                new CaughtPokemon
                {
                    Id = 1,
                    UserId = 1,
                    PokemonId = 1,
                    Pokemon = new Pokemon { Id = 1, PokeApiId = 1, Name = "Bulbasaur" },
                    CreatedDate = DateTime.UtcNow
                }
            };

            _mockSharedPokemonService.Setup(s => s.ValidateAndGetSharedPokemonAsync(shareToken))
                .ReturnsAsync(sharedPokemon);
            _mockSharedPokemonService.Setup(s => s.IncrementViewCountAsync(shareToken))
                .ReturnsAsync(true);
            _mockCaughtPokemonService.Setup(s => s.GetUserCaughtPokemonPagedAsync(1, 0, int.MaxValue))
                .ReturnsAsync(caughtPokemons);

            var result = await _controller.ViewSharedPokemon(shareToken);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var sharedPokemonViewDto = Assert.IsType<SharedPokemonViewDto>(okResult.Value);
            Assert.Equal(sharedPokemon.Title, sharedPokemonViewDto.Title);
            Assert.Equal(ShareType.Collection, sharedPokemonViewDto.ShareType);
            Assert.Equal(11, sharedPokemonViewDto.ViewCount); // Incremented by 1
            Assert.NotNull(sharedPokemonViewDto.Collection);
        }

        // Tests viewing share with invalid token returns not found
        [Fact]
        public async Task ViewSharedPokemon_InvalidToken_ReturnsNotFound()
        {
            var shareToken = "invalid123";

            _mockSharedPokemonService.Setup(s => s.ValidateAndGetSharedPokemonAsync(shareToken))
                .ReturnsAsync((SharedPokemon?)null);

            var result = await _controller.ViewSharedPokemon(shareToken);

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result.Result);
            Assert.Equal("Share not found or no longer available", notFoundResult.Value);
        }

        // Tests updating share with valid request returns success
        [Fact]
        public async Task UpdateShare_ValidRequest_ReturnsOk()
        {
            var userId = 1;
            var shareId = 1;
            var request = new UpdateShareRequest
            {
                Title = "Updated Title",
                Description = "Updated Description",
                ExpiresAt = DateTime.UtcNow.AddDays(14),
                MaxViews = 200,
                IsActive = true
            };

            SetupUserContext(userId);

            _mockSharedPokemonService.Setup(s => s.UpdateSharedPokemonAsync(
                shareId, userId, request.Title, request.Description, request.ExpiresAt, request.MaxViews, request.IsActive))
                .ReturnsAsync(true);

            var result = await _controller.UpdateShare(shareId, request);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        // Tests updating share when service fails returns not found
        [Fact]
        public async Task UpdateShare_ServiceReturnsFalse_ReturnsNotFound()
        {
            var userId = 1;
            var shareId = 999;
            var request = new UpdateShareRequest
            {
                Title = "Updated Title"
            };

            SetupUserContext(userId);

            _mockSharedPokemonService.Setup(s => s.UpdateSharedPokemonAsync(
                shareId, userId, request.Title, request.Description, request.ExpiresAt, request.MaxViews, request.IsActive))
                .ReturnsAsync(false);

            var result = await _controller.UpdateShare(shareId, request);

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Share not found or you don't have permission to update it", notFoundResult.Value);
        }

        // Tests updating share without authentication returns unauthorized
        [Fact]
        public async Task UpdateShare_NoUser_ReturnsUnauthorized()
        {
            var shareId = 1;
            var request = new UpdateShareRequest
            {
                Title = "Updated Title"
            };

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            var result = await _controller.UpdateShare(shareId, request);

            Assert.IsType<UnauthorizedResult>(result);
        }

        // Tests deleting share with valid request returns success
        [Fact]
        public async Task DeleteShare_ValidRequest_ReturnsOk()
        {
            var userId = 1;
            var shareId = 1;

            SetupUserContext(userId);

            _mockSharedPokemonService.Setup(s => s.DeleteSharedPokemonAsync(shareId, userId))
                .ReturnsAsync(true);

            var result = await _controller.DeleteShare(shareId);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        // Tests deleting share when service fails returns not found
        [Fact]
        public async Task DeleteShare_ServiceReturnsFalse_ReturnsNotFound()
        {
            var userId = 1;
            var shareId = 999;

            SetupUserContext(userId);

            _mockSharedPokemonService.Setup(s => s.DeleteSharedPokemonAsync(shareId, userId))
                .ReturnsAsync(false);

            var result = await _controller.DeleteShare(shareId);

            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Share not found or you don't have permission to delete it", notFoundResult.Value);
        }

        // Tests deleting share without authentication returns unauthorized
        [Fact]
        public async Task DeleteShare_NoUser_ReturnsUnauthorized()
        {
            var shareId = 1;

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            var result = await _controller.DeleteShare(shareId);

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

        private void SetupHttpContext()
        {
            var httpContext = _controller.ControllerContext.HttpContext;
            httpContext.Request.Scheme = "https";
            httpContext.Request.Host = new HostString("api.example.com");
        }
    }
}
