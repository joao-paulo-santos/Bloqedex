using BloqedexApi.DTOs;
using Core.Entities;

namespace BloqedexApi.Mappers
{
    public static class SharedPokemonMapper
    {
        public static SharedPokemonDto ToDto(SharedPokemon sharedPokemon, string baseUrl)
        {
            return new SharedPokemonDto
            {
                Id = sharedPokemon.Id,
                ShareToken = sharedPokemon.ShareToken,
                ShareType = sharedPokemon.ShareType,
                Title = sharedPokemon.Title,
                Description = sharedPokemon.Description,
                IsActive = sharedPokemon.IsActive,
                ExpiresAt = sharedPokemon.ExpiresAt,
                ViewCount = sharedPokemon.ViewCount,
                MaxViews = sharedPokemon.MaxViews,
                CreatedDate = sharedPokemon.CreatedDate,
                ShareUrl = $"{baseUrl}/api/sharing/{sharedPokemon.ShareToken}"
            };
        }

        public static UserSharedPokemonListDto ToListDto(IReadOnlyList<SharedPokemon> sharedPokemons, string baseUrl)
        {
            return new UserSharedPokemonListDto
            {
                SharedPokemons = sharedPokemons.Select(sp => ToDto(sp, baseUrl)).ToList(),
                TotalCount = sharedPokemons.Count
            };
        }
    }
}
