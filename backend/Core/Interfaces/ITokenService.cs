namespace Core.Interfaces
{
    public interface ITokenService
    {
        string GenerateJwtToken(int userId, string username, string role);
        int? ValidateJwtToken(string token);
    }
}
