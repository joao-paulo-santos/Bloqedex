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

        [Fact]
        public void HashPassword_EmptyPassword_ReturnsValidHash()
        {
            var emptyPassword = "";

            var result = _userService.HashPassword(emptyPassword);

            Assert.NotNull(result);
            Assert.NotEmpty(result);
        }

        [Fact]
        public void HashPassword_LongPassword_HandlesCorrectly()
        {
            var longPassword = new string('x', 1000); // 1000 character password

            var result = _userService.HashPassword(longPassword);

            Assert.NotNull(result);
            Assert.True(_userService.VerifyPassword(longPassword, result));
        }

        [Fact]
        public void HashPassword_SpecialCharacters_HandlesCorrectly()
        {
            var specialPassword = "p@ssw0rd!#$%^&*()";

            var hash = _userService.HashPassword(specialPassword);
            var result = _userService.VerifyPassword(specialPassword, hash);

            Assert.True(result);
        }

        [Fact]
        public void HashPassword_SamePasswordTwice_ProducesDifferentHashes()
        {
            var password = "testpassword";

            var hash1 = _userService.HashPassword(password);
            var hash2 = _userService.HashPassword(password);

            Assert.NotEqual(hash1, hash2); // Should be different due to salt
            Assert.True(_userService.VerifyPassword(password, hash1));
            Assert.True(_userService.VerifyPassword(password, hash2));
        }

        [Fact]
        public async Task RegisterUserAsync_DuplicateUsername_ReturnsNull()
        {
            // Arrange
            var existingUser = new User
            {
                Id = 1,
                Username = "existinguser",
                Email = "existing@example.com",
                PasswordHash = "hash",
                CaughtCount = 0
            };

            _mockUserRepository.Setup(r => r.GetUserByUsernameAsync("existinguser"))
                .ReturnsAsync(existingUser);

            // Act
            var result = await _userService.RegisterUserAsync("existinguser", "new@example.com", "password");

            // Assert
            Assert.Null(result);
            _mockUserRepository.Verify(r => r.AddUserAsync(It.IsAny<User>()), Times.Never);
        }

        [Fact]
        public async Task RegisterUserAsync_DuplicateEmail_ReturnsNull()
        {
            // Arrange
            var existingUser = new User
            {
                Id = 1,
                Username = "existinguser",
                Email = "existing@example.com",
                PasswordHash = "hash",
                CaughtCount = 0
            };

            _mockUserRepository.Setup(r => r.GetUserByUsernameAsync("newuser"))
                .ReturnsAsync((User?)null);
            _mockUserRepository.Setup(r => r.GetUserByEmailAsync("existing@example.com"))
                .ReturnsAsync(existingUser);

            // Act
            var result = await _userService.RegisterUserAsync("newuser", "existing@example.com", "password");

            // Assert
            Assert.Null(result);
            _mockUserRepository.Verify(r => r.AddUserAsync(It.IsAny<User>()), Times.Never);
        }
    }
}
