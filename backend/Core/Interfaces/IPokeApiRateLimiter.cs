namespace Core.Interfaces
{
    public interface IPokeApiRateLimiter
    {
        Task DelayIfNeededAsync();
    }
}
