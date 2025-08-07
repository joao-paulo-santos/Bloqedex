using BloqedexApi.DTOs;
using BloqedexApi.Mappers;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BloqedexApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ITokenService _tokenService;
        public AuthController(IUserService userService, ITokenService tokenService)
        {
            _userService = userService;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<UserTokenDto>> Register([FromBody] RegisterDto registerDto)
        {
            var user = await _userService.RegisterUserAsync(registerDto.Username, registerDto.Email, registerDto.Password);
            if (user == null)
                return BadRequest("Username or email already exists");

            var token = _tokenService.GenerateJwtToken(user.Id, user.Username, user.Role.ToString());

            return Ok(new UserTokenDto
            {
                Token = token,
                User = UserMapper.ToDto(user)
            });
        }

        [HttpPost("login")]
        public async Task<ActionResult<UserTokenDto>> Login([FromBody] LoginDto loginDto)
        {
            var user = await _userService.AuthenticateUserAsync(loginDto.UsernameOrEmail, loginDto.Password);
            if (user == null)
                return Unauthorized("Invalid credentials");

            var token = _tokenService.GenerateJwtToken(user.Id, user.Username, user.Role.ToString());

            return Ok(new UserTokenDto
            {
                Token = token,
                User = UserMapper.ToDto(user)
            });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var user = await _userService.GetUserByIdAsync(userId.Value);
            if (user == null)
                return NotFound();

            return Ok(UserMapper.ToDto(user));
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var success = await _userService.ChangePasswordAsync(userId.Value, changePasswordDto.CurrentPassword, changePasswordDto.NewPassword);
            if (!success)
                return BadRequest("Current password is incorrect");

            return Ok();
        }

        [HttpGet("users")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<List<UserDto>>> GetUsers([FromQuery] int pageIndex = 0, [FromQuery] int pageSize = 10)
        {
            var users = await _userService.GetPagedListOfUsersAsync(pageIndex, pageSize);
            var userDtos = new List<UserDto>();

            foreach (var user in users)
            {
                userDtos.Add(UserMapper.ToDto(user));
            }

            return Ok(userDtos);
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : null;
        }
    }
}
