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

        public async Task<CaughtPokemon?> CatchPokemonAsync(int userId, int pokemonId, string? notes = null)
        {
            var pokemon = await _unitOfWork.PokemonRepository.GetPokemonByIdAsync(pokemonId);
            if (pokemon == null)
                return null;

            var existingCatch = await _unitOfWork.CaughtPokemonRepository.GetUserCaughtPokemonAsync(userId, pokemonId);
            if (existingCatch != null)
                return null;

            var caughtPokemon = new CaughtPokemon
            {
                UserId = userId,
                PokemonId = pokemonId,
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

        public async Task<CaughtPokemon?> UpdateCaughtPokemonAsync(int caughtPokemonId, string? notes, bool? isFavorite)
        {
            var caughtPokemon = await _unitOfWork.CaughtPokemonRepository.GetCaughtPokemonByIdAsync(caughtPokemonId);
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

        public async Task<bool> ReleasePokemonAsync(int userId, int caughtPokemonId)
        {
            var caughtPokemon = await _unitOfWork.CaughtPokemonRepository.GetCaughtPokemonByIdAsync(caughtPokemonId);
            if (caughtPokemon == null || caughtPokemon.UserId != userId)
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

        public async Task<bool> IsPokemonCaughtByUserAsync(int userId, int pokemonId)
        {
            var caughtPokemon = await _unitOfWork.CaughtPokemonRepository.GetUserCaughtPokemonAsync(userId, pokemonId);
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

        public async Task<(List<CaughtPokemon> SuccessfulCatches, List<string> Errors)> BulkCatchPokemonAsync(int userId, List<(int PokemonId, string? Notes)> pokemonToCatch)
        {
            var successfulCatches = new List<CaughtPokemon>();
            var errors = new List<string>();

            foreach (var (pokemonId, notes) in pokemonToCatch)
            {
                try
                {
                    var result = await CatchPokemonAsync(userId, pokemonId, notes);
                    if (result != null)
                    {
                        successfulCatches.Add(result);
                    }
                    else
                    {
                        errors.Add($"Failed to catch Pokemon with ID {pokemonId} - already caught or not found");
                    }
                }
                catch (Exception ex)
                {
                    errors.Add($"Error catching Pokemon with ID {pokemonId}: {ex.Message}");
                }
            }

            return (successfulCatches, errors);
        }

        public async Task<(int SuccessfulReleases, List<string> Errors)> BulkReleasePokemonAsync(int userId, List<int> caughtPokemonIds)
        {
            var successfulReleases = 0;
            var errors = new List<string>();

            foreach (var caughtPokemonId in caughtPokemonIds)
            {
                try
                {
                    var result = await ReleasePokemonAsync(userId, caughtPokemonId);
                    if (result)
                    {
                        successfulReleases++;
                    }
                    else
                    {
                        errors.Add($"Failed to release Pokemon with caught ID {caughtPokemonId} - not found or access denied");
                    }
                }
                catch (Exception ex)
                {
                    errors.Add($"Error releasing Pokemon with caught ID {caughtPokemonId}: {ex.Message}");
                }
            }

            return (successfulReleases, errors);
        }
    }
}
