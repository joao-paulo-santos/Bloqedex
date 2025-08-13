using Core.Entities;
using Core.Interfaces;
using System.Security.Cryptography;
using System.Text;

namespace Application.Services
{
    public class SharedPokemonService : ISharedPokemonService
    {
        private readonly IUnitOfWork _unitOfWork;

        public SharedPokemonService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<SharedPokemon?> CreateSinglePokemonShareAsync(int userId, int pokeApiId, string? title = null, string? description = null, DateTime? expiresAt = null, int? maxViews = null)
        {
            // Get the Pokemon by PokeApiId first
            var pokemon = await _unitOfWork.PokemonRepository.GetPokemonByPokeApiIdAsync(pokeApiId);
            if (pokemon == null)
                return null;

            // Permission Check - verify user has caught this Pokemon
            var caughtPokemon = await _unitOfWork.CaughtPokemonRepository.GetUserCaughtPokemonAsync(userId, pokemon.Id);
            if (caughtPokemon == null)
                return null;

            var shareToken = GenerateShareToken();
            var sharedPokemon = new SharedPokemon
            {
                UserId = userId,
                CaughtPokemonId = caughtPokemon.Id, // Still store the internal ID for the relationship
                ShareToken = shareToken,
                ShareType = ShareType.SinglePokemon,
                Title = title,
                Description = description,
                ExpiresAt = expiresAt,
                MaxViews = maxViews,
                IsActive = true
            };

            var result = await _unitOfWork.SharedPokemonRepository.AddSharedPokemonAsync(sharedPokemon);
            await _unitOfWork.SaveChangesAsync();
            return result;
        }

        public async Task<SharedPokemon?> CreateCollectionShareAsync(int userId, string? title = null, string? description = null, DateTime? expiresAt = null, int? maxViews = null)
        {
            // Permission Check
            var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
            if (user == null || user.CaughtCount == 0)
                return null;

            var shareToken = GenerateShareToken();
            var sharedPokemon = new SharedPokemon
            {
                UserId = userId,
                CaughtPokemonId = null, // Collection
                ShareToken = shareToken,
                ShareType = ShareType.Collection,
                Title = title,
                Description = description,
                ExpiresAt = expiresAt,
                MaxViews = maxViews,
                IsActive = true
            };

            var result = await _unitOfWork.SharedPokemonRepository.AddSharedPokemonAsync(sharedPokemon);
            await _unitOfWork.SaveChangesAsync();
            return result;
        }

        public async Task<SharedPokemon?> GetSharedPokemonByTokenAsync(string shareToken)
        {
            return await _unitOfWork.SharedPokemonRepository.GetSharedPokemonByTokenAsync(shareToken);
        }

        public async Task<IReadOnlyList<SharedPokemon>> GetUserSharedPokemonAsync(int userId)
        {
            return await _unitOfWork.SharedPokemonRepository.GetUserSharedPokemonAsync(userId);
        }

        public async Task<bool> UpdateSharedPokemonAsync(int shareId, int userId, string? title = null, string? description = null, DateTime? expiresAt = null, int? maxViews = null, bool? isActive = null)
        {
            var sharedPokemon = await _unitOfWork.SharedPokemonRepository.GetSharedPokemonByIdAsync(shareId);
            if (sharedPokemon == null || sharedPokemon.UserId != userId)
                return false;

            if (title != null) sharedPokemon.Title = title;
            if (description != null) sharedPokemon.Description = description;
            if (expiresAt.HasValue) sharedPokemon.ExpiresAt = expiresAt;
            if (maxViews.HasValue) sharedPokemon.MaxViews = maxViews;
            if (isActive.HasValue) sharedPokemon.IsActive = isActive.Value;

            await _unitOfWork.SharedPokemonRepository.UpdateSharedPokemonAsync(sharedPokemon);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteSharedPokemonAsync(int shareId, int userId)
        {
            var sharedPokemon = await _unitOfWork.SharedPokemonRepository.GetSharedPokemonByIdAsync(shareId);
            if (sharedPokemon == null || sharedPokemon.UserId != userId)
                return false;

            await _unitOfWork.SharedPokemonRepository.DeleteSharedPokemonAsync(sharedPokemon);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<bool> IncrementViewCountAsync(string shareToken)
        {
            var result = await _unitOfWork.SharedPokemonRepository.IncrementViewCountAsync(shareToken);
            if (result)
            {
                await _unitOfWork.SaveChangesAsync();
            }
            return result;
        }

        public async Task<SharedPokemon?> ValidateAndGetSharedPokemonAsync(string shareToken)
        {
            var sharedPokemon = await GetSharedPokemonByTokenAsync(shareToken);
            if (sharedPokemon == null)
                return null;

            if (!sharedPokemon.IsActive)
                return null;

            if (sharedPokemon.ExpiresAt.HasValue && sharedPokemon.ExpiresAt < DateTime.UtcNow)
                return null;

            if (sharedPokemon.MaxViews.HasValue && sharedPokemon.ViewCount >= sharedPokemon.MaxViews)
                return null;

            return sharedPokemon;
        }

        public async Task CleanupExpiredSharesAsync()
        {
            var expiredShares = await _unitOfWork.SharedPokemonRepository.GetExpiredSharedPokemonAsync();
            foreach (var share in expiredShares)
            {
                await _unitOfWork.SharedPokemonRepository.DeleteSharedPokemonAsync(share);
            }

            if (expiredShares.Count > 0)
            {
                await _unitOfWork.SaveChangesAsync();
            }
        }

        private static string GenerateShareToken()
        {
            var bytes = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }
            return Convert.ToBase64String(bytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "")
                .Substring(0, 32);
        }
    }
}
