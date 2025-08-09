using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Core.Entities
{
    [Table("shared_pokemon")]
    public class SharedPokemon : BaseEntity
    {
        [Column("user_id")]
        public required int UserId { get; set; }

        [Column("caught_pokemon_id")]
        public int? CaughtPokemonId { get; set; }

        [Column("share_token")]
        [MaxLength(64)]
        public required string ShareToken { get; set; }

        [Column("share_type")]
        public ShareType ShareType { get; set; }

        [Column("title")]
        [MaxLength(100)]
        public string? Title { get; set; }

        [Column("description")]
        [MaxLength(500)]
        public string? Description { get; set; }

        [Column("is_active")]
        public bool IsActive { get; set; } = true;

        [Column("expires_at")]
        public DateTime? ExpiresAt { get; set; }

        [Column("view_count")]
        public int ViewCount { get; set; } = 0;

        [Column("max_views")]
        public int? MaxViews { get; set; }

        public virtual User User { get; set; } = null!;
        public virtual CaughtPokemon? CaughtPokemon { get; set; }
    }

    public enum ShareType
    {
        SinglePokemon = 1,
        Collection = 2
    }
}
