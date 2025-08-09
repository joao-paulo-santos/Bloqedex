using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class TypeSyncStatusRepository : ITypeSyncStatusRepository
    {
        private readonly BloqedexDbContext _context;

        public TypeSyncStatusRepository(BloqedexDbContext context)
        {
            _context = context;
        }

        public async Task<TypeSyncStatus?> GetTypeSyncStatusAsync(string typeName)
        {
            return await _context.TypeSyncStatuses
                .FirstOrDefaultAsync(t => t.TypeName == typeName);
        }

        public async Task<TypeSyncStatus> AddOrUpdateTypeSyncStatusAsync(TypeSyncStatus typeSyncStatus)
        {
            var existing = await GetTypeSyncStatusAsync(typeSyncStatus.TypeName);
            if (existing != null)
            {
                existing.LastSyncDate = typeSyncStatus.LastSyncDate;
                existing.IsComplete = typeSyncStatus.IsComplete;
                return existing;
            }
            else
            {
                typeSyncStatus.CreatedDate = DateTime.UtcNow;
                _context.TypeSyncStatuses.Add(typeSyncStatus);
                return typeSyncStatus;
            }
        }

        public async Task<bool> IsTypeCompleteAsync(string typeName)
        {
            var status = await GetTypeSyncStatusAsync(typeName);
            return status?.IsComplete ?? false;
        }

        public async Task MarkTypeAsCompleteAsync(string typeName)
        {
            var status = await GetTypeSyncStatusAsync(typeName) ?? new TypeSyncStatus { TypeName = typeName };
            status.IsComplete = true;
            status.LastSyncDate = DateTime.UtcNow;
            await AddOrUpdateTypeSyncStatusAsync(status);
        }

        public async Task MarkTypeAsIncompleteAsync(string typeName)
        {
            var status = await GetTypeSyncStatusAsync(typeName) ?? new TypeSyncStatus { TypeName = typeName };
            status.IsComplete = false;
            status.LastSyncDate = DateTime.UtcNow;
            await AddOrUpdateTypeSyncStatusAsync(status);
        }
    }
}
