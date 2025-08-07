using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Core.Entities
{
    [Table("users")]
    public class User : BaseEntity
    {
        [Key]
        [Column("id")]
        public new int Id { get; set; }

        [Column("username")]
        [Required]
        [MaxLength(50)]
        public required string Username { get; set; }

        [Column("email")]
        [Required]
        [MaxLength(100)]
        public required string Email { get; set; }

        [Column("password_hash")]
        [Required]
        public required string PasswordHash { get; set; }

        [Column("user_role")]
        public Role Role { get; set; } = Role.User;

        [Column("caught_count")]
        public int CaughtCount { get; set; } = 0;

        public virtual ICollection<CaughtPokemon> CaughtPokemons { get; set; } = new List<CaughtPokemon>();
    }
}
