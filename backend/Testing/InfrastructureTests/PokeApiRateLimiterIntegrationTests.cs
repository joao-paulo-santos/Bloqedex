using Core.Interfaces;
using Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Diagnostics;
using Xunit;

namespace Testing.InfrastructureTests
{
    /// <summary>
    /// Integration tests that verify the rate limiter works correctly 
    /// when resolved through the dependency injection container,
    /// simulating real-world usage with multiple users/requests.
    /// </summary>
    public class PokeApiRateLimiterIntegrationTests : IDisposable
    {
        private readonly ServiceProvider _serviceProvider;

        public PokeApiRateLimiterIntegrationTests()
        {
            // Reset static state before each test
            PokeApiRateLimiter.ResetForTesting();

            // Set up DI container similar to how it's configured in Program.cs
            var services = new ServiceCollection();
            services.AddSingleton<Mock<ILogger>>(provider => new Mock<ILogger>());
            services.AddSingleton<ILogger>(provider => provider.GetRequiredService<Mock<ILogger>>().Object);
            services.AddSingleton<IPokeApiRateLimiter, PokeApiRateLimiter>();

            _serviceProvider = services.BuildServiceProvider();
        }

        public void Dispose()
        {
            PokeApiRateLimiter.ResetForTesting();
            _serviceProvider?.Dispose();
        }

        [Fact]
        public async Task MultipleUsers_ConcurrentRequests_ShareSameSingletonRateLimiter()
        {
            var numberOfUsers = 3;
            var callTimes = new List<(int userId, DateTime timestamp)>();
            var lockObject = new object();

            var userTasks = Enumerable.Range(1, numberOfUsers).Select(userId =>
                Task.Run(async () =>
                {
                    using var scope = _serviceProvider.CreateScope();
                    var rateLimiter = scope.ServiceProvider.GetRequiredService<IPokeApiRateLimiter>();

                    await rateLimiter.DelayIfNeededAsync();

                    lock (lockObject)
                    {
                        callTimes.Add((userId, DateTime.UtcNow));
                    }
                })
            ).ToList();

            await Task.WhenAll(userTasks);

            // Verify if all users shared the same rate limiting
            Assert.Equal(numberOfUsers, callTimes.Count);

            // Sort by timestamp and verify they're properly spaced
            var sortedCalls = callTimes.OrderBy(ct => ct.timestamp).ToList();

            for (int i = 1; i < sortedCalls.Count; i++)
            {
                var timeBetweenCalls = (sortedCalls[i].timestamp - sortedCalls[i - 1].timestamp).TotalMilliseconds;
                Assert.True(timeBetweenCalls >= 90,
                    $"Calls from different users should be rate limited globally. " +
                    $"User {sortedCalls[i - 1].userId} and User {sortedCalls[i].userId} " +
                    $"were only {timeBetweenCalls}ms apart");
            }
        }

        [Fact]
        public void SingletonBehavior_DifferentScopes_ReturnSameInstance()
        {
            IPokeApiRateLimiter rateLimiter1;
            IPokeApiRateLimiter rateLimiter2;

            using (var scope1 = _serviceProvider.CreateScope())
            {
                rateLimiter1 = scope1.ServiceProvider.GetRequiredService<IPokeApiRateLimiter>();
            }

            using (var scope2 = _serviceProvider.CreateScope())
            {
                rateLimiter2 = scope2.ServiceProvider.GetRequiredService<IPokeApiRateLimiter>();
            }

            Assert.Same(rateLimiter1, rateLimiter2);
        }

        [Fact]
        public async Task SequentialUsers_RateLimitingPersistsAcrossScopes()
        {
            var callTimes = new List<DateTime>();

            for (int userId = 1; userId <= 3; userId++)
            {
                using var scope = _serviceProvider.CreateScope();
                var rateLimiter = scope.ServiceProvider.GetRequiredService<IPokeApiRateLimiter>();

                var startTime = DateTime.UtcNow;
                await rateLimiter.DelayIfNeededAsync();
                callTimes.Add(DateTime.UtcNow);
            }

            for (int i = 1; i < callTimes.Count; i++)
            {
                var timeBetweenCalls = (callTimes[i] - callTimes[i - 1]).TotalMilliseconds;
                Assert.True(timeBetweenCalls >= 90,
                    $"Sequential users should be rate limited. " +
                    $"Call {i - 1} and call {i} were only {timeBetweenCalls}ms apart");
            }
        }

        [Fact]
        public async Task HighConcurrency_SimulatingRealWorldLoad()
        {
            var numberOfConcurrentUsers = 10;
            var completedCalls = new List<(int userId, DateTime start, DateTime end, long delayMs)>();
            var lockObject = new object();

            var userTasks = Enumerable.Range(1, numberOfConcurrentUsers).Select(userId =>
                Task.Run(async () =>
                {
                    using var scope = _serviceProvider.CreateScope();
                    var rateLimiter = scope.ServiceProvider.GetRequiredService<IPokeApiRateLimiter>();

                    var start = DateTime.UtcNow;
                    var stopwatch = Stopwatch.StartNew();

                    await rateLimiter.DelayIfNeededAsync();

                    stopwatch.Stop();
                    var end = DateTime.UtcNow;

                    lock (lockObject)
                    {
                        completedCalls.Add((userId, start, end, stopwatch.ElapsedMilliseconds));
                    }
                })
            ).ToList();

            await Task.WhenAll(userTasks);

            Assert.Equal(numberOfConcurrentUsers, completedCalls.Count);

            var sortedByCompletion = completedCalls.OrderBy(c => c.end).ToList();
            var totalExecutionTime = (sortedByCompletion.Last().end - sortedByCompletion.First().start).TotalMilliseconds;

            Assert.True(totalExecutionTime >= 800,
                $"Total execution time should reflect serial processing. Got {totalExecutionTime}ms");

            var callsWithSignificantDelay = completedCalls.Count(c => c.delayMs >= 90);
            Assert.True(callsWithSignificantDelay >= numberOfConcurrentUsers - 2,
                $"Most calls should experience delays due to rate limiting. " +
                $"Only {callsWithSignificantDelay} out of {numberOfConcurrentUsers} had significant delays");
        }
    }
}
