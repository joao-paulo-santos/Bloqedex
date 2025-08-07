using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Core.Entities
{
    public abstract class BaseEntity
    {
        [Column("id")]
        public int Id { get; set; }

        [Column("created_date")]
        public DateTime CreatedDate { get; set; }
    }
}
