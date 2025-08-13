using Core.Entities;
using Core.Interfaces;

namespace Application.Services
{
    public class CaughtPokemonService : ICaughtPokemonService
    {
        private const int MaxPageSize = 50;
        private const int DefaultPageSize = 20;
        private readonly IUnitOfWork _unitOfWork;

        public CaughtPokemonService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<CaughtPokemon?> GetCaughtPokemonByIdAsync(int id)
        {
            return await _unitOfWork.CaughtPokemonRepository.GetCaughtPokemonByIdAsync(id);
        }

        public async Task<CaughtPokemon?> GetUserCaughtPokemonAsync(int userId, int pokemonId)
        {
            return await _unitOfWork.CaughtPokemonRepository.GetUserCaughtPokemonAsync(userId, pokemonId);
        }

        public async Task<IReadOnlyList<CaughtPokemon>> GetUserCaughtPokemonPagedAsync(int userId, int pageIndex, int pageSize)
        {
            pageSize = Math.Min(pageSize <= 0 ? DefaultPageSize : pageSize, MaxPageSize);
            return await _unitOfWork.CaughtPokemonRepository.GetUserCaughtPokemonPagedAsync(userId, pageIndex, pageSize);
        }

        public async Task<IReadOnlyList<CaughtPokemon>> GetUserFavoritePokemonAsync(int userId)
        {
            return await _unitOfWork.CaughtPokemonRepository.GetUserFavoritePokemonAsync(userId);
        }

        public async Task<CaughtPokemon?> CatchPokemonAsync(int userId, int pokeApiId, string? notes = null)
        {
            var pokemon = await _unitOfWork.PokemonRepository.GetPokemonByPokeApiIdAsync(pokeApiId);
            if (pokemon == null)
                return null;

            var existingCatch = await _unitOfWork.CaughtPokemonRepository.GetUserCaughtPokemonAsync(userId, pokemon.Id);
            if (existingCatch != null)
                return null;

            var caughtPokemon = new CaughtPokemon
            {
                UserId = userId,
                PokemonId = pokemon.Id, // Use internal database ID for foreign key relationship
                CaughtDate = DateTime.UtcNow,
                Notes = notes,
                IsFavorite = false,
                CreatedDate = DateTime.UtcNow
            };

            var result = await _unitOfWork.CaughtPokemonRepository.AddCaughtPokemonAsync(caughtPokemon);
            if (result != null)
            {
                var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
                if (user != null)
                {
                    user.CaughtCount = await _unitOfWork.CaughtPokemonRepository.GetUserCaughtPokemonCountAsync(userId);
                    await _unitOfWork.UserRepository.UpdateUserAsync(user);
                }

                await _unitOfWork.SaveChangesAsync();
            }
            return result;
        }

        public async Task<CaughtPokemon?> UpdateCaughtPokemonAsync(int userId, int pokeApiId, string? notes, bool? isFavorite)
        {
            var pokemon = await _unitOfWork.PokemonRepository.GetPokemonByPokeApiIdAsync(pokeApiId);
            if (pokemon == null)
                return null;

            var caughtPokemon = await _unitOfWork.CaughtPokemonRepository.GetUserCaughtPokemonAsync(userId, pokemon.Id);
            if (caughtPokemon == null)
                return null;

            if (notes != null)
                caughtPokemon.Notes = notes;

            if (isFavorite.HasValue)
                caughtPokemon.IsFavorite = isFavorite.Value;

            var result = await _unitOfWork.CaughtPokemonRepository.UpdateCaughtPokemonAsync(caughtPokemon);
            if (result != null)
            {
                await _unitOfWork.SaveChangesAsync();
            }
            return result;
        }

        public async Task<bool> ReleasePokemonAsync(int userId, int pokeApiId)
        {
            var pokemon = await _unitOfWork.PokemonRepository.GetPokemonByPokeApiIdAsync(pokeApiId);
            if (pokemon == null)
                return false;

            var caughtPokemon = await _unitOfWork.CaughtPokemonRepository.GetUserCaughtPokemonAsync(userId, pokemon.Id);
            if (caughtPokemon == null)
                return false;

            var result = await _unitOfWork.CaughtPokemonRepository.DeleteCaughtPokemonAsync(caughtPokemon);
            if (result)
            {
                var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
                if (user != null)
                {
                    user.CaughtCount = await _unitOfWork.CaughtPokemonRepository.GetUserCaughtPokemonCountAsync(userId);
                    await _unitOfWork.UserRepository.UpdateUserAsync(user);
                }

                await _unitOfWork.SaveChangesAsync();
            }
            return result;
        }

        public async Task<int> GetUserCaughtPokemonCountAsync(int userId)
        {
            var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
            return user?.CaughtCount ?? 0;
        }

        public async Task<bool> IsPokemonCaughtByUserAsync(int userId, int pokeApiId)
        {
            var pokemon = await _unitOfWork.PokemonRepository.GetPokemonByPokeApiIdAsync(pokeApiId);
            if (pokemon == null)
                return false;

            var caughtPokemon = await _unitOfWork.CaughtPokemonRepository.GetUserCaughtPokemonAsync(userId, pokemon.Id);
            return caughtPokemon != null;
        }

        public async Task<bool> SyncUserCaughtCountAsync(int userId)
        {
            var actualCount = await _unitOfWork.CaughtPokemonRepository.GetUserCaughtPokemonCountAsync(userId);
            var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);

            if (user != null)
            {
                user.CaughtCount = actualCount;
                await _unitOfWork.UserRepository.UpdateUserAsync(user);
                await _unitOfWork.SaveChangesAsync();
                return true;
            }

            return false;
        }

        public async Task<IReadOnlyList<CaughtPokemon>> GetUserCaughtPokemonByPokemonIdsAsync(int userId, IEnumerable<int> pokemonIds)
        {
            return await _unitOfWork.CaughtPokemonRepository.GetUserCaughtPokemonByPokemonIdsAsync(userId, pokemonIds);
        }

        public async Task<(List<CaughtPokemon> SuccessfulCatches, List<string> Errors)> BulkCatchPokemonAsync(int userId, List<(int PokeApiId, string? Notes)> pokemonToCatch)
        {
            var successfulCatches = new List<CaughtPokemon>();
            var errors = new List<string>();

            foreach (var (pokeApiId, notes) in pokemonToCatch)
            {
                try
                {
                    var result = await CatchPokemonAsync(userId, pokeApiId, notes);
                    if (result != null)
                    {
                        successfulCatches.Add(result);
                    }
                    else
                    {
                        errors.Add($"Failed to catch Pokemon with PokeApiId {pokeApiId} - already caught or not found");
                    }
                }
                catch (Exception ex)
                {
                    errors.Add($"Error catching Pokemon with PokeApiId {pokeApiId}: {ex.Message}");
                }
            }

            return (successfulCatches, errors);
        }

        public async Task<(int SuccessfulReleases, List<string> Errors)> BulkReleasePokemonAsync(int userId, List<int> pokeApiIds)
        {
            var successfulReleases = 0;
            var errors = new List<string>();

            foreach (var pokeApiId in pokeApiIds)
            {
                try
                {
                    var result = await ReleasePokemonAsync(userId, pokeApiId);
                    if (result)
                    {
                        successfulReleases++;
                    }
                    else
                    {
                        errors.Add($"Failed to release Pokemon with PokeApiId {pokeApiId} - not caught or not found");
                    }
                }
                catch (Exception ex)
                {
                    errors.Add($"Error releasing Pokemon with PokeApiId {pokeApiId}: {ex.Message}");
                }
            }

            return (successfulReleases, errors);
        }
    }
}
