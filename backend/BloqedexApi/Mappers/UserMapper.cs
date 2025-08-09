using BloqedexApi.DTOs;
using Core.Entities;

namespace BloqedexApi.Mappers
{
    public static class UserMapper
    {
        public static UserDto ToDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role.ToString(),
                CreatedDate = user.CreatedDate,
                CaughtPokemonCount = user.CaughtCount
            };
        }
    }
}
