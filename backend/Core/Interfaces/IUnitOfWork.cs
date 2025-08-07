namespace Core.Interfaces
{
    public interface IUnitOfWork
    {
        IUserRepository UserRepository { get; }
        IPokemonRepository PokemonRepository { get; }
        ICaughtPokemonRepository CaughtPokemonRepository { get; }
        Task<int> SaveChangesAsync();
        Task DisposeAsync();
    }
}
