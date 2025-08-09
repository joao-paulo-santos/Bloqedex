using BloqedexApi.Controllers;
using BloqedexApi.DTOs;
using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using Xunit;

namespace Testing.ControllerTests
{
    public class AuthControllerTests
    {
        private readonly Mock<IUserService> _mockUserService;
        private readonly Mock<ITokenService> _mockTokenService;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            _mockUserService = new Mock<IUserService>();
            _mockTokenService = new Mock<ITokenService>();
            _controller = new AuthController(_mockUserService.Object, _mockTokenService.Object);
        }

        // Tests user registration with valid data returns success response with JWT token
        [Fact]
        public async Task Register_ValidUser_ReturnsOkWithToken()
        {
            var registerDto = new RegisterDto
            {
                Username = "testuser",
                Email = "test@example.com",
                Password = "password123"
            };

            var user = new User
            {
                Id = 1,
                Username = "testuser",
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                Role = Role.User,
                CreatedDate = DateTime.UtcNow
            };

            var token = "test-jwt-token";

            _mockUserService.Setup(s => s.RegisterUserAsync(registerDto.Username, registerDto.Email, registerDto.Password))
                .ReturnsAsync(user);
            _mockTokenService.Setup(s => s.GenerateJwtToken(user.Id, user.Username, user.Role.ToString()))
                .Returns(token);

            var result = await _controller.Register(registerDto);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var userTokenDto = Assert.IsType<UserTokenDto>(okResult.Value);
            Assert.Equal(token, userTokenDto.Token);
            Assert.Equal(user.Id, userTokenDto.User.Id);
            Assert.Equal(user.Username, userTokenDto.User.Username);
            Assert.Equal(user.Email, userTokenDto.User.Email);
        }

        // Tests user registration with existing username/email returns error response
        [Fact]
        public async Task Register_ExistingUser_ReturnsBadRequest()
        {
            var registerDto = new RegisterDto
            {
                Username = "existinguser",
                Email = "existing@example.com",
                Password = "password123"
            };

            _mockUserService.Setup(s => s.RegisterUserAsync(registerDto.Username, registerDto.Email, registerDto.Password))
                .ReturnsAsync((User?)null);

            var result = await _controller.Register(registerDto);

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
            Assert.Equal("Username or email already exists", badRequestResult.Value);
        }

        // Tests user login with correct credentials returns success response with JWT token
        [Fact]
        public async Task Login_ValidCredentials_ReturnsOkWithToken()
        {
            var loginDto = new LoginDto
            {
                UsernameOrEmail = "testuser",
                Password = "password123"
            };

            var user = new User
            {
                Id = 1,
                Username = "testuser",
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                Role = Role.User,
                CreatedDate = DateTime.UtcNow
            };

            var token = "test-jwt-token";

            _mockUserService.Setup(s => s.AuthenticateUserAsync(loginDto.UsernameOrEmail, loginDto.Password))
                .ReturnsAsync(user);
            _mockTokenService.Setup(s => s.GenerateJwtToken(user.Id, user.Username, user.Role.ToString()))
                .Returns(token);

            var result = await _controller.Login(loginDto);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var userTokenDto = Assert.IsType<UserTokenDto>(okResult.Value);
            Assert.Equal(token, userTokenDto.Token);
            Assert.Equal(user.Id, userTokenDto.User.Id);
        }

        // Tests user login with incorrect credentials returns unauthorized response
        [Fact]
        public async Task Login_InvalidCredentials_ReturnsUnauthorized()
        {
            var loginDto = new LoginDto
            {
                UsernameOrEmail = "invaliduser",
                Password = "wrongpassword"
            };

            _mockUserService.Setup(s => s.AuthenticateUserAsync(loginDto.UsernameOrEmail, loginDto.Password))
                .ReturnsAsync((User?)null);

            var result = await _controller.Login(loginDto);

            var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(result.Result);
            Assert.Equal("Invalid credentials", unauthorizedResult.Value);
        }

        // Tests retrieving current user profile with valid authentication token
        [Fact]
        public async Task GetCurrentUser_ValidToken_ReturnsUser()
        {
            var userId = 1;
            var user = new User
            {
                Id = userId,
                Username = "testuser",
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                Role = Role.User,
                CreatedDate = DateTime.UtcNow
            };

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            _mockUserService.Setup(s => s.GetUserByIdAsync(userId))
                .ReturnsAsync(user);

            var result = await _controller.GetCurrentUser();

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var userDto = Assert.IsType<UserDto>(okResult.Value);
            Assert.Equal(user.Id, userDto.Id);
            Assert.Equal(user.Username, userDto.Username);
        }

        // Tests retrieving current user profile without authentication returns unauthorized
        [Fact]
        public async Task GetCurrentUser_NoToken_ReturnsUnauthorized()
        {
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext()
            };

            var result = await _controller.GetCurrentUser();

            Assert.IsType<UnauthorizedResult>(result.Result);
        }

        // Tests retrieving current user when user no longer exists returns not found
        [Fact]
        public async Task GetCurrentUser_UserNotFound_ReturnsNotFound()
        {
            var userId = 1;
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            _mockUserService.Setup(s => s.GetUserByIdAsync(userId))
                .ReturnsAsync((User?)null);

            var result = await _controller.GetCurrentUser();

            Assert.IsType<NotFoundResult>(result.Result);
        }

        // Tests changing password with correct current password returns success
        [Fact]
        public async Task ChangePassword_ValidRequest_ReturnsOk()
        {
            var userId = 1;
            var changePasswordDto = new ChangePasswordDto
            {
                CurrentPassword = "oldpassword",
                NewPassword = "newpassword"
            };

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            _mockUserService.Setup(s => s.ChangePasswordAsync(userId, changePasswordDto.CurrentPassword, changePasswordDto.NewPassword))
                .ReturnsAsync(true);

            var result = await _controller.ChangePassword(changePasswordDto);

            Assert.IsType<OkResult>(result);
        }

        // Tests changing password with incorrect current password returns error
        [Fact]
        public async Task ChangePassword_WrongCurrentPassword_ReturnsBadRequest()
        {
            var userId = 1;
            var changePasswordDto = new ChangePasswordDto
            {
                CurrentPassword = "wrongpassword",
                NewPassword = "newpassword"
            };

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            _mockUserService.Setup(s => s.ChangePasswordAsync(userId, changePasswordDto.CurrentPassword, changePasswordDto.NewPassword))
                .ReturnsAsync(false);

            var result = await _controller.ChangePassword(changePasswordDto);

            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal("Current password is incorrect", badRequestResult.Value);
        }

        // Tests admin user retrieving paginated list of all users in the system
        [Fact]
        public async Task GetUsers_ValidAdminRequest_ReturnsUsers()
        {
            var userId = 1;
            var pageIndex = 0;
            var pageSize = 10;

            var users = new List<User>
            {
                new() { Id = 1, Username = "user1", Email = "user1@example.com", PasswordHash = "hash1", Role = Role.User },
                new() { Id = 2, Username = "user2", Email = "user2@example.com", PasswordHash = "hash2", Role = Role.User }
            };

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, userId.ToString()),
                new(ClaimTypes.Role, "Admin")
            };
            var identity = new ClaimsIdentity(claims);
            var principal = new ClaimsPrincipal(identity);
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };

            _mockUserService.Setup(s => s.GetPagedListOfUsersAsync(pageIndex, pageSize))
                .ReturnsAsync(users);

            var result = await _controller.GetUsers(pageIndex, pageSize);

            var okResult = Assert.IsType<OkObjectResult>(result.Result);
            var userDtos = Assert.IsType<List<UserDto>>(okResult.Value);
            Assert.Equal(2, userDtos.Count);
            Assert.Equal("user1", userDtos[0].Username);
            Assert.Equal("user2", userDtos[1].Username);
        }
    }
}
