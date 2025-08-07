using Core.Entities;

namespace Core.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetUserByIdAsync(int id);
        Task<User?> GetUserByUsernameAsync(string username);
        Task<User?> GetUserByEmailAsync(string email);
        Task<IReadOnlyList<User>> GetPagedListOfUsersAsync(int pageIndex, int pageSize);
        Task<User?> AddUserAsync(User newUser);
        Task<User?> UpdateUserAsync(User user);
        Task<bool> DeleteUserAsync(User user);
    }
}
