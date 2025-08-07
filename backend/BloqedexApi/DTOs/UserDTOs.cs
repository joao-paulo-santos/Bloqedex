namespace BloqedexApi.DTOs
{
    public class LoginDto
    {
        public required string UsernameOrEmail { get; set; }
        public required string Password { get; set; }
    }

    public class RegisterDto
    {
        public required string Username { get; set; }
        public required string Email { get; set; }
        public required string Password { get; set; }
    }

    public class UserDto
    {
        public int Id { get; set; }
        public required string Username { get; set; }
        public required string Email { get; set; }
        public string Role { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public int CaughtPokemonCount { get; set; }
    }

    public class UserTokenDto
    {
        public required string Token { get; set; }
        public required UserDto User { get; set; }
    }

    public class ChangePasswordDto
    {
        public required string CurrentPassword { get; set; }
        public required string NewPassword { get; set; }
    }
}
