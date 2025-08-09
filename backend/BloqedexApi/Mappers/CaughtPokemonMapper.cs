using BloqedexApi.DTOs;
using Core.Entities;

namespace BloqedexApi.Mappers
{
    public static class CaughtPokemonMapper
    {
        public static CaughtPokemonDto ToDto(CaughtPokemon caughtPokemon)
        {
            return new CaughtPokemonDto
            {
                Id = caughtPokemon.Id,
                UserId = caughtPokemon.UserId,
                Pokemon = PokemonMapper.ToDto(caughtPokemon.Pokemon, true, caughtPokemon.CreatedDate),
                CaughtDate = caughtPokemon.CaughtDate,
                Notes = caughtPokemon.Notes,
                IsFavorite = caughtPokemon.IsFavorite
            };
        }

        public static CaughtPokemonListDto ToListDto(IReadOnlyList<CaughtPokemon> caughtPokemon, int totalCount, int pageIndex, int pageSize)
        {
            return new CaughtPokemonListDto
            {
                CaughtPokemon = caughtPokemon.Select(ToDto).ToList(),
                TotalCount = totalCount,
                PageIndex = pageIndex,
                PageSize = pageSize,
                HasNextPage = (pageIndex + 1) * pageSize < totalCount,
                HasPreviousPage = pageIndex > 0
            };
        }
    }
}
