using Newtonsoft.Json;

namespace Core.External.PokeApi
{
    public class PokeApiResourceList
    {
        public int Count { get; set; }
        public string? Next { get; set; }
        public string? Previous { get; set; }
        public List<PokeApiResource> Results { get; set; } = new();
    }

    public class PokeApiResource
    {
        public string Name { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
    }

    public class PokeApiPokemonResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Height { get; set; }
        public int Weight { get; set; }
        public List<PokeApiStat> Stats { get; set; } = new();
        public List<PokeApiType> Types { get; set; } = new();
        public PokeApiSprites Sprites { get; set; } = new();
    }

    public class PokeApiStat
    {
        public int BaseStat { get; set; }
        public PokeApiStatInfo Stat { get; set; } = new();
    }

    public class PokeApiStatInfo
    {
        public string Name { get; set; } = string.Empty;
    }

    public class PokeApiType
    {
        public int Slot { get; set; }
        public PokeApiTypeInfo Type { get; set; } = new();
    }

    public class PokeApiTypeInfo
    {
        public string Name { get; set; } = string.Empty;
    }

    public class PokeApiSprites
    {
        [JsonProperty("front_default")]
        public string? FrontDefault { get; set; }
        public PokeApiOther? Other { get; set; }
    }

    public class PokeApiOther
    {
        [JsonProperty("official-artwork")]
        public PokeApiOfficialArtwork? OfficialArtwork { get; set; }
    }

    public class PokeApiOfficialArtwork
    {
        [JsonProperty("front_default")]
        public string? FrontDefault { get; set; }
    }

    public class PokeApiTypeResponse
    {
        public List<PokeApiTypePokemon> Pokemon { get; set; } = new();
    }

    public class PokeApiTypePokemon
    {
        public PokeApiResource Pokemon { get; set; } = new();
    }
}
