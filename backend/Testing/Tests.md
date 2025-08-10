# Bloqedex Backend Test Suite

This document provides a comprehensive overview of all tests in the Bloqedex backend, organized by category and layer. Every test includes clear objectives and covers specific functionality to ensure system reliability and correctness.


## Test Coverage Overview

- **Coverage Areas**: Controllers, Services, Repositories, Rate Limiting, Authentication
- **Testing Framework**: xUnit with Moq for mocking
- **Database**: Entity Framework Core InMemory for isolated tests


## Controller Tests (API Layer)

### AuthControllerTests
**Purpose**: Tests authentication and user management API endpoints

#### User Registration
- `Register_ValidUser_ReturnsOkWithToken` - Tests user registration with valid data returns success response with JWT token
- `Register_ExistingUser_ReturnsBadRequest` - Tests user registration with existing username/email returns error response

#### User Authentication  
- `Login_ValidCredentials_ReturnsOkWithToken` - Tests user login with correct credentials returns success response with JWT token
- `Login_InvalidCredentials_ReturnsUnauthorized` - Tests user login with incorrect credentials returns unauthorized response

#### User Profile Management
- `GetCurrentUser_ValidToken_ReturnsUser` - Tests retrieving current user profile with valid authentication token
- `GetCurrentUser_NoToken_ReturnsUnauthorized` - Tests retrieving current user profile without authentication returns unauthorized
- `GetCurrentUser_UserNotFound_ReturnsNotFound` - Tests retrieving current user when user no longer exists returns not found

#### Password Management
- `ChangePassword_ValidRequest_ReturnsOk` - Tests changing password with correct current password returns success
- `ChangePassword_WrongCurrentPassword_ReturnsBadRequest` - Tests changing password with incorrect current password returns error

#### Admin Functions
- `GetUsers_ValidAdminRequest_ReturnsUsers` - Tests admin user retrieving paginated list of all users in the system

### PokemonControllerTests  
**Purpose**: Tests Pokemon data retrieval and management API endpoints

#### Pokemon Search & Retrieval
- `GetPokemon_WithPageIndex_ReturnsPaginatedPokemon` - Tests retrieving paginated Pokemon list with default page index
- `GetPokemon_WithName_ReturnsSpecificPokemon` - Tests searching for Pokemon by name returns specific Pokemon
- `GetPokemon_WithType_ReturnsPokemonOfType` - Tests filtering Pokemon by type returns Pokemon matching that type
- `GetPokemon_WithLoggedInUser_IncludesCaughtStatus` - Tests authenticated user gets Pokemon list with caught status included

#### Individual Pokemon Access
- `GetPokemonById_ExistingPokemon_ReturnsPokemon` - Tests retrieving specific Pokemon by internal database ID
- `GetPokemonById_NonExistentPokemon_ReturnsNotFound` - Tests retrieving non-existent Pokemon by ID returns not found
- `GetPokemonById_WithLoggedInUserAndCaughtPokemon_ReturnsCaughtStatus` - Tests authenticated user gets Pokemon details with caught status and date

#### PokeAPI Integration
- `GetPokemonByPokeApiId_ExistingPokemon_ReturnsPokemon` - Tests retrieving Pokemon by PokeAPI ID returns correct Pokemon
- `GetPokemonByPokeApiId_NonExistentPokemon_ReturnsNotFound` - Tests retrieving non-existent Pokemon by PokeAPI ID returns not found

#### Summary Views
- `GetPokemonSummary_WithName_ReturnsSpecificPokemonSummary` - Tests getting Pokemon summary by name returns simplified Pokemon data

#### Admin Sync Operations
- `SyncPokemonFromPokeApi_ValidAdminRequest_ReturnsSuccess` - Tests admin user can sync Pokemon data from PokeAPI successfully
- `SyncPokemonFromPokeApi_ServiceThrowsException_ReturnsInternalServerError` - Tests Pokemon sync handles service errors and returns server error

#### Statistics
- `GetPokemonStats_WithUser_ReturnsStatsWithUserCaughtCount` - Tests getting Pokemon statistics with user shows user's caught count

### PokedexControllerTests
**Purpose**: Tests user's personal Pokedex management functionality

#### Caught Pokemon Retrieval
- `GetCaughtPokemon_ValidUser_ReturnsCaughtPokemon` - Tests retrieving user's caught Pokemon with pagination
- `GetCaughtPokemon_NoUser_ReturnsUnauthorized` - Tests getting caught Pokemon without authentication returns unauthorized

#### Favorites Management
- `GetFavoritePokemon_ValidUser_ReturnsFavorites` - Tests retrieving user's favorite Pokemon collection  
- `GetFavoritePokemon_NoUser_ReturnsUnauthorized` - Tests getting favorite Pokemon without authentication returns unauthorized

#### Catching Pokemon
- `CatchPokemon_ValidRequest_ReturnsCaughtPokemon` - Tests catching a Pokemon with valid request returns caught Pokemon
- `CatchPokemon_PokemonNotFound_ReturnsBadRequest` - Tests catching non-existent Pokemon returns bad request

#### Bulk Catching Operations
- `BulkCatchPokemon_ValidRequest_ReturnsOperationResult` - Tests bulk catching multiple Pokemon returns operation results
- `BulkCatchPokemon_EmptyList_ReturnsBadRequest` - Tests bulk catching with empty list returns bad request

#### Pokemon Updates
- `UpdateCaughtPokemon_ValidOwner_ReturnsUpdatedPokemon` - Tests updating caught Pokemon by valid owner returns updated data
- `UpdateCaughtPokemon_NotFound_ReturnsNotFound` - Tests updating non-existent caught Pokemon returns not found
- `UpdateCaughtPokemon_NotOwner_ReturnsForbid` - Tests updating caught Pokemon owned by different user returns forbidden

#### Releasing Pokemon
- `ReleasePokemon_ValidRequest_ReturnsOk` - Tests releasing Pokemon with valid request returns success
- `ReleasePokemon_Failed_ReturnsBadRequest` - Tests releasing Pokemon that fails returns bad request

#### Bulk Release Operations
- `BulkReleasePokemon_ValidRequest_ReturnsOperationResult` - Tests bulk releasing multiple Pokemon returns operation results
- `BulkReleasePokemon_EmptyList_ReturnsBadRequest` - Tests bulk releasing with empty list returns bad request

#### Status Checking
- `IsPokemonCaught_ValidRequest_ReturnsBool` - Tests checking if Pokemon is caught by user returns boolean result

#### Statistics
- `GetPokedexStats_ValidUser_ReturnsStats` - Tests getting Pokedex statistics for authenticated user
- `GetPokedexStats_NoUser_ReturnsUnauthorized` - Tests getting Pokedex stats without authentication returns unauthorized

### SharingControllerTests
**Purpose**: Tests Pokemon and collection sharing functionality

#### Share Creation
- `CreateShare_SinglePokemon_ReturnsSharedPokemonDto` - Tests creating a single Pokemon share returns shared Pokemon DTO
- `CreateShare_Collection_ReturnsSharedPokemonDto` - Tests creating a Pokemon collection share returns shared Pokemon DTO
- `CreateShare_SinglePokemonMissingId_ReturnsBadRequest` - Tests creating single Pokemon share without Pokemon ID returns bad request
- `CreateShare_ServiceReturnsNull_ReturnsBadRequest` - Tests creating share when service fails returns bad request
- `CreateShare_NoUser_ReturnsUnauthorized` - Tests creating share without authentication returns unauthorized

#### Share Retrieval
- `GetMyShares_ValidUser_ReturnsUserShares` - Tests retrieving user's own shares returns list of shares
- `GetMyShares_NoUser_ReturnsUnauthorized` - Tests getting user shares without authentication returns unauthorized

#### Share Viewing (Public)
- `ViewSharedPokemon_ValidSinglePokemonShare_ReturnsSharedPokemonView` - Tests viewing valid single Pokemon share returns shared Pokemon view
- `ViewSharedPokemon_ValidCollectionShare_ReturnsSharedPokemonView` - Tests viewing valid collection share returns shared Pokemon view with collection
- `ViewSharedPokemon_InvalidToken_ReturnsNotFound` - Tests viewing share with invalid token returns not found

#### Share Management
- `UpdateShare_ValidRequest_ReturnsOk` - Tests updating share with valid request returns success
- `UpdateShare_ServiceReturnsFalse_ReturnsNotFound` - Tests updating share when service fails returns not found
- `UpdateShare_NoUser_ReturnsUnauthorized` - Tests updating share without authentication returns unauthorized

#### Share Deletion
- `DeleteShare_ValidRequest_ReturnsOk` - Tests deleting share with valid request returns success
- `DeleteShare_ServiceReturnsFalse_ReturnsNotFound` - Tests deleting share when service fails returns not found
- `DeleteShare_NoUser_ReturnsUnauthorized` - Tests deleting share without authentication returns unauthorized

---

## Application Tests (Business Logic Layer)

### UserServiceTests
**Purpose**: Tests user management business logic and authentication services

#### User Registration
- `RegisterUserAsync_ValidUser_ReturnsCreatedUser` - Tests creating new user with valid credentials
- `RegisterUserAsync_ExistingUsername_ReturnsNull` - Tests registration rejection for duplicate usernames
- `RegisterUserAsync_DuplicateUsername_ReturnsNull` - Tests duplicate username validation
- `RegisterUserAsync_DuplicateEmail_ReturnsNull` - Tests duplicate email validation

#### User Authentication
- `AuthenticateUserAsync_ValidCredentials_ReturnsUser` - Tests successful login with correct credentials
- `AuthenticateUserAsync_InvalidPassword_ReturnsNull` - Tests login rejection for incorrect password

### CaughtPokemonServiceTests
**Purpose**: Tests Pokemon catching and management business logic

#### Pokemon Catching
- `CatchPokemonAsync_ValidPokemon_ReturnsCaughtPokemon` - Tests successful Pokemon catching
- `CatchPokemonAsync_AlreadyCaught_ReturnsNull` - Tests prevention of catching duplicate Pokemon

#### Pokemon Updates
- `UpdateCaughtPokemonAsync_ValidUpdate_ReturnsUpdatedPokemon` - Tests updating caught Pokemon data

#### Status Checking
- `IsPokemonCaughtByUserAsync_CaughtPokemon_ReturnsTrue` - Tests verification of caught Pokemon
- `IsPokemonCaughtByUserAsync_NotCaughtPokemon_ReturnsFalse` - Tests verification of non-caught Pokemon

### PokemonServiceTests
**Purpose**: Tests Pokemon data retrieval, caching, and PokeAPI integration

#### Smart Pagination
- `GetOrFetchPagedListOfPokemonAsync_WithCompleteRange_ReturnsLocalDataOnly` - Tests efficient local data serving
- `GetOrFetchPagedListOfPokemonAsync_WithMissingPokemon_FetchesMissingOnly` - Tests selective missing Pokemon fetching
- `GetOrFetchPagedListOfPokemonAsync_ValidPagination_ReturnsCorrectPage` - Tests proper pagination logic

#### Type-Based Fetching
- `GetOrFetchPokemonByTypeAsync_WithIncompleteType_TriggersTypeSyncInBackground` - Tests background type synchronization
- `GetOrFetchPokemonByTypeAsync_WithCompleteType_UsesLocalDataOnly` - Tests efficient type-based queries

#### Type Sync Management
- `SyncPokemonByTypeAsync_MarksTypeAsCompleteWhenSuccessful` - Tests successful type completion marking
- `SyncPokemonByTypeAsync_MarksTypeAsIncompleteOnError` - Tests error handling in type sync

#### Individual Pokemon Operations
- `GetPokemonByIdAsync_ValidId_ReturnsExpectedPokemon` - Tests Pokemon retrieval by internal ID
- `GetPokemonByIdAsync_InvalidId_ReturnsNull` - Tests handling of invalid Pokemon IDs

#### Search Functionality
- `SearchPokemonByNameAsync_EmptySearchTerm_ReturnsEmptyList` - Tests empty search handling
- `SearchPokemonByNameAsync_ValidSearchTerm_ReturnsMatchingPokemon` - Tests name-based Pokemon search

#### PokeAPI Integration
- `GetOrFetchPokemonByPokeApiIdAsync_ExistingPokemon_ReturnsPokemon` - Tests local Pokemon serving
- `GetOrFetchPokemonByPokeApiIdAsync_NonExistingPokemon_FetchesFromApi` - Tests API fetching for missing Pokemon
- `GetOrFetchPokemonByPokeApiIdAsync_PokemonNotInDb_FetchesFromApiAndAddsToDb` - Tests Pokemon caching process

#### Name-Based Operations
- `GetOrFetchPokemonByNameAsync_ExistingPokemon_ReturnsPokemon` - Tests name-based Pokemon retrieval
- `GetOrFetchPokemonByNameAsync_NonExistingPokemon_FetchesFromApi` - Tests API fetching by name

#### Statistics
- `GetTotalPokemonCountAsync_ReturnsRepositoryCount` - Tests Pokemon count retrieval

#### Admin Operations
- `SyncPokemonFromPokeApiAsync_AdminSync_FetchesPokemonSuccessfully` - Tests admin bulk sync functionality

### SharedPokemonServiceTests
**Purpose**: Tests Pokemon sharing business logic and security

#### Collection Sharing
- `CreateCollectionShareAsync_ValidUser_ReturnsSharedPokemon` - Tests creating shareable Pokemon collections
- `CreateCollectionShareAsync_UserWithNoPokemons_ReturnsNull` - Tests handling users with empty collections

#### Single Pokemon Sharing
- `CreateSinglePokemonShareAsync_ValidCaughtPokemon_ReturnsSharedPokemon` - Tests creating individual Pokemon shares
- `CreateSinglePokemonShareAsync_NonExistentCaughtPokemon_ReturnsNull` - Tests handling invalid Pokemon IDs
- `CreateSinglePokemonShareAsync_UnauthorizedAccess_ReturnsNull` - Tests security for unauthorized sharing

#### Share Retrieval
- `GetSharedPokemonByTokenAsync_ValidToken_ReturnsSharedPokemon` - Tests token-based share access
- `GetSharedPokemonByTokenAsync_InvalidToken_ReturnsNull` - Tests invalid token handling
- `GetUserSharedPokemonAsync_ValidUser_ReturnsUserShares` - Tests user's share list retrieval

#### Share Management
- `UpdateSharedPokemonAsync_ValidOwnership_ReturnsTrue` - Tests authorized share updates
- `UpdateSharedPokemonAsync_NonExistentShare_ReturnsFalse` - Tests updating non-existent shares
- `UpdateSharedPokemonAsync_UnauthorizedAccess_ReturnsFalse` - Tests unauthorized update prevention

#### Share Deletion
- `DeleteSharedPokemonAsync_ValidOwnership_ReturnsTrue` - Tests authorized share deletion
- `DeleteSharedPokemonAsync_NonExistentShare_ReturnsFalse` - Tests deleting non-existent shares
- `DeleteSharedPokemonAsync_UnauthorizedAccess_ReturnsFalse` - Tests unauthorized deletion prevention

#### View Tracking
- `IncrementViewCountAsync_ValidToken_ReturnsTrue` - Tests view count increment
- `IncrementViewCountAsync_InvalidToken_ReturnsFalse` - Tests invalid token view tracking

#### Share Validation
- `ValidateAndGetSharedPokemonAsync_ActiveShare_ReturnsSharedPokemon` - Tests active share validation
- `ValidateAndGetSharedPokemonAsync_InactiveShare_ReturnsNull` - Tests inactive share handling
- `ValidateAndGetSharedPokemonAsync_ExpiredShare_ReturnsNull` - Tests expired share validation
- `ValidateAndGetSharedPokemonAsync_MaxViewsReached_ReturnsNull` - Tests view limit enforcement

#### Maintenance Operations
- `CleanupExpiredSharesAsync_WithExpiredShares_RemovesExpiredShares` - Tests expired share cleanup
- `CleanupExpiredSharesAsync_NoExpiredShares_DoesNotSaveChanges` - Tests efficient cleanup when no action needed

---

## Infrastructure Tests (Data Access Layer)

### TypeSyncStatusRepositoryTests
**Purpose**: Tests Pokemon type synchronization status tracking repository

#### Status Retrieval
- `GetTypeSyncStatusAsync_ReturnsCorrectResults` - Tests retrieving type sync status for both existing and non-existing types

#### Completion Checking
- `IsTypeCompleteAsync_ReturnsCorrectCompletionStatus` - Tests completion status verification for complete, incomplete, and non-existing types

#### Status Updates
- `MarkTypeAsCompleteAsync_CreatesAndUpdatesStatusCorrectly` - Tests marking types as complete for both new types and existing entries

#### Status Management
- `AddOrUpdateTypeSyncStatusAsync_HandlesNewAndExistingTypes` - Tests comprehensive add/update operations for type sync status

#### Edge Cases
- `MarkTypeAsIncompleteAsync_CreatesIncompleteStatus` - Tests marking types as incomplete with proper status creation

### PokeApiRateLimiterTests
**Purpose**: Tests rate limiting functionality for PokeAPI integration

#### Basic Rate Limiting
- `DelayIfNeededAsync_FirstCall_DoesNotDelay` - Tests that first API call proceeds without delay
- `DelayIfNeededAsync_ConsecutiveCalls_EnforcesMinimumDelay` - Tests minimum delay enforcement between calls

#### Concurrency Handling
- `DelayIfNeededAsync_MultipleConcurrentCalls_AreSerializedWithProperDelay` - Tests thread-safe concurrent request handling

#### Smart Timing
- `DelayIfNeededAsync_AfterSufficientWait_DoesNotDelay` - Tests that sufficient wait time allows immediate calls

### PokeApiRateLimiterIntegrationTests
**Purpose**: Tests rate limiter behavior in realistic scenarios

#### Singleton Behavior
- `MultipleUsers_ConcurrentRequests_ShareSameSingletonRateLimiter` - Tests that all users share the same rate limiter instance

#### Persistence
- `SequentialUsers_RateLimitingPersistsAcrossScopes` - Tests rate limiting persistence across different service scopes

#### Load Testing
- `HighConcurrency_SimulatingRealWorldLoad` - Tests rate limiter performance under high concurrent load

---

## Test Quality Features

### Comprehensive Coverage
- **Happy Path Testing**: All primary workflows tested with valid inputs
- **Error Handling**: Comprehensive error scenario coverage
- **Security Testing**: Authentication, authorization, and access control validation
- **Performance Testing**: Rate limiting and concurrent access validation

### Clean Test Architecture
- **Isolation**: Each test runs independently with fresh state
- **Mocking**: External dependencies properly mocked for reliable testing
- **Clear Naming**: Descriptive test names following pattern `Method_Scenario_ExpectedResult`
- **Documentation**: Every test has clear objective comment explaining purpose

### Quality Patterns
- **AAA Pattern**: Clear Arrange-Act-Assert structure
- **Repository Pattern Testing**: Infrastructure layer properly tested
- **Service Layer Testing**: Business logic thoroughly validated
- **Controller Integration Testing**: Full request-response cycle testing

### Performance Optimizations Tested
- **Smart Caching**: Tests verify local-first data serving
- **Rate Limiting**: Comprehensive PokeAPI rate limit compliance testing
- **Bulk Operations**: Efficient bulk catch/release operations validated
- **Type Sync**: Background type synchronization properly tested

---

## Running Tests

Execute the full test suite:
```bash
dotnet test
```

Run specific test categories:
```bash
# Controller tests only
dotnet test --filter "FullyQualifiedName~ControllerTests"

# Application service tests only  
dotnet test --filter "FullyQualifiedName~ApplicationTests"

# Infrastructure tests only
dotnet test --filter "FullyQualifiedName~InfrastructureTests"
```

Run with verbose output:
```bash
dotnet test --verbosity normal
```

## Test Dependencies

- **xUnit 2.6.2**: Core testing framework
- **Moq 4.20.69**: Mocking framework for dependencies
- **Entity Framework Core InMemory**: In-memory database for isolated testing
- **Microsoft.AspNetCore.Mvc.Testing**: Integration testing for controllers
