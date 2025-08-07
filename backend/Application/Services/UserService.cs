using Core.Entities;
using Core.Interfaces;
using BCrypt.Net;

namespace Application.Services
{
    public class UserService : IUserService
    {
        private const int MaxPageSize = 50;
        private const int DefaultPageSize = 10;
        private readonly IUnitOfWork _unitOfWork;

        public UserService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<User?> GetUserByIdAsync(int id)
        {
            return await _unitOfWork.UserRepository.GetUserByIdAsync(id);
        }

        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            return await _unitOfWork.UserRepository.GetUserByUsernameAsync(username);
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _unitOfWork.UserRepository.GetUserByEmailAsync(email);
        }

        public async Task<IReadOnlyList<User>> GetPagedListOfUsersAsync(int pageIndex, int pageSize)
        {
            pageSize = Math.Min(pageSize <= 0 ? DefaultPageSize : pageSize, MaxPageSize);
            return await _unitOfWork.UserRepository.GetPagedListOfUsersAsync(pageIndex, pageSize);
        }

        public async Task<User?> RegisterUserAsync(string username, string email, string password)
        {
            // Check if user already exists
            var existingUserByUsername = await _unitOfWork.UserRepository.GetUserByUsernameAsync(username);
            if (existingUserByUsername != null)
                return null;

            var existingUserByEmail = await _unitOfWork.UserRepository.GetUserByEmailAsync(email);
            if (existingUserByEmail != null)
                return null;

            var user = new User
            {
                Username = username,
                Email = email,
                PasswordHash = HashPassword(password),
                Role = Role.User,
                CreatedDate = DateTime.UtcNow
            };

            var result = await _unitOfWork.UserRepository.AddUserAsync(user);
            if (result != null)
            {
                await _unitOfWork.SaveChangesAsync();
            }
            return result;
        }

        public async Task<User?> AuthenticateUserAsync(string usernameOrEmail, string password)
        {
            User? user = null;

            // Try to find by username first
            if (usernameOrEmail.Contains('@'))
            {
                user = await _unitOfWork.UserRepository.GetUserByEmailAsync(usernameOrEmail);
            }
            else
            {
                user = await _unitOfWork.UserRepository.GetUserByUsernameAsync(usernameOrEmail);
            }

            if (user == null || !VerifyPassword(password, user.PasswordHash))
                return null;

            return user;
        }

        public async Task<User?> UpdateUserAsync(User user)
        {
            var result = await _unitOfWork.UserRepository.UpdateUserAsync(user);
            if (result != null)
            {
                await _unitOfWork.SaveChangesAsync();
            }
            return result;
        }

        public async Task<bool> DeleteUserAsync(User user)
        {
            var result = await _unitOfWork.UserRepository.DeleteUserAsync(user);
            if (result)
            {
                await _unitOfWork.SaveChangesAsync();
            }
            return result;
        }

        public async Task<bool> ChangePasswordAsync(int userId, string currentPassword, string newPassword)
        {
            var user = await _unitOfWork.UserRepository.GetUserByIdAsync(userId);
            if (user == null || !VerifyPassword(currentPassword, user.PasswordHash))
                return false;

            user.PasswordHash = HashPassword(newPassword);
            var result = await _unitOfWork.UserRepository.UpdateUserAsync(user);
            if (result != null)
            {
                await _unitOfWork.SaveChangesAsync();
                return true;
            }
            return false;
        }

        public bool VerifyPassword(string password, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }

        public string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }
    }
}
