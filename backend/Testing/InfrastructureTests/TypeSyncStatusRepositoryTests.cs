using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Testing.ApplicationTests
{
    public class TypeSyncStatusRepositoryTests : IDisposable
    {
        private readonly BloqedexDbContext _context;
        private readonly ITypeSyncStatusRepository _repository;

        public TypeSyncStatusRepositoryTests()
        {
            var options = new DbContextOptionsBuilder<BloqedexDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new BloqedexDbContext(options);
            _repository = new TypeSyncStatusRepository(_context);
        }

        [Fact]
        // Test basic get and null scenarios for type sync status retrieval
        public async Task GetTypeSyncStatusAsync_ReturnsCorrectResults()
        {
            // Test with existing type
            var typeName = "fire";
            var status = new TypeSyncStatus
            {
                TypeName = typeName,
                IsComplete = true,
                LastSyncDate = DateTime.UtcNow,
                CreatedDate = DateTime.UtcNow
            };

            _context.TypeSyncStatuses.Add(status);
            await _context.SaveChangesAsync();

            var result = await _repository.GetTypeSyncStatusAsync(typeName);
            Assert.NotNull(result);
            Assert.Equal(typeName, result.TypeName);
            Assert.True(result.IsComplete);

            // Test with non-existing type
            var nullResult = await _repository.GetTypeSyncStatusAsync("nonexistent");
            Assert.Null(nullResult);
        }

        [Fact]
        // Test completion status checking for various scenarios
        public async Task IsTypeCompleteAsync_ReturnsCorrectCompletionStatus()
        {
            var completeType = new TypeSyncStatus { TypeName = "water", IsComplete = true, LastSyncDate = DateTime.UtcNow, CreatedDate = DateTime.UtcNow };
            var incompleteType = new TypeSyncStatus { TypeName = "grass", IsComplete = false, LastSyncDate = DateTime.UtcNow, CreatedDate = DateTime.UtcNow };

            _context.TypeSyncStatuses.AddRange(completeType, incompleteType);
            await _context.SaveChangesAsync();

            Assert.True(await _repository.IsTypeCompleteAsync("water"));

            Assert.False(await _repository.IsTypeCompleteAsync("grass"));

            Assert.False(await _repository.IsTypeCompleteAsync("nonexistent"));
        }

        [Fact]
        // Test marking types as complete for both new and existing types
        public async Task MarkTypeAsCompleteAsync_CreatesAndUpdatesStatusCorrectly()
        {
            var newTypeName = "electric";
            await _repository.MarkTypeAsCompleteAsync(newTypeName);
            await _context.SaveChangesAsync();

            var newStatus = await _repository.GetTypeSyncStatusAsync(newTypeName);
            Assert.NotNull(newStatus);
            Assert.Equal(newTypeName, newStatus.TypeName);
            Assert.True(newStatus.IsComplete);
            Assert.True((DateTime.UtcNow - newStatus.LastSyncDate).TotalMinutes < 1);

            var existingTypeName = "psychic";
            var originalDate = DateTime.UtcNow.AddDays(-1);
            var existingStatus = new TypeSyncStatus
            {
                TypeName = existingTypeName,
                IsComplete = false,
                LastSyncDate = originalDate,
                CreatedDate = originalDate
            };

            _context.TypeSyncStatuses.Add(existingStatus);
            await _context.SaveChangesAsync();

            await _repository.MarkTypeAsCompleteAsync(existingTypeName);
            await _context.SaveChangesAsync();

            var updatedStatus = await _repository.GetTypeSyncStatusAsync(existingTypeName);
            Assert.NotNull(updatedStatus);
            Assert.True(updatedStatus.IsComplete);
            Assert.True(updatedStatus.LastSyncDate > originalDate);
        }

        [Fact]
        // Test add/update functionality for type sync status
        public async Task AddOrUpdateTypeSyncStatusAsync_HandlesNewAndExistingTypes()
        {
            var newTypeName = "ghost";
            var newStatus = new TypeSyncStatus
            {
                TypeName = newTypeName,
                IsComplete = true,
                LastSyncDate = DateTime.UtcNow
            };

            var addResult = await _repository.AddOrUpdateTypeSyncStatusAsync(newStatus);
            await _context.SaveChangesAsync();

            Assert.NotNull(addResult);
            Assert.Equal(newTypeName, addResult.TypeName);

            var savedNew = await _repository.GetTypeSyncStatusAsync(newTypeName);
            Assert.NotNull(savedNew);
            Assert.True(savedNew.IsComplete);

            var existingTypeName = "steel";
            var originalStatus = new TypeSyncStatus
            {
                TypeName = existingTypeName,
                IsComplete = false,
                LastSyncDate = DateTime.UtcNow.AddDays(-1),
                CreatedDate = DateTime.UtcNow.AddDays(-1)
            };

            _context.TypeSyncStatuses.Add(originalStatus);
            await _context.SaveChangesAsync();

            var newSyncDate = DateTime.UtcNow;
            var updateStatus = new TypeSyncStatus
            {
                TypeName = existingTypeName,
                IsComplete = true,
                LastSyncDate = newSyncDate
            };

            await _repository.AddOrUpdateTypeSyncStatusAsync(updateStatus);
            await _context.SaveChangesAsync();

            var updated = await _repository.GetTypeSyncStatusAsync(existingTypeName);
            Assert.NotNull(updated);
            Assert.True(updated.IsComplete);
            Assert.Equal(newSyncDate.ToString("yyyy-MM-dd HH:mm"), updated.LastSyncDate.ToString("yyyy-MM-dd HH:mm"));
        }

        [Fact]
        // Test marking type as incomplete
        public async Task MarkTypeAsIncompleteAsync_CreatesIncompleteStatus()
        {
            var typeName = "dragon";

            await _repository.MarkTypeAsIncompleteAsync(typeName);
            await _context.SaveChangesAsync();

            var status = await _repository.GetTypeSyncStatusAsync(typeName);
            Assert.NotNull(status);
            Assert.Equal(typeName, status.TypeName);
            Assert.False(status.IsComplete);
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
