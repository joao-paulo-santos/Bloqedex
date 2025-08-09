using Core.Entities;
using Core.External.PokeApi;

namespace Core.Interfaces
{
    public interface IPokeApiMapper
    {
        Pokemon MapToEntity(PokeApiPokemonResponse pokeApiPokemon);
    }
}
