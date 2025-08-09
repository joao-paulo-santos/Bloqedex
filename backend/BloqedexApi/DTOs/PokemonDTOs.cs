namespace BloqedexApi.DTOs
{
    public class PokemonDto
    {
        public int Id { get; set; }
        public int PokeApiId { get; set; }
        public required string Name { get; set; }
        public int Height { get; set; }
        public int Weight { get; set; }
        public int HP { get; set; }
        public int Attack { get; set; }
        public int Defense { get; set; }
        public int SpecialAttack { get; set; }
        public int SpecialDefense { get; set; }
        public int Speed { get; set; }
        public string? SpriteUrl { get; set; }
        public string? OfficialArtworkUrl { get; set; }
        public List<string> Types { get; set; } = new();
        public bool IsCaught { get; set; } = false;
        public DateTime? FirstAddedToPokedex { get; set; }
    }

    public class PokemonListDto
    {
        public List<PokemonDto> Pokemon { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageIndex { get; set; }
        public int PageSize { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    public class PokemonSearchDto
    {
        public string? Name { get; set; }
        public string? Type { get; set; }
        public int PageIndex { get; set; } = 0;
        public int PageSize { get; set; } = 20;
    }

    public class PokemonSummaryDto
    {
        public int Id { get; set; }
        public int PokeApiId { get; set; }
        public required string Name { get; set; }
        public string? SpriteUrl { get; set; }
        public bool IsCaught { get; set; } = false;
    }

    public class PokemonSummaryListDto
    {
        public List<PokemonSummaryDto> Pokemon { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageIndex { get; set; }
        public int PageSize { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }
}
