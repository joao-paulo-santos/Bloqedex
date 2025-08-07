using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class CaughtPokemonRepository : ICaughtPokemonRepository
    {
        private readonly BloqedexDbContext _context;

        public CaughtPokemonRepository(BloqedexDbContext context)
        {
            _context = context;
        }

        public async Task<CaughtPokemon?> GetCaughtPokemonByIdAsync(int id)
        {
            return await _context.CaughtPokemon
                .Include(cp => cp.Pokemon)
                    .ThenInclude(p => p.PokemonTypes)
                .Include(cp => cp.User)
                .FirstOrDefaultAsync(cp => cp.Id == id);
        }

        public async Task<CaughtPokemon?> GetUserCaughtPokemonAsync(int userId, int pokemonId)
        {
            return await _context.CaughtPokemon
                .Include(cp => cp.Pokemon)
                    .ThenInclude(p => p.PokemonTypes)
                .FirstOrDefaultAsync(cp => cp.UserId == userId && cp.PokemonId == pokemonId);
        }

        public async Task<IReadOnlyList<CaughtPokemon>> GetUserCaughtPokemonPagedAsync(int userId, int pageIndex, int pageSize)
        {
            return await _context.CaughtPokemon
                .Include(cp => cp.Pokemon)
                    .ThenInclude(p => p.PokemonTypes)
                .Where(cp => cp.UserId == userId)
                .OrderByDescending(cp => cp.CaughtDate)
                .Skip(pageIndex * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<CaughtPokemon>> GetUserFavoritePokemonAsync(int userId)
        {
            return await _context.CaughtPokemon
                .Include(cp => cp.Pokemon)
                    .ThenInclude(p => p.PokemonTypes)
                .Where(cp => cp.UserId == userId && cp.IsFavorite)
                .OrderByDescending(cp => cp.CaughtDate)
                .ToListAsync();
        }

        public async Task<CaughtPokemon?> AddCaughtPokemonAsync(CaughtPokemon caughtPokemon)
        {
            _context.CaughtPokemon.Add(caughtPokemon);
            return caughtPokemon;
        }

        public async Task<CaughtPokemon?> UpdateCaughtPokemonAsync(CaughtPokemon caughtPokemon)
        {
            _context.CaughtPokemon.Update(caughtPokemon);
            return caughtPokemon;
        }

        public async Task<bool> DeleteCaughtPokemonAsync(CaughtPokemon caughtPokemon)
        {
            _context.CaughtPokemon.Remove(caughtPokemon);
            return true;
        }

        public async Task<int> GetUserCaughtPokemonCountAsync(int userId)
        {
            return await _context.CaughtPokemon
                .Where(cp => cp.UserId == userId)
                .CountAsync();
        }
    }
}
