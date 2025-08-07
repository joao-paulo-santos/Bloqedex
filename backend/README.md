# Bloqedex Backend API

A comprehensive .NET 8 backend API for the Bloqedex Pokédex application, built following Clean Architecture principles and integrating with the PokéAPI.

## Architecture

This project follows Clean Architecture principles with clear separation of concerns:

```
├── Core/                    # Domain layer (entities, interfaces)
├── Application/            # Application layer (services, business logic)
├── Infrastructure/         # Infrastructure layer (data access, external services)
├── BloqedexApi/           # Presentation layer (controllers, DTOs)
└── Testing/               # Unit tests
### Design Patterns Implemented

## Features
### Core Functionality

### Technical Features

## 🛠️ Prerequisites

- .NET 8 SDK
- Visual Studio 2022 or VS Code
- SQLite (included with .NET)

## Database

The application uses SQLite with Entity Framework Core. The database is automatically created on first run.

### Database Schema

#### Users Table
- User authentication and profile information
- Roles: User, Admin

#### Pokemon Table
- Cached Pokémon data from PokéAPI
- Stats, sprites, and type information

#### CaughtPokemon Table
- User's Pokédex entries
- Notes and favorite status

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register** or **Login** to receive a JWT token
2. Include the token in the `Authorization` header: `Bearer <token>`
3. Tokens expire after 24 hours (configurable)

## 🔄 PokéAPI Integration

The backend integrates with [PokéAPI](https://pokeapi.co/) to fetch Pokémon data:

### Rate Limiting
- Respects PokéAPI rate limits with automatic delays
- Implements retry logic for rate limit responses
- Caches all fetched data locally to minimize API calls

### Data Caching
- Pokémon data is cached in SQLite on first fetch
- Subsequent requests use local data
- Admin sync endpoint for bulk data import

### Covered Data
- Basic Pokémon info (name, height, weight)
- Stats (HP, Attack, Defense, Special Attack, Special Defense, Speed)
- Types (primary and secondary)
- Sprites (front default and official artwork)

## 📊 Logging

The application uses Serilog for comprehensive logging:

## 🚀 Deployment

### Development
```bash
dotnet run --environment Development
```

### Production
1. Update `appsettings.Production.json` with production settings
2. Change JWT secret key
3. Configure CORS for your frontend domain
4. Build for release:
   ```bash
   dotnet publish -c Release
   ```

### Docker (Optional)
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "BloqedexApi.dll"]
```

## 🤝 Contributing
## 📝 API Documentation

When running in development mode, comprehensive API documentation is available at the root URL (Swagger UI). This includes:

- All endpoint details
- Request/response models
- Authentication requirements
- Example requests

## 🔍 Troubleshooting

### Common Issues

1. **Database not created**
   - Ensure the application has write permissions
   - Check the connection string in `appsettings.json`

2. **JWT token issues**
   - Verify the secret key is at least 32 characters
   - Check token expiration settings

3. **PokéAPI rate limiting**
   - The application automatically handles rate limits
   - Consider using the sync endpoint for bulk imports

4. **CORS issues**
   - Update the CORS policy in `Program.cs`
   - Add your frontend URL to allowed origins

## 📋 License

## 🙏 Acknowledgments
- Myself for my previous architecture study in [Bapi](https://github.com/joao-paulo-santos/bapi), in wich this backend architecture was based off
- [PokéAPI](https://pokeapi.co/) for providing comprehensive Pokémon data
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) principles by Robert C. Martin
