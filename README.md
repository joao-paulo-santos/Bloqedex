
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![LinkedIn](https://img.shields.io/badge/-LinkedIn-black.svg?style=flat&logo=linkedin&colorB=555)](https://www.linkedin.com/in/lw-jo%C3%A3o-paulo-santos/)

<br />
<div align="center">
  
<img src="readme_assets/logo.png" alt="Logo" width="150" height="150">

---

  <h3 align="center">Bloqedex</h3>

  <p align="center">
    Offline-First Pokédex application for Pokémon Trainers
    <br />
    <br />
    <a href="https://github.com/joao-paulo-santos/bloqedex/issues">Report Bug</a>
    ·
    <a href="https://github.com/joao-paulo-santos/bloqedex/issues">Request Feature</a>
  </p>
</div>

## About The Project

**Bloqedex** is a modern, full-stack Pokédex application built as a solution to the [Bloqit Frontend Engineering Challenge](https://github.com/bloqit/fe-engineering-challenge). The project demonstrates comprehensive full-stack development skills with a focus on clean architecture, user experience, and technical excellence.

### Challenge Background

After speaking with Pokémon Trainers, we identified the need for a centralized platform to help them on their journey to become Pokémon Masters. The application addresses the gap in tracking progress and managing Pokédex collections with limited internet connectivity.

### Key Features

#### For Pokémon Trainers
- **Complete Pokédex Management** - View all Pokémon with names, pictures, and caught status
- **Personal Collection** - Track caught Pokémon with detailed statistics and notes
- **Offline Capability** - Access your Pokédex with limited or no internet connectivity
- **Sharing System** - Share individual Pokémon or entire collections with fellow trainers
- **Progress Tracking** - Quick overview of Pokédex completion and statistics

#### Advanced Management
- **Smart Filtering & Sorting** - Filter by name, height, types, and timestamp
- **Bulk Operations** - Catch or release multiple Pokémon at once
- **Personal Notes** - Attach custom notes to each caught Pokémon
- **Multi-View Modes** - Analytical table view and mobile-optimized layouts
- **Data Export** - Export Pokédex to CSV format

#### Technical Excellence
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Smart Caching** - Efficient data loading with PokéAPI integration
- **Real-time Updates** - Live progress tracking and instant data synchronization

### Built With

#### Frontend Stack
- **Vite + React** - [WIP]
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management

#### [Backend](backend/README.md) Stack 
- **.NET 8** - Modern, high-performance backend
- **Entity Framework Core** - Data access with SQLite
- **JWT Authentication** - Secure token-based auth
- **Clean Architecture** - Maintainable, testable codebase
- **PokéAPI Integration** - Smart caching and rate limiting

---

## Architecture Overview

### Full-Stack Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│                 │◄──►│   (.NET 8)      │◄──►│   (PokéAPI)     │
│                 │    │                 │    │                 │
│                 │    │ • Clean Arch    │    │ • Pokémon Data  │
│ • Offline First │    │ • Smart Cache   │    │ • Rate Limited  │
│                 │    │ • JWT Auth      │    │ • 1000+ Pokémon │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Project Structure
```
bloqedex/
├── frontend/          # Frontend
│   ├── src/
│   │   ├── app/         # App Router pages
│   │   ├── components/  # Reusable UI components
│   │   ├── features/    # Feature-specific modules
│   │   ├── stores/      # Zustand state management
│   │   └── types/       # TypeScript definitions
│   └── public/          # Static assets
│
└── backend/             # Backend (.NET 8 API)
    ├── BloqedexApi/     # Web API layer
    ├── Application/     # Business logic
    ├── Core/            # Domain entities
    ├── Infrastructure/  # Data access & external services
    └── Testing/         # Tests
```

---

## Getting Started

### Prerequisites

- **Node.js 18+** (for frontend)
- **.NET 8 SDK** (for backend)
- **Git** for version control

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/joao-paulo-santos/bloqedex.git
   cd bloqedex
   ```

2. **Start the Backend**
   ```bash
   cd backend/BloqedexApi
   dotnet restore
   dotnet run
   ```
   Backend will be available at `http://localhost:5000`

3. **Start the Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend will be available at `http://localhost:3000`

4. **Start Exploring!**
   - Register a new account
   - Begin catching Pokémon
   - Explore the full Pokédex

### Installation & Documentation

For detailed setup instructions and technical documentation:

- **Frontend**: See [frontend/README.md](frontend/README.md) for offline mode, and deployment
- **Backend**: See [backend/README.md](backend/README.md) for API documentation, architecture details, and configuration


## Technical Highlights

### Frontend
- **Offline First Web App** - Seemsless offline experience with smart sync
- **Responsive Design** - Seamless experience across all devices
- **Performance Optimized** - Image optimization, lazy loading, caching
- **Type Safety** - Full TypeScript implementation

### Backend Architecture
- **Clean Architecture** - Domain-driven design with clear separation of concerns
- **Smart Caching** - Intelligent PokéAPI integration with local-first approach
- **Performance** - Optimized queries, pagination, and bulk operations
- **Security** - JWT authentication, input validation, rate limiting
- **Testing** - Comprehensive test suite with 100+ test methods

### Key Patterns & Practices
- **Repository Pattern** - Encapsulated data access
- **Service Layer** - Business logic separation
- **Unit of Work** - Transaction management
- **Dependency Injection** - Loose coupling
- **Rate Limiting** - External API protection


## Feature Showcase

### Core Pokédex Features
- Browse 1000+ Pokémon with detailed stats
- Catch/release Pokémon with personal notes
- Track completion progress and statistics
- Advanced filtering and sorting options

### Sharing & Collaboration
- Generate secure sharing links
- Share individual Pokémon or collections
- View limits and expiration controls
- Public viewing without authentication

### Offline
- Full offline browsing capability
- Background sync when online


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Contact

**João Santos** - [LinkedIn](https://www.linkedin.com/in/jo%C3%A3o-santos-015a082b9/)

**Project Link**: [https://github.com/joao-paulo-santos/bloqedex](https://github.com/joao-paulo-santos/bloqedex)

---

## Acknowledgments

- [Bloqit](https://bloq.it/) for the inspiring frontend engineering challenge
- [PokéAPI](https://pokeapi.co/) for providing comprehensive Pokémon data

---