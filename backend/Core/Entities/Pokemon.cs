using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Core.External.PokeApi;

namespace Core.Entities
{
    [Table("pokemon")]
    public class Pokemon : BaseEntity
    {
        [Key]
        [Column("id")]
        public new int Id { get; set; }

        [Column("pokeapi_id")]
        [Required]
        public int PokeApiId { get; set; }

        [Column("name")]
        [Required]
        [MaxLength(100)]
        public required string Name { get; set; }

        [Column("height")]
        public int Height { get; set; }

        [Column("weight")]
        public int Weight { get; set; }

        [Column("hp")]
        public int HP { get; set; }

        [Column("attack")]
        public int Attack { get; set; }

        [Column("defense")]
        public int Defense { get; set; }

        [Column("special_attack")]
        public int SpecialAttack { get; set; }

        [Column("special_defense")]
        public int SpecialDefense { get; set; }

        [Column("speed")]
        public int Speed { get; set; }

        [Column("sprite_url")]
        public string? SpriteUrl { get; set; }

        [Column("official_artwork_url")]
        public string? OfficialArtworkUrl { get; set; }

        [Column("modified_date")]
        public DateTime ModifiedDate { get; set; }

        public virtual ICollection<PokemonType> PokemonTypes { get; set; } = new List<PokemonType>();
        public virtual ICollection<CaughtPokemon> CaughtByUsers { get; set; } = new List<CaughtPokemon>();

        public static Pokemon FromPokeApiResponse(PokeApiPokemonResponse pokeApiPokemon)
        {
            if (pokeApiPokemon == null)
                throw new ArgumentNullException(nameof(pokeApiPokemon));

            var pokemon = new Pokemon
            {
                PokeApiId = pokeApiPokemon.Id,
                Name = pokeApiPokemon.Name,
                Height = pokeApiPokemon.Height,
                Weight = pokeApiPokemon.Weight,
                HP = pokeApiPokemon.Stats.FirstOrDefault(s => s.Stat.Name == "hp")?.BaseStat ?? 0,
                Attack = pokeApiPokemon.Stats.FirstOrDefault(s => s.Stat.Name == "attack")?.BaseStat ?? 0,
                Defense = pokeApiPokemon.Stats.FirstOrDefault(s => s.Stat.Name == "defense")?.BaseStat ?? 0,
                SpecialAttack = pokeApiPokemon.Stats.FirstOrDefault(s => s.Stat.Name == "special-attack")?.BaseStat ?? 0,
                SpecialDefense = pokeApiPokemon.Stats.FirstOrDefault(s => s.Stat.Name == "special-defense")?.BaseStat ?? 0,
                Speed = pokeApiPokemon.Stats.FirstOrDefault(s => s.Stat.Name == "speed")?.BaseStat ?? 0,
                SpriteUrl = pokeApiPokemon.Sprites.FrontDefault,
                OfficialArtworkUrl = pokeApiPokemon.Sprites.Other?.OfficialArtwork?.FrontDefault,
                CreatedDate = DateTime.UtcNow,
                ModifiedDate = DateTime.UtcNow
            };

            foreach (var typeInfo in pokeApiPokemon.Types)
            {
                pokemon.PokemonTypes.Add(new PokemonType
                {
                    TypeName = typeInfo.Type.Name,
                    Slot = typeInfo.Slot
                });
            }

            return pokemon;
        }
    }
}
