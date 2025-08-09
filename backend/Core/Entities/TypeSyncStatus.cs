namespace Core.Entities
{
    public class TypeSyncStatus : BaseEntity
    {
        public string TypeName { get; set; } = string.Empty;
        public DateTime LastSyncDate { get; set; }
        public bool IsComplete { get; set; }
    }
}
