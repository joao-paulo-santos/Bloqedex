using BloqedexApi.DTOs;
using Core.Entities;

namespace BloqedexApi.Mappers
{
    public static class PokemonMapper
    {
        public static PokemonDto ToDto(Pokemon pokemon, bool isCaught = false, DateTime? firstAddedToPokedex = null)
        {
            return new PokemonDto
            {
                Id = pokemon.Id,
                PokeApiId = pokemon.PokeApiId,
                Name = pokemon.Name,
                Height = pokemon.Height,
                Weight = pokemon.Weight,
                HP = pokemon.HP,
                Attack = pokemon.Attack,
                Defense = pokemon.Defense,
                SpecialAttack = pokemon.SpecialAttack,
                SpecialDefense = pokemon.SpecialDefense,
                Speed = pokemon.Speed,
                SpriteUrl = pokemon.SpriteUrl,
                OfficialArtworkUrl = pokemon.OfficialArtworkUrl,
                Types = pokemon.PokemonTypes.OrderBy(pt => pt.Slot).Select(pt => pt.TypeName).ToList(),
                IsCaught = isCaught,
                FirstAddedToPokedex = firstAddedToPokedex ?? pokemon.CreatedDate
            };
        }

        public static PokemonListDto ToListDto(IReadOnlyList<Pokemon> pokemon, int totalCount, int pageIndex, int pageSize, int? userId = null, IReadOnlyList<CaughtPokemon>? caughtPokemon = null)
        {
            var pokemonDtos = pokemon.Select(p =>
            {
                var isCaught = caughtPokemon?.Any(cp => cp.PokemonId == p.Id) ?? false;
                var firstAdded = caughtPokemon?.FirstOrDefault(cp => cp.PokemonId == p.Id)?.CreatedDate;
                return ToDto(p, isCaught, firstAdded);
            }).ToList();

            return new PokemonListDto
            {
                Pokemon = pokemonDtos,
                TotalCount = totalCount,
                PageIndex = pageIndex,
                PageSize = pageSize,
                HasNextPage = (pageIndex + 1) * pageSize < totalCount,
                HasPreviousPage = pageIndex > 0
            };
        }

        public static PokemonSummaryDto ToSummaryDto(Pokemon pokemon, bool isCaught = false)
        {
            return new PokemonSummaryDto
            {
                Id = pokemon.Id,
                PokeApiId = pokemon.PokeApiId,
                Name = pokemon.Name,
                SpriteUrl = pokemon.SpriteUrl,
                IsCaught = isCaught
            };
        }

        public static PokemonSummaryListDto ToSummaryListDto(IReadOnlyList<Pokemon> pokemon, int totalCount, int pageIndex, int pageSize, int? userId = null, IReadOnlyList<CaughtPokemon>? caughtPokemon = null)
        {
            var pokemonSummaryDtos = pokemon.Select(p =>
            {
                var isCaught = caughtPokemon?.Any(cp => cp.PokemonId == p.Id) ?? false;
                return ToSummaryDto(p, isCaught);
            }).ToList();

            return new PokemonSummaryListDto
            {
                Pokemon = pokemonSummaryDtos,
                TotalCount = totalCount,
                PageIndex = pageIndex,
                PageSize = pageSize,
                HasNextPage = (pageIndex + 1) * pageSize < totalCount,
                HasPreviousPage = pageIndex > 0
            };
        }
    }
}
