using Core.Entities;

namespace Core.Interfaces
{
    public interface ITypeSyncStatusRepository
    {
        Task<TypeSyncStatus?> GetTypeSyncStatusAsync(string typeName);
        Task<TypeSyncStatus> AddOrUpdateTypeSyncStatusAsync(TypeSyncStatus typeSyncStatus);
        Task<bool> IsTypeCompleteAsync(string typeName);
        Task MarkTypeAsCompleteAsync(string typeName);
        Task MarkTypeAsIncompleteAsync(string typeName);
    }
}
