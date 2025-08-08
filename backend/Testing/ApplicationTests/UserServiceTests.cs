using Application.Services;
using Core.Entities;
using Core.Interfaces;
using Moq;
using Xunit;

namespace Testing.ApplicationTests
{
    public class UserServiceTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly UserService _userService;

        public UserServiceTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockUserRepository = new Mock<IUserRepository>();
            _mockUnitOfWork.Setup(uow => uow.UserRepository).Returns(_mockUserRepository.Object);
            _userService = new UserService(_mockUnitOfWork.Object);
        }

        [Fact]
        public async Task RegisterUserAsync_ValidUser_ReturnsCreatedUser()
        {
            var username = "testuser";
            var email = "test@example.com";
            var password = "password123";

            _mockUserRepository.Setup(r => r.GetUserByUsernameAsync(username))
                .ReturnsAsync((User?)null);
            _mockUserRepository.Setup(r => r.GetUserByEmailAsync(email))
                .ReturnsAsync((User?)null);
            _mockUserRepository.Setup(r => r.AddUserAsync(It.IsAny<User>()))
                .ReturnsAsync((User user) => user);
            _mockUnitOfWork.Setup(uow => uow.SaveChangesAsync())
                .ReturnsAsync(1);

            var result = await _userService.RegisterUserAsync(username, email, password);

            Assert.NotNull(result);
            Assert.Equal(username, result.Username);
            Assert.Equal(email, result.Email);
            Assert.True(_userService.VerifyPassword(password, result.PasswordHash));
        }

        [Fact]
        public async Task RegisterUserAsync_ExistingUsername_ReturnsNull()
        {
            var username = "existinguser";
            var email = "test@example.com";
            var password = "password123";
            var existingUser = new User
            {
                Username = username,
                Email = "existing@example.com",
                PasswordHash = "hash"
            };

            _mockUserRepository.Setup(r => r.GetUserByUsernameAsync(username))
                .ReturnsAsync(existingUser);

            var result = await _userService.RegisterUserAsync(username, email, password);

            Assert.Null(result);
        }

        [Fact]
        public async Task AuthenticateUserAsync_ValidCredentials_ReturnsUser()
        {
            var username = "testuser";
            var password = "password123";
            var hashedPassword = _userService.HashPassword(password);
            var user = new User
            {
                Username = username,
                Email = "test@example.com",
                PasswordHash = hashedPassword
            };

            _mockUserRepository.Setup(r => r.GetUserByUsernameAsync(username))
                .ReturnsAsync(user);

            var result = await _userService.AuthenticateUserAsync(username, password);

            Assert.NotNull(result);
            Assert.Equal(username, result.Username);
        }

        [Fact]
        public async Task AuthenticateUserAsync_InvalidPassword_ReturnsNull()
        {
            var username = "testuser";
            var password = "wrongpassword";
            var correctPassword = "correctpassword";
            var hashedPassword = _userService.HashPassword(correctPassword);
            var user = new User
            {
                Username = username,
                Email = "test@example.com",
                PasswordHash = hashedPassword
            };

            _mockUserRepository.Setup(r => r.GetUserByUsernameAsync(username))
                .ReturnsAsync(user);

            var result = await _userService.AuthenticateUserAsync(username, password);

            Assert.Null(result);
        }

        [Fact]
        public void VerifyPassword_CorrectPassword_ReturnsTrue()
        {
            var password = "testpassword";
            var hash = _userService.HashPassword(password);

            var result = _userService.VerifyPassword(password, hash);

            Assert.True(result);
        }

        [Fact]
        public void VerifyPassword_IncorrectPassword_ReturnsFalse()
        {
            var password = "testpassword";
            var wrongPassword = "wrongpassword";
            var hash = _userService.HashPassword(password);

            var result = _userService.VerifyPassword(wrongPassword, hash);

            Assert.False(result);
        }
    }
}
