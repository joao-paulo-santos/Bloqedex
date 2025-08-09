using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly BloqedexDbContext _context;

        public UserRepository(BloqedexDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetUserByIdAsync(int id)
        {
            return await _context.Users
                .Include(u => u.CaughtPokemons)
                    .ThenInclude(cp => cp.Pokemon)
                .FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username);
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<IReadOnlyList<User>> GetPagedListOfUsersAsync(int pageIndex, int pageSize)
        {
            return await _context.Users
                .Skip(pageIndex * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public Task<User?> AddUserAsync(User newUser)
        {
            _context.Users.Add(newUser);
            return Task.FromResult<User?>(newUser);
        }

        public Task<User?> UpdateUserAsync(User user)
        {
            _context.Users.Update(user);
            return Task.FromResult<User?>(user);
        }

        public Task<bool> DeleteUserAsync(User user)
        {
            _context.Users.Remove(user);
            return Task.FromResult(true);
        }
    }
}
