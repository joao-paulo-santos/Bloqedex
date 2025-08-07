using Core.Interfaces;
using Infrastructure.Data;

namespace Infrastructure.UnitOfWork
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly BloqedexDbContext _context;
        private readonly IUserRepository _userRepository;
        private readonly IPokemonRepository _pokemonRepository;
        private readonly ICaughtPokemonRepository _caughtPokemonRepository;

        public UnitOfWork(
            BloqedexDbContext context,
            IUserRepository userRepository,
            IPokemonRepository pokemonRepository,
            ICaughtPokemonRepository caughtPokemonRepository)
        {
            _context = context;
            _userRepository = userRepository;
            _pokemonRepository = pokemonRepository;
            _caughtPokemonRepository = caughtPokemonRepository;
        }

        public IUserRepository UserRepository => _userRepository;
        public IPokemonRepository PokemonRepository => _pokemonRepository;
        public ICaughtPokemonRepository CaughtPokemonRepository => _caughtPokemonRepository;

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public async Task DisposeAsync()
        {
            await _context.DisposeAsync();
        }
    }
}
