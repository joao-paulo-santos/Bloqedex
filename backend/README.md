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
```

<img src="../dev_docs/Backend_Architecture.png" alt="Backend Architecture Diagrams" />

### Design Patterns Implemented

1. **Repository Pattern** - Encapsulates data access logic
2. **Unit of Work Pattern** - Manages database transactions
3. **Service Layer Pattern** - Contains business logic
4. **Dependency Injection** - Promotes loose coupling
5. **Mapper Pattern** - Maps between entities and DTOs

## Features

### Core Functionality
- **User Management** - Registration, authentication, profile management
- **Pokémon Data** - Integration with PokéAPI with local caching
- **Pokédex Management** - Catch, release, and organize Pokémon
- **Search & Filtering** - Find Pokémon by name, type, etc.
- **Pokemon Sharing** - Share individual Pokemon or entire collections via secure links

### Technical Features
- **JWT Authentication** - Secure token-based authentication
- **SQLite Database** - Local data storage with Entity Framework Core
- **Global Rate Limiting** - Thread-safe PokéAPI rate limiting with singleton pattern
- **Comprehensive Logging** - Serilog integration
- **API Documentation** - Swagger/OpenAPI documentation
- **Performance Optimizations** - Smart caching, efficient queries, and optimized data access
- **Unit Testing** - Comprehensive test suite with 35+ tests using xUnit and Moq
- **Security Updates** - Latest JWT packages addressing known vulnerabilities

## Prerequisites

- .NET 8 SDK
- Visual Studio 2022 or VS Code
- SQLite (included with .NET)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Restore NuGet packages**
   ```bash
   dotnet restore
   ```

3. **Update configuration** (optional)
   - Edit `BloqedexApi/appsettings.json`
   - Change JWT secret key for production
   - Modify database connection string if needed

4. **Build the solution**
   ```bash
   dotnet build
   ```

5. **Run the application**
   ```bash
   cd BloqedexApi
   dotnet run
   ```

The API will be available at:
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`
- Swagger UI: `http://localhost:5000` (development only)

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

#### TypeSyncStatus Table
- Tracks completion status of Pokémon type synchronization
- Enables smart type-based fetching optimization

#### SharedPokemon Table
- User-generated sharing links for Pokemon and collections
- Secure token-based access with optional expiration and view limits

## Performance Optimizations

The Bloqedex API implements several performance optimizations to provide a better user experience while minimizing external API calls:

### Smart On-Demand Caching
Instead of requiring manual bulk synchronization, the system fetches and caches Pokémon data as needed:

- **Individual Pokémon**: When searched by name, automatically fetched from PokéAPI if not present localy
- **Type-Based Searches**: Complete type data fetched once, skipping already owned, then served from cache
- **Smart Pagination**: Automatically fills gaps in paginated results

### Smart Pagination with Gap Filling
pagination that ensures complete pages even with sparse data:

```
Example: Page 2 (Pokémon 21-40)
Local DB: 21, 23, 25, 30, 35, 40 ✅
Missing: 22, 24, 26-29, 31-34, 36-39 ❌
Action: Fetch only missing Pokémon from PokéAPI
Result: Complete page with all 20 Pokémon
```

**Benefits:**
- No massive bulk downloads
- Minimal API calls (only fetch what's missing)
- Fast response times
- Progressive database building
- Complete pagination results

### Type Completeness Tracking
`TypeSyncStatus` table tracks which types are fully synchronized:
- First type search: Fetches all missing Pokémon of that type
- Subsequent searches: Fast local queries
- Automatic completeness validation

### Intelligent Sync Strategy
- **No Automatic Triggers**: Manual control over bulk operations
- **Admin Control**: `POST /api/Pokemon/sync` for intentional bulk imports
- **Background Processing**: Type synchronization runs asynchronously
- **Graceful Degradation**: System works even if external API is unavailable

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register** or **Login** to receive a JWT token
2. Include the token in the `Authorization` header: `Bearer <token>`
3. Tokens expire after 24 hours (configurable)

### Example Usage

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"trainer","email":"trainer@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"trainer","password":"password123"}'
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /me` - Get current user info
- `POST /change-password` - Change password
- `GET /users` - List users (Admin only)

### Pokémon (`/api/pokemon`)
- `GET /` - List Pokémon with smart pagination and gap filling
- `GET /summary` - Pokémon summary with optimized fetching
- `GET /{id}` - Get Pokémon by ID
- `GET /pokeapi/{pokeApiId}` - Get/fetch Pokémon by PokéAPI ID
- `POST /sync` - Manual bulk sync from PokéAPI (Admin only)
- `GET /stats` - Get Pokémon database statistics

### Pokédex (`/api/pokedex`)
- `GET /` - Get user's caught Pokémon
- `GET /favorites` - Get favorite Pokémon
- `POST /catch` - Catch a Pokémon
- `POST /catch/bulk` - Catch multiple Pokémon in one operation
- `PATCH /{id}` - Update caught Pokémon (notes, favorite)
- `DELETE /{id}` - Release Pokémon
- `DELETE /release/bulk` - Release multiple Pokémon in one operation
- `GET /check/{pokemonId}` - Check if Pokémon is caught
- `GET /stats` - Get Pokédex statistics

## Testing

Run the unit tests:

```bash
dotnet test
```

The test suite includes:
- User service tests (registration, authentication, password management)
- Caught Pokémon service tests (catching, updating, checking status)
- Repository pattern tests
- JWT token service tests
- Smart caching and pagination optimization tests
- Type completeness tracking tests

## Configuration

### JWT Settings (`appsettings.json`)
```json
{
  "JwtSettings": {
    "SecretKey": "YourSecretKeyHere",
    "Issuer": "BloqedexApi",
    "Audience": "BloqedexClient",
    "ExpireMinutes": 1440
  }
}
```

### Database Connection
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=bloqedex.db"
  }
}
```

## PokéAPI Integration

The backend integrates with [PokéAPI](https://pokeapi.co/) through caching layer that maximizes performance while minimizing external API calls:

### Smart Fetching Strategies

- On-Demand Individual Fetching
- Intelligent Type-Based Fetching
- Smart Pagination Gap Filling

### Rate Limiting & Resilience
- Respects PokéAPI rate limits with automatic delays
- Retry logic for rate limit responses
- Graceful degradation when external API is unavailable
- All fetched data is permanently cached locally
- Background processing for non-blocking operations

### Data Synchronization States
1. **Individual Cache**: Single Pokémon cached on-demand
2. **Type Complete**: All Pokémon of a type cached and marked complete
3. **Bulk Sync**: Manual admin operation for mass data import
4. **Progressive Build**: Database grows organically through user interactions

### Covered Data
- Basic Pokémon info (name, height, weight)
- Stats (HP, Attack, Defense, Special Attack, Special Defense, Speed)
- Types (primary and secondary)
- Sprites (front default and official artwork)

## Logging

The application uses Serilog for comprehensive logging:

- **Console output** for development
- **File logging** with daily rotation
- **Structured logging** with request/response details
- **Error tracking** with stack traces

Log files are stored in the `logs/` directory.

## Deployment

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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## API Documentation

When running in development mode, comprehensive API documentation is available at the root URL (Swagger UI). This includes:

- All endpoint details
- Request/response models
- Authentication requirements
- Example requests

## Troubleshooting

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Myself for my previous architecture study in [Bapi](https://github.com/joao-paulo-santos/bapi), in wich this backend architecture was based off
- [PokéAPI](https://pokeapi.co/) for providing comprehensive Pokémon data
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) principles by Robert C. Martin
- The .NET community for excellent libraries and tools
