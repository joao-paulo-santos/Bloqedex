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
    public class PokemonController : ControllerBase
    {
        private readonly IPokemonService _pokemonService;
        private readonly ICaughtPokemonService _caughtPokemonService;
        private readonly IUserService _userService;

        public PokemonController(IPokemonService pokemonService, ICaughtPokemonService caughtPokemonService, IUserService userService)
        {
            _pokemonService = pokemonService;
            _caughtPokemonService = caughtPokemonService;
            _userService = userService;
        }

        [HttpGet]
        public async Task<ActionResult<PokemonListDto>> GetPokemon([FromQuery] PokemonSearchDto searchDto)
        {
            var userId = GetCurrentUserId();
            IReadOnlyList<Core.Entities.Pokemon> pokemon;
            var totalCount = 0;

            if (!string.IsNullOrEmpty(searchDto.Name)) // By Name
            {
                var specificPokemon = await _pokemonService.GetOrFetchPokemonByNameAsync(searchDto.Name);
                if (specificPokemon != null)
                {
                    pokemon = new List<Core.Entities.Pokemon> { specificPokemon };
                    totalCount = 1;
                }
                else
                {
                    pokemon = await _pokemonService.SearchPokemonByNameAsync(searchDto.Name, searchDto.PageIndex, searchDto.PageSize);
                    totalCount = pokemon.Count;
                }
            }
            else if (!string.IsNullOrEmpty(searchDto.Type)) // By Type
            {
                pokemon = await _pokemonService.GetOrFetchPokemonByTypeAsync(searchDto.Type, searchDto.PageIndex, searchDto.PageSize);
                totalCount = pokemon.Count;
            }
            else // By Pagination
            {
                pokemon = await _pokemonService.GetOrFetchPagedListOfPokemonAsync(searchDto.PageIndex, searchDto.PageSize);
                totalCount = await _pokemonService.GetTotalPokemonCountAsync();
            }

            // Get caught Pokemon for the current user if logged in
            IReadOnlyList<Core.Entities.CaughtPokemon>? caughtPokemon = null;
            if (userId.HasValue)
            {
                var pokemonIds = pokemon.Select(p => p.Id).ToList();
                caughtPokemon = await _caughtPokemonService.GetUserCaughtPokemonByPokemonIdsAsync(userId.Value, pokemonIds);
            }

            var result = PokemonMapper.ToListDto(pokemon, totalCount, searchDto.PageIndex, searchDto.PageSize, userId, caughtPokemon);
            return Ok(result);
        }

        [HttpGet("summary")]
        public async Task<ActionResult<PokemonSummaryListDto>> GetPokemonSummary([FromQuery] PokemonSearchDto searchDto)
        {
            var userId = GetCurrentUserId();
            IReadOnlyList<Core.Entities.Pokemon> pokemon;
            var totalCount = 0;

            if (!string.IsNullOrEmpty(searchDto.Name))
            {
                var specificPokemon = await _pokemonService.GetOrFetchPokemonByNameAsync(searchDto.Name);
                if (specificPokemon != null)
                {
                    pokemon = new List<Core.Entities.Pokemon> { specificPokemon };
                    totalCount = 1;
                }
                else
                {
                    // Fall back to local search
                    pokemon = await _pokemonService.SearchPokemonByNameAsync(searchDto.Name, searchDto.PageIndex, searchDto.PageSize);
                    totalCount = pokemon.Count;
                }
            }
            else if (!string.IsNullOrEmpty(searchDto.Type))
            {
                pokemon = await _pokemonService.GetOrFetchPokemonByTypeAsync(searchDto.Type, searchDto.PageIndex, searchDto.PageSize);
                totalCount = pokemon.Count;
            }
            else
            {
                pokemon = await _pokemonService.GetOrFetchPagedListOfPokemonAsync(searchDto.PageIndex, searchDto.PageSize);
                totalCount = await _pokemonService.GetTotalPokemonCountAsync();
            }

            // Get caught Pokemon for the current user if logged in
            IReadOnlyList<Core.Entities.CaughtPokemon>? caughtPokemon = null;
            if (userId.HasValue)
            {
                var pokemonIds = pokemon.Select(p => p.Id).ToList();
                caughtPokemon = await _caughtPokemonService.GetUserCaughtPokemonByPokemonIdsAsync(userId.Value, pokemonIds);
            }

            var result = PokemonMapper.ToSummaryListDto(pokemon, totalCount, searchDto.PageIndex, searchDto.PageSize, userId, caughtPokemon);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PokemonDto>> GetPokemonById(int id)
        {
            var pokemon = await _pokemonService.GetPokemonByIdAsync(id);
            if (pokemon == null)
                return NotFound();

            var userId = GetCurrentUserId();
            bool isCaught = false;
            DateTime? firstAddedToPokedex = null;

            if (userId.HasValue)
            {
                var caughtPokemon = await _caughtPokemonService.GetUserCaughtPokemonAsync(userId.Value, pokemon.Id);
                if (caughtPokemon != null)
                {
                    isCaught = true;
                    firstAddedToPokedex = caughtPokemon.CreatedDate;
                }
            }

            return Ok(PokemonMapper.ToDto(pokemon, isCaught, firstAddedToPokedex));
        }

        [HttpGet("pokeapi/{pokeApiId}")]
        public async Task<ActionResult<PokemonDto>> GetPokemonByPokeApiId(int pokeApiId)
        {
            var pokemon = await _pokemonService.GetOrFetchPokemonByPokeApiIdAsync(pokeApiId);
            if (pokemon == null)
                return NotFound();

            var userId = GetCurrentUserId();
            bool isCaught = false;
            DateTime? firstAddedToPokedex = null;

            if (userId.HasValue)
            {
                var caughtPokemon = await _caughtPokemonService.GetUserCaughtPokemonAsync(userId.Value, pokemon.Id);
                if (caughtPokemon != null)
                {
                    isCaught = true;
                    firstAddedToPokedex = caughtPokemon.CreatedDate;
                }
            }

            return Ok(PokemonMapper.ToDto(pokemon, isCaught, firstAddedToPokedex));
        }

        [HttpPost("sync")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> SyncPokemonFromPokeApi([FromQuery] int maxCount = 0)
        {
            try
            {
                await _pokemonService.SyncPokemonFromPokeApiAsync(maxCount);

                var actualCount = maxCount == 0 ? "all available" : maxCount.ToString();
                return Ok(new { message = $"Successfully initiated sync for {actualCount} Pokemon from PokeAPI" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error occurred during sync", error = ex.Message });
            }
        }

        [HttpGet("stats")]
        public async Task<ActionResult> GetPokemonStats()
        {
            var totalPokemon = await _pokemonService.GetTotalPokemonCountAsync();
            var userId = GetCurrentUserId();

            int userCaughtCount = 0;
            if (userId.HasValue)
            {
                var user = await _userService.GetUserByIdAsync(userId.Value);
                userCaughtCount = user?.CaughtCount ?? 0;
            }

            var stats = new
            {
                TotalPokemonInDatabase = totalPokemon,
                UserCaughtCount = userCaughtCount
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
