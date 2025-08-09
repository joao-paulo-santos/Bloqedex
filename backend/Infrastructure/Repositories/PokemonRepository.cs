using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class PokemonRepository : IPokemonRepository
    {
        private readonly BloqedexDbContext _context;

        public PokemonRepository(BloqedexDbContext context)
        {
            _context = context;
        }

        public async Task<Pokemon?> GetPokemonByIdAsync(int id)
        {
            return await _context.Pokemon
                .Include(p => p.PokemonTypes)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<Pokemon?> GetPokemonByPokeApiIdAsync(int pokeApiId)
        {
            return await _context.Pokemon
                .Include(p => p.PokemonTypes)
                .FirstOrDefaultAsync(p => p.PokeApiId == pokeApiId);
        }

        public async Task<IReadOnlyList<Pokemon>> GetPokemonByPokeApiIdRangeAsync(int startId, int endId)
        {
            return await _context.Pokemon
                .Include(p => p.PokemonTypes)
                .Where(p => p.PokeApiId >= startId && p.PokeApiId <= endId)
                .OrderBy(p => p.PokeApiId)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Pokemon>> GetPagedListOfPokemonAsync(int pageIndex, int pageSize)
        {
            return await _context.Pokemon
                .Include(p => p.PokemonTypes)
                .OrderBy(p => p.PokeApiId)
                .Skip(pageIndex * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Pokemon>> SearchPokemonByNameAsync(string name, int pageIndex, int pageSize)
        {
            return await _context.Pokemon
                .Include(p => p.PokemonTypes)
                .Where(p => p.Name.Contains(name.ToLower()))
                .OrderBy(p => p.Name)
                .Skip(pageIndex * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Pokemon>> GetPokemonByTypeAsync(string typeName, int pageIndex, int pageSize)
        {
            return await _context.Pokemon
                .Include(p => p.PokemonTypes)
                .Where(p => p.PokemonTypes.Any(pt => pt.TypeName == typeName.ToLower()))
                .OrderBy(p => p.PokeApiId)
                .Skip(pageIndex * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public Task<Pokemon?> AddPokemonAsync(Pokemon pokemon)
        {
            _context.Pokemon.Add(pokemon);
            return Task.FromResult<Pokemon?>(pokemon);
        }

        public Task<Pokemon?> UpdatePokemonAsync(Pokemon pokemon)
        {
            pokemon.ModifiedDate = DateTime.UtcNow;
            _context.Pokemon.Update(pokemon);
            return Task.FromResult<Pokemon?>(pokemon);
        }

        public Task<bool> DeletePokemonAsync(Pokemon pokemon)
        {
            _context.Pokemon.Remove(pokemon);
            return Task.FromResult(true);
        }

        public async Task<int> GetTotalPokemonCountAsync()
        {
            return await _context.Pokemon.CountAsync();
        }
    }
}
