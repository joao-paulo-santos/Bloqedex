using Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data
{
    public class BloqedexDbContext : DbContext
    {
        public BloqedexDbContext(DbContextOptions<BloqedexDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Pokemon> Pokemon { get; set; }
        public DbSet<PokemonType> PokemonTypes { get; set; }
        public DbSet<CaughtPokemon> CaughtPokemon { get; set; }
        public DbSet<TypeSyncStatus> TypeSyncStatuses { get; set; }
        public DbSet<SharedPokemon> SharedPokemon { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.Role).HasConversion<int>();
            });

            modelBuilder.Entity<Pokemon>(entity =>
            {
                entity.HasIndex(e => e.PokeApiId).IsUnique();
                entity.HasIndex(e => e.Name);

                entity.HasMany(e => e.PokemonTypes)
                    .WithOne(e => e.Pokemon)
                    .HasForeignKey(e => e.PokemonId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<PokemonType>(entity =>
            {
                entity.HasIndex(e => e.TypeName);
            });

            modelBuilder.Entity<CaughtPokemon>(entity =>
            {
                entity.HasIndex(e => new { e.UserId, e.PokemonId }).IsUnique();

                entity.HasOne(e => e.User)
                    .WithMany(e => e.CaughtPokemons)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Pokemon)
                    .WithMany(e => e.CaughtByUsers)
                    .HasForeignKey(e => e.PokemonId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<TypeSyncStatus>(entity =>
            {
                entity.HasIndex(e => e.TypeName).IsUnique();
            });

            modelBuilder.Entity<SharedPokemon>(entity =>
            {
                entity.HasIndex(e => e.ShareToken).IsUnique();
                entity.Property(e => e.ShareType).HasConversion<int>();

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.CaughtPokemon)
                    .WithMany()
                    .HasForeignKey(e => e.CaughtPokemonId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
