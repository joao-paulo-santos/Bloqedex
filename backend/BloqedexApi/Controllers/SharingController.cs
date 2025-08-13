using BloqedexApi.DTOs;
using BloqedexApi.Mappers;
using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BloqedexApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SharingController : ControllerBase
    {
        private readonly ISharedPokemonService _sharedPokemonService;
        private readonly ICaughtPokemonService _caughtPokemonService;
        private readonly IUserService _userService;

        public SharingController(ISharedPokemonService sharedPokemonService, ICaughtPokemonService caughtPokemonService, IUserService userService)
        {
            _sharedPokemonService = sharedPokemonService;
            _caughtPokemonService = caughtPokemonService;
            _userService = userService;
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<SharedPokemonDto>> CreateShare([FromBody] CreateShareRequest request)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized();

            SharedPokemon? sharedPokemon = null;

            if (request.ShareType == ShareType.SinglePokemon)
            {
                if (!request.PokeApiId.HasValue)
                    return BadRequest("PokeApiId is required for single Pokemon shares");

                sharedPokemon = await _sharedPokemonService.CreateSinglePokemonShareAsync(
                    userId.Value,
                    request.PokeApiId.Value,
                    request.Title,
                    request.Description,
                    request.ExpiresAt,
                    request.MaxViews);
            }
            else if (request.ShareType == ShareType.Collection)
            {
                sharedPokemon = await _sharedPokemonService.CreateCollectionShareAsync(
                    userId.Value,
                    request.Title,
                    request.Description,
                    request.ExpiresAt,
                    request.MaxViews);
            }

            if (sharedPokemon == null)
                return BadRequest("Failed to create share");

            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            return Ok(SharedPokemonMapper.ToDto(sharedPokemon, baseUrl));
        }

        [HttpGet("my-shares")]
        [Authorize]
        public async Task<ActionResult<UserSharedPokemonListDto>> GetMyShares()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized();

            var shares = await _sharedPokemonService.GetUserSharedPokemonAsync(userId.Value);
            var baseUrl = $"{Request.Scheme}://{Request.Host}";

            return Ok(SharedPokemonMapper.ToListDto(shares, baseUrl));
        }

        [HttpGet("{shareToken}")]
        public async Task<ActionResult<SharedPokemonViewDto>> ViewSharedPokemon(string shareToken)
        {
            var sharedPokemon = await _sharedPokemonService.ValidateAndGetSharedPokemonAsync(shareToken);
            if (sharedPokemon == null)
                return NotFound("Share not found or no longer available");

            await _sharedPokemonService.IncrementViewCountAsync(shareToken);

            var response = new SharedPokemonViewDto
            {
                Title = sharedPokemon.Title,
                Description = sharedPokemon.Description,
                ShareType = sharedPokemon.ShareType,
                OwnerUsername = sharedPokemon.User.Username,
                SharedDate = sharedPokemon.CreatedDate,
                ViewCount = sharedPokemon.ViewCount + 1
            };

            if (sharedPokemon.ShareType == ShareType.SinglePokemon && sharedPokemon.CaughtPokemon != null)
            {
                response.Pokemon = PokemonMapper.ToDto(
                    sharedPokemon.CaughtPokemon.Pokemon,
                    true,
                    sharedPokemon.CaughtPokemon.CreatedDate);
            }
            else if (sharedPokemon.ShareType == ShareType.Collection)
            {
                var caughtPokemons = await _caughtPokemonService.GetUserCaughtPokemonPagedAsync(
                    sharedPokemon.UserId, 0, int.MaxValue);

                var pokemonList = caughtPokemons.Select(cp => cp.Pokemon).ToList();
                response.Collection = PokemonMapper.ToListDto(
                    pokemonList,
                    pokemonList.Count,
                    0,
                    pokemonList.Count,
                    sharedPokemon.UserId,
                    caughtPokemons);
            }

            return Ok(response);
        }

        [HttpPut("{shareId}")]
        [Authorize]
        public async Task<ActionResult> UpdateShare(int shareId, [FromBody] UpdateShareRequest request)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized();

            var success = await _sharedPokemonService.UpdateSharedPokemonAsync(
                shareId,
                userId.Value,
                request.Title,
                request.Description,
                request.ExpiresAt,
                request.MaxViews,
                request.IsActive);

            if (!success)
                return NotFound("Share not found or you don't have permission to update it");

            return Ok(new { message = "Share updated successfully" });
        }

        [HttpDelete("{shareId}")]
        [Authorize]
        public async Task<ActionResult> DeleteShare(int shareId)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue)
                return Unauthorized();

            var success = await _sharedPokemonService.DeleteSharedPokemonAsync(shareId, userId.Value);

            if (!success)
                return NotFound("Share not found or you don't have permission to delete it");

            return Ok(new { message = "Share deleted successfully" });
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : null;
        }
    }
}
