using Application.Services;
using Core.Entities;
using Core.Interfaces;
using Moq;
using Xunit;

namespace Testing.ApplicationTests
{
    public class CaughtPokemonServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<ICaughtPokemonRepository> _mockCaughtPokemonRepository;
        private readonly Mock<IPokemonRepository> _mockPokemonRepository;
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly Mock<IPokemonService> _mockPokemonService;
        private readonly CaughtPokemonService _caughtPokemonService;

        public CaughtPokemonServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockCaughtPokemonRepository = new Mock<ICaughtPokemonRepository>();
            _mockPokemonRepository = new Mock<IPokemonRepository>();
            _mockUserRepository = new Mock<IUserRepository>();
            _mockPokemonService = new Mock<IPokemonService>();

            _mockUnitOfWork.Setup(uow => uow.CaughtPokemonRepository).Returns(_mockCaughtPokemonRepository.Object);
            _mockUnitOfWork.Setup(uow => uow.PokemonRepository).Returns(_mockPokemonRepository.Object);
            _mockUnitOfWork.Setup(uow => uow.UserRepository).Returns(_mockUserRepository.Object);

            _caughtPokemonService = new CaughtPokemonService(_mockUnitOfWork.Object);
        }

        [Fact]
        // Test that catching a new Pokemon successfully creates a caught Pokemon record
        public async Task CatchPokemonAsync_ValidPokemon_ReturnsCaughtPokemon()
        {
            var userId = 1;
            var pokeApiId = 25;
            var notes = "Caught near my house!";
            var pokemon = new Pokemon
            {
                Id = 1,
                PokeApiId = pokeApiId,
                Name = "pikachu"
            };
            var user = new User
            {
                Id = userId,
                Username = "testuser",
                Email = "test@example.com",
                PasswordHash = "hash",
                CaughtCount = 0
            };

            _mockPokemonRepository.Setup(r => r.GetPokemonByPokeApiIdAsync(pokeApiId))
                .ReturnsAsync(pokemon);
            _mockCaughtPokemonRepository.Setup(r => r.GetUserCaughtPokemonAsync(userId, pokemon.Id))
                .ReturnsAsync((CaughtPokemon?)null);
            _mockCaughtPokemonRepository.Setup(r => r.AddCaughtPokemonAsync(It.IsAny<CaughtPokemon>()))
                .ReturnsAsync((CaughtPokemon cp) => cp);
            _mockCaughtPokemonRepository.Setup(r => r.GetUserCaughtPokemonCountAsync(userId))
                .ReturnsAsync(1); // Mock the count after catching
            _mockUserRepository.Setup(r => r.GetUserByIdAsync(userId))
                .ReturnsAsync(user);
            _mockUserRepository.Setup(r => r.UpdateUserAsync(It.IsAny<User>()))
                .ReturnsAsync((User u) => u);
            _mockUnitOfWork.Setup(uow => uow.SaveChangesAsync())
                .ReturnsAsync(1);

            var result = await _caughtPokemonService.CatchPokemonAsync(userId, pokeApiId, notes);

            Assert.NotNull(result);
            Assert.Equal(userId, result.UserId);
            Assert.Equal(pokemon.Id, result.PokemonId);
            Assert.Equal(notes, result.Notes);
            _mockUserRepository.Verify(r => r.UpdateUserAsync(It.Is<User>(u => u.CaughtCount == 1)), Times.Once);
        }

        [Fact]
        // Test that attempting to catch a Pokemon that is already caught returns null
        public async Task CatchPokemonAsync_AlreadyCaught_ReturnsNull()
        {
            var userId = 1;
            var pokeApiId = 25;
            var pokemon = new Pokemon
            {
                Id = 1,
                PokeApiId = pokeApiId,
                Name = "pikachu"
            };
            var existingCatch = new CaughtPokemon
            {
                UserId = userId,
                PokemonId = pokemon.Id
            };

            _mockPokemonRepository.Setup(r => r.GetPokemonByPokeApiIdAsync(pokeApiId))
                .ReturnsAsync(pokemon);
            _mockCaughtPokemonRepository.Setup(r => r.GetUserCaughtPokemonAsync(userId, pokemon.Id))
                .ReturnsAsync(existingCatch);

            var result = await _caughtPokemonService.CatchPokemonAsync(userId, pokeApiId);

            Assert.Null(result);
        }

        [Fact]
        // Test that updating notes and favorite status of a caught Pokemon works correctly
        public async Task UpdateCaughtPokemonAsync_ValidUpdate_ReturnsUpdatedPokemon()
        {
            var userId = 1;
            var pokeApiId = 25;
            var newNotes = "Updated notes";
            var isFavorite = true;

            var pokemon = new Pokemon { Id = 1, PokeApiId = pokeApiId, Name = "Pikachu" };
            var caughtPokemon = new CaughtPokemon
            {
                Id = 1,
                UserId = userId,
                PokemonId = pokemon.Id,
                Notes = "Old notes",
                IsFavorite = false
            };

            _mockPokemonRepository.Setup(r => r.GetPokemonByPokeApiIdAsync(pokeApiId))
                .ReturnsAsync(pokemon);
            _mockCaughtPokemonRepository.Setup(r => r.GetUserCaughtPokemonAsync(userId, pokemon.Id))
                .ReturnsAsync(caughtPokemon);
            _mockCaughtPokemonRepository.Setup(r => r.UpdateCaughtPokemonAsync(It.IsAny<CaughtPokemon>()))
                .ReturnsAsync((CaughtPokemon cp) => cp);
            _mockUnitOfWork.Setup(uow => uow.SaveChangesAsync())
                .ReturnsAsync(1);

            var result = await _caughtPokemonService.UpdateCaughtPokemonAsync(userId, pokeApiId, newNotes, isFavorite);

            Assert.NotNull(result);
            Assert.Equal(newNotes, result.Notes);
            Assert.Equal(isFavorite, result.IsFavorite);
        }

        [Fact]
        // Test that checking if a Pokemon is caught by a user returns true when Pokemon is already caught
        public async Task IsPokemonCaughtByUserAsync_CaughtPokemon_ReturnsTrue()
        {
            var userId = 1;
            var pokeApiId = 25;
            var pokemon = new Pokemon { Id = 1, PokeApiId = pokeApiId, Name = "Pikachu" };
            var caughtPokemon = new CaughtPokemon
            {
                UserId = userId,
                PokemonId = pokemon.Id
            };

            _mockPokemonRepository.Setup(r => r.GetPokemonByPokeApiIdAsync(pokeApiId))
                .ReturnsAsync(pokemon);
            _mockCaughtPokemonRepository.Setup(r => r.GetUserCaughtPokemonAsync(userId, pokemon.Id))
                .ReturnsAsync(caughtPokemon);

            var result = await _caughtPokemonService.IsPokemonCaughtByUserAsync(userId, pokeApiId);

            Assert.True(result);
        }

        [Fact]
        // Test that checking if a Pokemon is caught by a user returns false when Pokemon is not caught
        public async Task IsPokemonCaughtByUserAsync_NotCaughtPokemon_ReturnsFalse()
        {
            var userId = 1;
            var pokeApiId = 25;
            var pokemon = new Pokemon { Id = 1, PokeApiId = pokeApiId, Name = "Pikachu" };

            _mockPokemonRepository.Setup(r => r.GetPokemonByPokeApiIdAsync(pokeApiId))
                .ReturnsAsync(pokemon);
            _mockCaughtPokemonRepository.Setup(r => r.GetUserCaughtPokemonAsync(userId, pokemon.Id))
                .ReturnsAsync((CaughtPokemon?)null);

            var result = await _caughtPokemonService.IsPokemonCaughtByUserAsync(userId, pokeApiId);

            Assert.False(result);
        }
    }
}
