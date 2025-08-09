using BloqedexApi.DTOs;
using BloqedexApi.Mappers;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BloqedexApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PokedexController : ControllerBase
    {
        private readonly ICaughtPokemonService _caughtPokemonService;
        private readonly IPokemonService _pokemonService;

        public PokedexController(ICaughtPokemonService caughtPokemonService, IPokemonService pokemonService)
        {
            _caughtPokemonService = caughtPokemonService;
            _pokemonService = pokemonService;
        }

        [HttpGet]
        public async Task<ActionResult<CaughtPokemonListDto>> GetCaughtPokemon([FromQuery] int pageIndex = 0, [FromQuery] int pageSize = 20)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var caughtPokemon = await _caughtPokemonService.GetUserCaughtPokemonPagedAsync(userId.Value, pageIndex, pageSize);
            var totalCount = await _caughtPokemonService.GetUserCaughtPokemonCountAsync(userId.Value);

            var result = CaughtPokemonMapper.ToListDto(caughtPokemon, totalCount, pageIndex, pageSize);
            return Ok(result);
        }

        [HttpGet("favorites")]
        public async Task<ActionResult<List<CaughtPokemonDto>>> GetFavoritePokemon()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var favoritePokemon = await _caughtPokemonService.GetUserFavoritePokemonAsync(userId.Value);
            var result = favoritePokemon.Select(CaughtPokemonMapper.ToDto).ToList();

            return Ok(result);
        }

        [HttpPost("catch")]
        public async Task<ActionResult<CaughtPokemonDto>> CatchPokemon([FromBody] CatchPokemonDto catchDto)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var caughtPokemon = await _caughtPokemonService.CatchPokemonAsync(userId.Value, catchDto.PokemonId, catchDto.Notes);
            if (caughtPokemon == null)
                return BadRequest("Pokemon not found or already caught");

            return Ok(CaughtPokemonMapper.ToDto(caughtPokemon));
        }

        [HttpPost("catch/bulk")]
        public async Task<ActionResult<BulkOperationResultDto>> BulkCatchPokemon([FromBody] BulkCatchPokemonDto bulkCatchDto)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            if (bulkCatchDto.PokemonToCatch == null || !bulkCatchDto.PokemonToCatch.Any())
                return BadRequest("No Pokemon specified for bulk catch operation");

            var pokemonToCatch = bulkCatchDto.PokemonToCatch
                .Select(p => (p.PokemonId, p.Notes))
                .ToList();

            var (successfulCatches, errors) = await _caughtPokemonService.BulkCatchPokemonAsync(userId.Value, pokemonToCatch);

            var result = new BulkOperationResultDto
            {
                SuccessfulOperations = successfulCatches.Count,
                FailedOperations = errors.Count,
                Errors = errors,
                CaughtPokemon = successfulCatches.Select(CaughtPokemonMapper.ToDto).ToList()
            };

            return Ok(result);
        }

        [HttpPatch("{caughtPokemonId}")]
        public async Task<ActionResult<CaughtPokemonDto>> UpdateCaughtPokemon(int caughtPokemonId, [FromBody] UpdateCaughtPokemonDto updateDto)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var existingCaughtPokemon = await _caughtPokemonService.GetCaughtPokemonByIdAsync(caughtPokemonId);
            if (existingCaughtPokemon == null)
                return NotFound();

            if (existingCaughtPokemon.UserId != userId.Value)
                return Forbid();

            var updatedCaughtPokemon = await _caughtPokemonService.UpdateCaughtPokemonAsync(caughtPokemonId, updateDto.Notes, updateDto.IsFavorite);
            if (updatedCaughtPokemon == null)
                return BadRequest("Failed to update caught Pokemon");

            return Ok(CaughtPokemonMapper.ToDto(updatedCaughtPokemon));
        }

        [HttpDelete("{caughtPokemonId}")]
        public async Task<ActionResult> ReleasePokemon(int caughtPokemonId)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var success = await _caughtPokemonService.ReleasePokemonAsync(userId.Value, caughtPokemonId);
            if (!success)
                return BadRequest("Failed to release Pokemon or Pokemon not found");

            return Ok();
        }

        [HttpDelete("release/bulk")]
        public async Task<ActionResult<BulkOperationResultDto>> BulkReleasePokemon([FromBody] BulkReleasePokemonDto bulkReleaseDto)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            if (bulkReleaseDto.CaughtPokemonIds == null || !bulkReleaseDto.CaughtPokemonIds.Any())
                return BadRequest("No Pokemon specified for bulk release operation");

            var (successfulReleases, errors) = await _caughtPokemonService.BulkReleasePokemonAsync(userId.Value, bulkReleaseDto.CaughtPokemonIds);

            var result = new BulkOperationResultDto
            {
                SuccessfulOperations = successfulReleases,
                FailedOperations = errors.Count,
                Errors = errors
            };

            return Ok(result);
        }

        [HttpGet("check/{pokemonId}")]
        public async Task<ActionResult<bool>> IsPokemonCaught(int pokemonId)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var isCaught = await _caughtPokemonService.IsPokemonCaughtByUserAsync(userId.Value, pokemonId);
            return Ok(isCaught);
        }

        [HttpGet("stats")]
        public async Task<ActionResult> GetPokedexStats()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var totalCaught = await _caughtPokemonService.GetUserCaughtPokemonCountAsync(userId.Value);
            var favoritePokemon = await _caughtPokemonService.GetUserFavoritePokemonAsync(userId.Value);
            var totalPokemon = await _pokemonService.GetTotalPokemonCountAsync();

            var stats = new
            {
                TotalCaught = totalCaught,
                FavoriteCount = favoritePokemon.Count,
                CompletionPercentage = totalPokemon > 0 ? Math.Round((double)totalCaught / totalPokemon * 100, 2) : 0
            };

            return Ok(stats);
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : null;
        }
    }
}
