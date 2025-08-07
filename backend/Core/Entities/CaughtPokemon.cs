using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Core.Entities
{
    [Table("caught_pokemon")]
    public class CaughtPokemon : BaseEntity
    {
        [Key]
        [Column("id")]
        public new int Id { get; set; }

        [Column("user_id")]
        public int UserId { get; set; }

        [Column("pokemon_id")]
        public int PokemonId { get; set; }

        [Column("caught_date")]
        public DateTime CaughtDate { get; set; }

        [Column("notes")]
        [MaxLength(500)]
        public string? Notes { get; set; }

        [Column("is_favorite")]
        public bool IsFavorite { get; set; } = false;

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        [ForeignKey("PokemonId")]
        public virtual Pokemon Pokemon { get; set; } = null!;
    }
}
