using Core.Interfaces;

namespace Infrastructure.Services
{
    public class PokeApiRateLimiter : IPokeApiRateLimiter
    {
        private static readonly SemaphoreSlim _semaphore = new(1, 1);
        private static DateTime _lastRequestTime = DateTime.MinValue;
        private static readonly TimeSpan _minimumDelay = TimeSpan.FromMilliseconds(100);
        private readonly ILogger _logger;

        public PokeApiRateLimiter(ILogger logger)
        {
            _logger = logger;
        }

        public async Task DelayIfNeededAsync()
        {
            await _semaphore.WaitAsync();
            try
            {
                // Only enforce delay if this isn't the first request
                if (_lastRequestTime != DateTime.MinValue)
                {
                    var timeSinceLastRequest = DateTime.UtcNow - _lastRequestTime;
                    if (timeSinceLastRequest < _minimumDelay)
                    {
                        var delayTime = _minimumDelay - timeSinceLastRequest;
                        _logger.LogDebug($"Rate limiting: delaying {delayTime.TotalMilliseconds}ms");
                        await Task.Delay(delayTime);
                    }
                }
                _lastRequestTime = DateTime.UtcNow;
            }
            finally
            {
                _semaphore.Release();
            }
        }

        // Method for testing purposes to reset the static state
        public static void ResetForTesting()
        {
            _lastRequestTime = DateTime.MinValue;
        }
    }
}
