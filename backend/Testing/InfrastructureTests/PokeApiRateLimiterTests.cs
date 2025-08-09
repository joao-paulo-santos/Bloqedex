using Core.Interfaces;
using Infrastructure.Services;
using Moq;
using System.Diagnostics;
using Xunit;

[assembly: Xunit.CollectionBehavior(DisableTestParallelization = true)]

namespace Testing.InfrastructureTests
{
    public class PokeApiRateLimiterTests : IDisposable
    {
        private readonly Mock<ILogger> _mockLogger;
        private readonly PokeApiRateLimiter _rateLimiter;

        public PokeApiRateLimiterTests()
        {
            _mockLogger = new Mock<ILogger>();

            PokeApiRateLimiter.ResetForTesting();

            _rateLimiter = new PokeApiRateLimiter(_mockLogger.Object);
        }

        public void Dispose()
        {
            PokeApiRateLimiter.ResetForTesting();
        }

        [Fact]
        public async Task DelayIfNeededAsync_FirstCall_DoesNotDelay()
        {
            var stopwatch = Stopwatch.StartNew();
            await _rateLimiter.DelayIfNeededAsync();
            stopwatch.Stop();

            Assert.True(stopwatch.ElapsedMilliseconds < 50,
                "First call should not have significant delay");
        }

        [Fact]
        public async Task DelayIfNeededAsync_ConsecutiveCalls_EnforcesMinimumDelay()
        {
            var stopwatch = Stopwatch.StartNew();
            await _rateLimiter.DelayIfNeededAsync(); // First call
            var firstCallTime = stopwatch.ElapsedMilliseconds;

            await _rateLimiter.DelayIfNeededAsync(); // Second call should be delayed
            var secondCallTime = stopwatch.ElapsedMilliseconds;

            var delayTime = secondCallTime - firstCallTime;
            Assert.True(delayTime >= 90 && delayTime <= 150,
                $"Second call should be delayed by ~100ms, but was {delayTime}ms");
        }

        [Fact]
        public async Task DelayIfNeededAsync_MultipleConcurrentCalls_AreSerializedWithProperDelay()
        {
            var numberOfCalls = 5;
            var callTimes = new List<DateTime>();
            var lockObject = new object();

            var tasks = Enumerable.Range(0, numberOfCalls).Select(i =>
                Task.Run(async () =>
                {
                    await _rateLimiter.DelayIfNeededAsync();
                    lock (lockObject)
                    {
                        callTimes.Add(DateTime.UtcNow);
                    }
                })
            ).ToList();

            await Task.WhenAll(tasks);

            Assert.Equal(5, callTimes.Count);

            callTimes.Sort();
            for (int i = 1; i < callTimes.Count; i++)
            {
                var timeBetweenCalls = (callTimes[i] - callTimes[i - 1]).TotalMilliseconds;
                Assert.True(timeBetweenCalls >= 90,
                    $"Calls {i - 1} and {i} should be at least 100ms apart, but were {timeBetweenCalls}ms apart");
            }
        }

        [Fact]
        public async Task DelayIfNeededAsync_AfterSufficientWait_DoesNotDelay()
        {
            await _rateLimiter.DelayIfNeededAsync();
            await Task.Delay(150); // Wait longer than minimum delay

            var stopwatch = Stopwatch.StartNew();
            await _rateLimiter.DelayIfNeededAsync();
            stopwatch.Stop();

            Assert.True(stopwatch.ElapsedMilliseconds < 50,
                "Call after sufficient wait should not have additional delay");
        }
    }
}
