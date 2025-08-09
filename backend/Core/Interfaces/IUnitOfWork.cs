namespace Core.Interfaces
{
    public interface IUnitOfWork
    {
        IUserRepository UserRepository { get; }
        IPokemonRepository PokemonRepository { get; }
        ICaughtPokemonRepository CaughtPokemonRepository { get; }
        ITypeSyncStatusRepository TypeSyncStatusRepository { get; }
        ISharedPokemonRepository SharedPokemonRepository { get; }
        Task<int> SaveChangesAsync();
        Task DisposeAsync();
    }
}
