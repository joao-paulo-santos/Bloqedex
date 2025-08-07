using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Core.Entities
{
    [Table("pokemon_types")]
    public class PokemonType
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("pokemon_id")]
        public int PokemonId { get; set; }

        [Column("type_name")]
        [Required]
        [MaxLength(50)]
        public required string TypeName { get; set; }

        [Column("slot")]
        public int Slot { get; set; }

        [ForeignKey("PokemonId")]
        public virtual Pokemon Pokemon { get; set; } = null!;
    }
}
