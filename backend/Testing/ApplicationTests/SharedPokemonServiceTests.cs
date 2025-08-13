using Xunit;
using Application.Services;
using Core.Interfaces;
using Moq;
using Core.Entities;

namespace Testing.ApplicationTests
{
    public class SharedPokemonServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<ISharedPokemonRepository> _mockSharedPokemonRepository;
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly Mock<ICaughtPokemonRepository> _mockCaughtPokemonRepository;
        private readonly Mock<IPokemonRepository> _mockPokemonRepository;
        private readonly SharedPokemonService _sharedPokemonService;

        public SharedPokemonServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockSharedPokemonRepository = new Mock<ISharedPokemonRepository>();
            _mockUserRepository = new Mock<IUserRepository>();
            _mockCaughtPokemonRepository = new Mock<ICaughtPokemonRepository>();
            _mockPokemonRepository = new Mock<IPokemonRepository>();

            _mockUnitOfWork.Setup(uow => uow.SharedPokemonRepository).Returns(_mockSharedPokemonRepository.Object);
            _mockUnitOfWork.Setup(uow => uow.UserRepository).Returns(_mockUserRepository.Object);
            _mockUnitOfWork.Setup(uow => uow.CaughtPokemonRepository).Returns(_mockCaughtPokemonRepository.Object);
            _mockUnitOfWork.Setup(uow => uow.PokemonRepository).Returns(_mockPokemonRepository.Object);

            _sharedPokemonService = new SharedPokemonService(_mockUnitOfWork.Object);
        }

        [Fact]
        // Test that creating a collection share for a user with Pokemon returns a valid shared Collection
        public async Task CreateCollectionShareAsync_ValidUser_ReturnsSharedPokemon()
        {
            var userId = 1;
            var user = new User
            {
                Id = userId,
                Username = "testuser",
                Email = "test@example.com",
                PasswordHash = "hash",
                CaughtCount = 5
            };

            _mockUserRepository.Setup(r => r.GetUserByIdAsync(userId))
                .ReturnsAsync(user);

            _mockSharedPokemonRepository.Setup(r => r.AddSharedPokemonAsync(It.IsAny<SharedPokemon>()))
                .ReturnsAsync((SharedPokemon sp) => sp); // Return the actual object passed in

            _mockUnitOfWork.Setup(uow => uow.SaveChangesAsync())
                .ReturnsAsync(1);

            var result = await _sharedPokemonService.CreateCollectionShareAsync(userId, "My Collection");

            Assert.NotNull(result);
            Assert.Equal(ShareType.Collection, result.ShareType);
            Assert.Equal(userId, result.UserId);
            Assert.Equal("My Collection", result.Title);
        }

        [Fact]
        // Test that creating a collection share for a user with no Pokemon returns null
        public async Task CreateCollectionShareAsync_UserWithNoPokemons_ReturnsNull()
        {
            var userId = 1;
            var user = new User
            {
                Id = userId,
                Username = "testuser",
                Email = "test@example.com",
                PasswordHash = "hash",
                CaughtCount = 0
            };

            _mockUserRepository.Setup(r => r.GetUserByIdAsync(userId))
                .ReturnsAsync(user);

            var result = await _sharedPokemonService.CreateCollectionShareAsync(userId, "My Empty Collection");

            Assert.Null(result);
        }

        [Fact]
        // Test that creating a single Pokemon share for a valid caught Pokemon returns a shared Pokemon
        public async Task CreateSinglePokemonShareAsync_ValidCaughtPokemon_ReturnsSharedPokemon()
        {
            var userId = 1;
            var pokeApiId = 25;
            var pokemon = new Pokemon { Id = 1, PokeApiId = pokeApiId, Name = "Pikachu" };
            var caughtPokemon = new CaughtPokemon
            {
                Id = 1,
                UserId = userId,
                PokemonId = pokemon.Id,
                Notes = "My Pikachu"
            };

            _mockPokemonRepository.Setup(r => r.GetPokemonByPokeApiIdAsync(pokeApiId))
                .ReturnsAsync(pokemon);
            _mockCaughtPokemonRepository.Setup(r => r.GetUserCaughtPokemonAsync(userId, pokemon.Id))
                .ReturnsAsync(caughtPokemon);
            _mockSharedPokemonRepository.Setup(r => r.AddSharedPokemonAsync(It.IsAny<SharedPokemon>()))
                .ReturnsAsync((SharedPokemon sp) => sp);
            _mockUnitOfWork.Setup(uow => uow.SaveChangesAsync())
                .ReturnsAsync(1);

            var result = await _sharedPokemonService.CreateSinglePokemonShareAsync(userId, pokeApiId, "My Pikachu Share");

            Assert.NotNull(result);
            Assert.Equal(ShareType.SinglePokemon, result.ShareType);
            Assert.Equal(userId, result.UserId);
            Assert.Equal(caughtPokemon.Id, result.CaughtPokemonId);
            Assert.Equal("My Pikachu Share", result.Title);
        }

        [Fact]
        // Test that creating a single Pokemon share for a non-existent Pokemon returns null
        public async Task CreateSinglePokemonShareAsync_NonExistentCaughtPokemon_ReturnsNull()
        {
            var userId = 1;
            var pokeApiId = 9999;

            _mockPokemonRepository.Setup(r => r.GetPokemonByPokeApiIdAsync(pokeApiId))
                .ReturnsAsync((Pokemon?)null);

            var result = await _sharedPokemonService.CreateSinglePokemonShareAsync(userId, pokeApiId, "Non-existent Share");

            Assert.Null(result);
        }

        [Fact]
        // Test that creating a single Pokemon share for a Pokemon not caught by user returns null
        public async Task CreateSinglePokemonShareAsync_UnauthorizedAccess_ReturnsNull()
        {
            var userId = 1;
            var pokeApiId = 25;
            var pokemon = new Pokemon { Id = 1, PokeApiId = pokeApiId, Name = "Pikachu" };

            _mockPokemonRepository.Setup(r => r.GetPokemonByPokeApiIdAsync(pokeApiId))
                .ReturnsAsync(pokemon);
            _mockCaughtPokemonRepository.Setup(r => r.GetUserCaughtPokemonAsync(userId, pokemon.Id))
                .ReturnsAsync((CaughtPokemon?)null); // User hasn't caught this Pokemon

            var result = await _sharedPokemonService.CreateSinglePokemonShareAsync(userId, pokeApiId, "Unauthorized Share");

            Assert.Null(result);
        }

        [Fact]
        // Test that getting a shared Pokemon by valid token returns the correct shared Pokemon
        public async Task GetSharedPokemonByTokenAsync_ValidToken_ReturnsSharedPokemon()
        {
            var shareToken = "valid-token-123";
            var sharedPokemon = new SharedPokemon
            {
                Id = 1,
                ShareToken = shareToken,
                ShareType = ShareType.Collection,
                UserId = 1
            };

            _mockSharedPokemonRepository.Setup(r => r.GetSharedPokemonByTokenAsync(shareToken))
                .ReturnsAsync(sharedPokemon);

            var result = await _sharedPokemonService.GetSharedPokemonByTokenAsync(shareToken);

            Assert.NotNull(result);
            Assert.Equal(shareToken, result.ShareToken);
            Assert.Equal(ShareType.Collection, result.ShareType);
        }

        [Fact]
        // Test that getting a shared Pokemon by invalid token returns null
        public async Task GetSharedPokemonByTokenAsync_InvalidToken_ReturnsNull()
        {
            var invalidToken = "invalid-token";

            _mockSharedPokemonRepository.Setup(r => r.GetSharedPokemonByTokenAsync(invalidToken))
                .ReturnsAsync((SharedPokemon?)null);

            var result = await _sharedPokemonService.GetSharedPokemonByTokenAsync(invalidToken);

            Assert.Null(result);
        }

        [Fact]
        // Test that getting user shared Pokemon returns all shares for the user
        public async Task GetUserSharedPokemonAsync_ValidUser_ReturnsUserShares()
        {
            var userId = 1;
            var userShares = new List<SharedPokemon>
            {
                new SharedPokemon { Id = 1, UserId = userId, ShareToken = "token1", ShareType = ShareType.Collection },
                new SharedPokemon { Id = 2, UserId = userId, ShareToken = "token2", ShareType = ShareType.SinglePokemon }
            };

            _mockSharedPokemonRepository.Setup(r => r.GetUserSharedPokemonAsync(userId))
                .ReturnsAsync(userShares);

            var result = await _sharedPokemonService.GetUserSharedPokemonAsync(userId);

            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
            Assert.All(result, share => Assert.Equal(userId, share.UserId));
        }

        [Fact]
        // Test that updating a shared Pokemon with valid ownership updates successfully
        public async Task UpdateSharedPokemonAsync_ValidOwnership_ReturnsTrue()
        {
            var shareId = 1;
            var userId = 1;
            var sharedPokemon = new SharedPokemon
            {
                Id = shareId,
                UserId = userId,
                ShareToken = "test-token",
                Title = "Old Title",
                Description = "Old Description"
            };

            _mockSharedPokemonRepository.Setup(r => r.GetSharedPokemonByIdAsync(shareId))
                .ReturnsAsync(sharedPokemon);
            _mockSharedPokemonRepository.Setup(r => r.UpdateSharedPokemonAsync(It.IsAny<SharedPokemon>()))
                .ReturnsAsync((SharedPokemon sp) => sp);
            _mockUnitOfWork.Setup(uow => uow.SaveChangesAsync())
                .ReturnsAsync(1);

            var result = await _sharedPokemonService.UpdateSharedPokemonAsync(shareId, userId, "New Title", "New Description");

            Assert.True(result);
            Assert.Equal("New Title", sharedPokemon.Title);
            Assert.Equal("New Description", sharedPokemon.Description);
        }

        [Fact]
        // Test that updating a non-existent shared Pokemon returns false
        public async Task UpdateSharedPokemonAsync_NonExistentShare_ReturnsFalse()
        {
            var shareId = 999;
            var userId = 1;

            _mockSharedPokemonRepository.Setup(r => r.GetSharedPokemonByIdAsync(shareId))
                .ReturnsAsync((SharedPokemon?)null);

            var result = await _sharedPokemonService.UpdateSharedPokemonAsync(shareId, userId, "New Title");

            Assert.False(result);
        }

        [Fact]
        // Test that updating another user's shared Pokemon returns false
        public async Task UpdateSharedPokemonAsync_UnauthorizedAccess_ReturnsFalse()
        {
            var shareId = 1;
            var userId = 1;
            var otherUserId = 2;
            var sharedPokemon = new SharedPokemon
            {
                Id = shareId,
                UserId = otherUserId,
                ShareToken = "test-token"
            };

            _mockSharedPokemonRepository.Setup(r => r.GetSharedPokemonByIdAsync(shareId))
                .ReturnsAsync(sharedPokemon);

            var result = await _sharedPokemonService.UpdateSharedPokemonAsync(shareId, userId, "New Title");

            Assert.False(result);
        }

        [Fact]
        // Test that deleting a shared Pokemon with valid ownership deletes successfully
        public async Task DeleteSharedPokemonAsync_ValidOwnership_ReturnsTrue()
        {
            var shareId = 1;
            var userId = 1;
            var sharedPokemon = new SharedPokemon
            {
                Id = shareId,
                UserId = userId,
                ShareToken = "test-token"
            };

            _mockSharedPokemonRepository.Setup(r => r.GetSharedPokemonByIdAsync(shareId))
                .ReturnsAsync(sharedPokemon);
            _mockSharedPokemonRepository.Setup(r => r.DeleteSharedPokemonAsync(sharedPokemon))
                .ReturnsAsync(true);
            _mockUnitOfWork.Setup(uow => uow.SaveChangesAsync())
                .ReturnsAsync(1);

            var result = await _sharedPokemonService.DeleteSharedPokemonAsync(shareId, userId);

            Assert.True(result);
            _mockSharedPokemonRepository.Verify(r => r.DeleteSharedPokemonAsync(sharedPokemon), Times.Once);
        }

        [Fact]
        // Test that deleting a non-existent shared Pokemon returns false
        public async Task DeleteSharedPokemonAsync_NonExistentShare_ReturnsFalse()
        {
            var shareId = 999;
            var userId = 1;

            _mockSharedPokemonRepository.Setup(r => r.GetSharedPokemonByIdAsync(shareId))
                .ReturnsAsync((SharedPokemon?)null);

            var result = await _sharedPokemonService.DeleteSharedPokemonAsync(shareId, userId);

            Assert.False(result);
        }

        [Fact]
        // Test that deleting another user's shared Pokemon returns false
        public async Task DeleteSharedPokemonAsync_UnauthorizedAccess_ReturnsFalse()
        {
            var shareId = 1;
            var userId = 1;
            var otherUserId = 2;
            var sharedPokemon = new SharedPokemon
            {
                Id = shareId,
                UserId = otherUserId,
                ShareToken = "test-token"
            };

            _mockSharedPokemonRepository.Setup(r => r.GetSharedPokemonByIdAsync(shareId))
                .ReturnsAsync(sharedPokemon);

            var result = await _sharedPokemonService.DeleteSharedPokemonAsync(shareId, userId);

            Assert.False(result);
        }

        [Fact]
        // Test that incrementing view count for a valid token updates successfully
        public async Task IncrementViewCountAsync_ValidToken_ReturnsTrue()
        {
            var shareToken = "valid-token-123";

            _mockSharedPokemonRepository.Setup(r => r.IncrementViewCountAsync(shareToken))
                .ReturnsAsync(true);
            _mockUnitOfWork.Setup(uow => uow.SaveChangesAsync())
                .ReturnsAsync(1);

            var result = await _sharedPokemonService.IncrementViewCountAsync(shareToken);

            Assert.True(result);
            _mockUnitOfWork.Verify(uow => uow.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        // Test that incrementing view count for an invalid token returns false
        public async Task IncrementViewCountAsync_InvalidToken_ReturnsFalse()
        {
            var invalidToken = "invalid-token";

            _mockSharedPokemonRepository.Setup(r => r.IncrementViewCountAsync(invalidToken))
                .ReturnsAsync(false);

            var result = await _sharedPokemonService.IncrementViewCountAsync(invalidToken);

            Assert.False(result);
            _mockUnitOfWork.Verify(uow => uow.SaveChangesAsync(), Times.Never);
        }

        [Fact]
        // Test that validating an active shared Pokemon returns the shared Pokemon
        public async Task ValidateAndGetSharedPokemonAsync_ActiveShare_ReturnsSharedPokemon()
        {
            var shareToken = "valid-token-123";
            var sharedPokemon = new SharedPokemon
            {
                Id = 1,
                ShareToken = shareToken,
                UserId = 1,
                IsActive = true,
                ExpiresAt = DateTime.UtcNow.AddDays(1),
                MaxViews = 100,
                ViewCount = 50
            };

            _mockSharedPokemonRepository.Setup(r => r.GetSharedPokemonByTokenAsync(shareToken))
                .ReturnsAsync(sharedPokemon);

            var result = await _sharedPokemonService.ValidateAndGetSharedPokemonAsync(shareToken);

            Assert.NotNull(result);
            Assert.Equal(shareToken, result.ShareToken);
        }

        [Fact]
        // Test that validating an inactive shared Pokemon returns null
        public async Task ValidateAndGetSharedPokemonAsync_InactiveShare_ReturnsNull()
        {
            var shareToken = "inactive-token";
            var sharedPokemon = new SharedPokemon
            {
                Id = 1,
                ShareToken = shareToken,
                UserId = 1,
                IsActive = false
            };

            _mockSharedPokemonRepository.Setup(r => r.GetSharedPokemonByTokenAsync(shareToken))
                .ReturnsAsync(sharedPokemon);

            var result = await _sharedPokemonService.ValidateAndGetSharedPokemonAsync(shareToken);

            Assert.Null(result);
        }

        [Fact]
        // Test that validating an expired shared Pokemon returns null
        public async Task ValidateAndGetSharedPokemonAsync_ExpiredShare_ReturnsNull()
        {
            var shareToken = "expired-token";
            var sharedPokemon = new SharedPokemon
            {
                Id = 1,
                ShareToken = shareToken,
                UserId = 1,
                IsActive = true,
                ExpiresAt = DateTime.UtcNow.AddDays(-1)
            };

            _mockSharedPokemonRepository.Setup(r => r.GetSharedPokemonByTokenAsync(shareToken))
                .ReturnsAsync(sharedPokemon);

            var result = await _sharedPokemonService.ValidateAndGetSharedPokemonAsync(shareToken);

            Assert.Null(result);
        }

        [Fact]
        // Test that validating a shared Pokemon that has reached max views returns null
        public async Task ValidateAndGetSharedPokemonAsync_MaxViewsReached_ReturnsNull()
        {
            var shareToken = "maxed-token";
            var sharedPokemon = new SharedPokemon
            {
                Id = 1,
                ShareToken = shareToken,
                UserId = 1,
                IsActive = true,
                MaxViews = 10,
                ViewCount = 10
            };

            _mockSharedPokemonRepository.Setup(r => r.GetSharedPokemonByTokenAsync(shareToken))
                .ReturnsAsync(sharedPokemon);

            var result = await _sharedPokemonService.ValidateAndGetSharedPokemonAsync(shareToken);

            Assert.Null(result);
        }

        [Fact]
        // Test that cleanup removes expired shares from the database
        public async Task CleanupExpiredSharesAsync_WithExpiredShares_RemovesExpiredShares()
        {
            var expiredShares = new List<SharedPokemon>
            {
                new SharedPokemon { Id = 1, UserId = 1, ShareToken = "token1", ExpiresAt = DateTime.UtcNow.AddDays(-1) },
                new SharedPokemon { Id = 2, UserId = 1, ShareToken = "token2", ExpiresAt = DateTime.UtcNow.AddDays(-2) }
            };

            _mockSharedPokemonRepository.Setup(r => r.GetExpiredSharedPokemonAsync())
                .ReturnsAsync(expiredShares);
            _mockSharedPokemonRepository.Setup(r => r.DeleteSharedPokemonAsync(It.IsAny<SharedPokemon>()))
                .ReturnsAsync(true);
            _mockUnitOfWork.Setup(uow => uow.SaveChangesAsync())
                .ReturnsAsync(1);

            await _sharedPokemonService.CleanupExpiredSharesAsync();

            _mockSharedPokemonRepository.Verify(r => r.DeleteSharedPokemonAsync(It.IsAny<SharedPokemon>()), Times.Exactly(2));
            _mockUnitOfWork.Verify(uow => uow.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        // Test that cleanup with no expired shares does not call save changes
        public async Task CleanupExpiredSharesAsync_NoExpiredShares_DoesNotSaveChanges()
        {
            var emptyExpiredShares = new List<SharedPokemon>();

            _mockSharedPokemonRepository.Setup(r => r.GetExpiredSharedPokemonAsync())
                .ReturnsAsync(emptyExpiredShares);

            await _sharedPokemonService.CleanupExpiredSharesAsync();

            _mockSharedPokemonRepository.Verify(r => r.DeleteSharedPokemonAsync(It.IsAny<SharedPokemon>()), Times.Never);
            _mockUnitOfWork.Verify(uow => uow.SaveChangesAsync(), Times.Never);
        }
    }
}
