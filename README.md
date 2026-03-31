# Movie Universe Explorer

A data visualization app for exploring movie industry connections. Search films and actors, explore interactive graphs, career timelines, genre heatmaps, and trending dashboards.

Built with React 19, D3.js, TypeScript, Node.js/Express, PostgreSQL, and TMDb API.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (required)
- [Node.js 22+](https://nodejs.org/) (for running tests locally)
- [TMDb API key](https://www.themoviedb.org/settings/api) (free — create an account at themoviedb.org)

## Quick Start

### 1. Clone and configure

```bash
git clone git@github.com:PavelSau/Movie-Universe-Explorer.git
cd Movie-Universe-Explorer
```

### 2. Create `.env` file

Copy the example and add your TMDb API key:

```bash
cp .env.example .env
```

Edit `.env` and replace `your_tmdb_api_key_here` with your actual key:

```env
TMDB_API_KEY=your_actual_tmdb_api_key
TMDB_BASE_URL=https://api.themoviedb.org/3
PORT=3001
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3001/api
VITE_MAX_GRAPH_CHILD_NODES=50
DATABASE_URL=postgresql://movie_user:movie_pass_2024@localhost:5432/movie_explorer
JWT_SECRET=movie-explorer-jwt-secret-2024
```

### 3. Start with Docker

```bash
docker compose up --build -d
```

This starts 3 containers:
- **Frontend** — http://localhost:5173
- **Backend** — http://localhost:3001
- **PostgreSQL** — localhost:5432 (auto-seeded with 5 demo users)

### 4. Open the app

Go to **http://localhost:5173**

Demo users (password for all: `password123`):
- `filmfan` / `cinephile` / `moviebuff` / `director_fan` / `screenwriter`

## Running Tests

Install dependencies first:

```bash
npm install
cd server && npm install && cd ..
```

### Unit + Integration tests (335 tests)

```bash
# Frontend (238 tests)
npm test

# Server (97 tests)
cd server && npm test
```

### E2E tests (requires Docker running)

```bash
# Install Playwright browser
npx playwright install chromium

# Run headless
npm run test:e2e

# Run with visible browser (demo mode — slow motion, single session)
npm run test:e2e:demo
```

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, TanStack Query |
| Visualization | D3.js, Nivo (heatmap, radar, scatterplot) |
| UI | shadcn/ui, Lucide icons |
| Backend | Node.js, Express 5, PostgreSQL, JWT auth |
| API | TMDb (The Movie Database) |
| Testing | Vitest, React Testing Library, MSW, Playwright |
| Infrastructure | Docker Compose (3 containers) |

## Project Structure

```
src/
  components/     # React components (44 total)
    ui/           # shadcn/ui primitives
    graph/        # D3 force graph
    timeline/     # Career timeline
    heatmap/      # Genre heatmap
    search/       # Search bar + results
    trending/     # Trending dashboard
  hooks/          # Custom hooks (16)
  stores/         # Zustand stores (3)
  pages/          # Route pages (5)
  types/          # TypeScript types
  utils/          # Formatters, constants
  services/       # API client (axios)
  test/           # Test setup, MSW mocks

server/
  src/
    routes/       # Express routes (9)
    middleware/    # Cache, auth, error handler
    services/     # TMDb client, DB

e2e/
  tests/          # Playwright specs
```
