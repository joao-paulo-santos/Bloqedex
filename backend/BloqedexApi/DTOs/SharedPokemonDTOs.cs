using Core.Entities;

namespace BloqedexApi.DTOs
{
    public class CreateShareRequest
    {
        public ShareType ShareType { get; set; }
        /// <summary>
        /// The PokeAPI ID of the Pokemon to share (e.g., 25 for Pikachu, 1 for Bulbasaur). Only used for SinglePokemon shares.
        /// </summary>
        public int? PokeApiId { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public int? MaxViews { get; set; }
    }

    public class UpdateShareRequest
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public int? MaxViews { get; set; }
        public bool? IsActive { get; set; }
    }

    public class SharedPokemonDto
    {
        public int Id { get; set; }
        public required string ShareToken { get; set; }
        public ShareType ShareType { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public int ViewCount { get; set; }
        public int? MaxViews { get; set; }
        public DateTime CreatedDate { get; set; }
        public string ShareUrl { get; set; } = string.Empty;
    }

    public class SharedPokemonViewDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public ShareType ShareType { get; set; }
        public string OwnerUsername { get; set; } = string.Empty;
        public DateTime SharedDate { get; set; }
        public int ViewCount { get; set; }

        public PokemonDto? Pokemon { get; set; }

        public PokemonListDto? Collection { get; set; }
    }

    public class UserSharedPokemonListDto
    {
        public List<SharedPokemonDto> SharedPokemons { get; set; } = new();
        public int TotalCount { get; set; }
    }
}
