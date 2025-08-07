using Core.Entities;

namespace Core.Interfaces
{
    public interface IUserService
    {
        Task<User?> GetUserByIdAsync(int id);
        Task<User?> GetUserByUsernameAsync(string username);
        Task<User?> GetUserByEmailAsync(string email);
        Task<IReadOnlyList<User>> GetPagedListOfUsersAsync(int pageIndex, int pageSize);
        Task<User?> RegisterUserAsync(string username, string email, string password);
        Task<User?> AuthenticateUserAsync(string usernameOrEmail, string password);
        Task<User?> UpdateUserAsync(User user);
        Task<bool> DeleteUserAsync(User user);
        Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
        bool VerifyPassword(string password, string hash);
        string HashPassword(string password);
    }
}
