using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class SharedPokemonRepository : ISharedPokemonRepository
    {
        private readonly BloqedexDbContext _context;

        public SharedPokemonRepository(BloqedexDbContext context)
        {
            _context = context;
        }

        public async Task<SharedPokemon?> GetSharedPokemonByIdAsync(int id)
        {
            return await _context.SharedPokemon
                .Include(sp => sp.User)
                .Include(sp => sp.CaughtPokemon)
                    .ThenInclude(cp => cp!.Pokemon)
                .FirstOrDefaultAsync(sp => sp.Id == id);
        }

        public async Task<SharedPokemon?> GetSharedPokemonByTokenAsync(string shareToken)
        {
            return await _context.SharedPokemon
                .Include(sp => sp.User)
                .Include(sp => sp.CaughtPokemon)
                    .ThenInclude(cp => cp!.Pokemon)
                        .ThenInclude(p => p.PokemonTypes)
                .FirstOrDefaultAsync(sp => sp.ShareToken == shareToken);
        }

        public async Task<IReadOnlyList<SharedPokemon>> GetUserSharedPokemonAsync(int userId)
        {
            return await _context.SharedPokemon
                .Where(sp => sp.UserId == userId)
                .Include(sp => sp.CaughtPokemon)
                    .ThenInclude(cp => cp!.Pokemon)
                .OrderByDescending(sp => sp.CreatedDate)
                .ToListAsync();
        }

        public Task<SharedPokemon?> AddSharedPokemonAsync(SharedPokemon sharedPokemon)
        {
            _context.SharedPokemon.Add(sharedPokemon);
            return Task.FromResult<SharedPokemon?>(sharedPokemon);
        }

        public Task<SharedPokemon?> UpdateSharedPokemonAsync(SharedPokemon sharedPokemon)
        {
            _context.SharedPokemon.Update(sharedPokemon);
            return Task.FromResult<SharedPokemon?>(sharedPokemon);
        }

        public Task<bool> DeleteSharedPokemonAsync(SharedPokemon sharedPokemon)
        {
            _context.SharedPokemon.Remove(sharedPokemon);
            return Task.FromResult(true);
        }

        public async Task<bool> IncrementViewCountAsync(string shareToken)
        {
            var sharedPokemon = await _context.SharedPokemon
                .FirstOrDefaultAsync(sp => sp.ShareToken == shareToken);

            if (sharedPokemon != null)
            {
                sharedPokemon.ViewCount++;
                return true;
            }

            return false;
        }

        public async Task<IReadOnlyList<SharedPokemon>> GetExpiredSharedPokemonAsync()
        {
            return await _context.SharedPokemon
                .Where(sp => sp.ExpiresAt.HasValue && sp.ExpiresAt < DateTime.UtcNow)
                .ToListAsync();
        }
    }
}
