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
        private readonly ITypeSyncStatusRepository _typeSyncStatusRepository;
        private readonly ISharedPokemonRepository _sharedPokemonRepository;

        public UnitOfWork(
            BloqedexDbContext context,
            IUserRepository userRepository,
            IPokemonRepository pokemonRepository,
            ICaughtPokemonRepository caughtPokemonRepository,
            ITypeSyncStatusRepository typeSyncStatusRepository,
            ISharedPokemonRepository sharedPokemonRepository)
        {
            _context = context;
            _userRepository = userRepository;
            _pokemonRepository = pokemonRepository;
            _caughtPokemonRepository = caughtPokemonRepository;
            _typeSyncStatusRepository = typeSyncStatusRepository;
            _sharedPokemonRepository = sharedPokemonRepository;
        }

        public IUserRepository UserRepository => _userRepository;
        public IPokemonRepository PokemonRepository => _pokemonRepository;
        public ICaughtPokemonRepository CaughtPokemonRepository => _caughtPokemonRepository;
        public ITypeSyncStatusRepository TypeSyncStatusRepository => _typeSyncStatusRepository;
        public ISharedPokemonRepository SharedPokemonRepository => _sharedPokemonRepository;

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
