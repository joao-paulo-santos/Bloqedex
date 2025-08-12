namespace BloqedexApi.DTOs
{
    public class CaughtPokemonDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public required PokemonDto Pokemon { get; set; }
        public DateTime CaughtDate { get; set; }
        public string? Notes { get; set; }
        public bool IsFavorite { get; set; }
    }

    public class CatchPokemonDto
    {
        /// <summary>
        /// The PokeAPI ID of the Pokemon to catch (e.g., 1 for Bulbasaur, 25 for Pikachu)
        /// </summary>
        public int PokemonId { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateCaughtPokemonDto
    {
        public string? Notes { get; set; }
        public bool? IsFavorite { get; set; }
    }

    public class CaughtPokemonListDto
    {
        public List<CaughtPokemonDto> CaughtPokemon { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageIndex { get; set; }
        public int PageSize { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    public class BulkCatchPokemonDto
    {
        public required List<CatchPokemonDto> PokemonToCatch { get; set; }
    }

    public class BulkReleasePokemonDto
    {
        /// <summary>
        /// List of caught Pokemon record IDs to release (internal database IDs from CaughtPokemon.Id)
        /// </summary>
        public required List<int> CaughtPokemonIds { get; set; }
    }

    public class BulkReleasePokemonByPokeApiIdDto
    {
        /// <summary>
        /// List of PokeAPI IDs to release (e.g., 25 for Pikachu, 1 for Bulbasaur)
        /// </summary>
        public required List<int> PokeApiIds { get; set; }
    }

    public class BulkOperationResultDto
    {
        public int SuccessfulOperations { get; set; }
        public int FailedOperations { get; set; }
        public List<string> Errors { get; set; } = new();
        public List<CaughtPokemonDto>? CaughtPokemon { get; set; } // For bulk catch operations
    }
}
