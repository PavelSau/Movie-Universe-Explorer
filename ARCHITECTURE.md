# Movie Universe Explorer - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Client (React + D3)                │
│                                                         │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐  │
│  │  Search  │  │  Graph   │  │Timeline │  │ Heatmap  │  │
│  │  + Nav   │  │  View    │  │  View   │  │  View    │  │
│  └────┬─────┘  └────┬─────┘  └────┬────┘  └────┬─────┘  │
│       │              │             │             │        │
│  ┌────┴──────────────┴─────────────┴─────────────┴────┐  │
│  │              TanStack Query Cache                  │  │
│  └────────────────────────┬───────────────────────────┘  │
└───────────────────────────┼──────────────────────────────┘
                            │ HTTP (REST)
┌───────────────────────────┼──────────────────────────────┐
│                    Backend (Express)                      │
│  ┌────────────┐  ┌────────┴───────┐  ┌────────────────┐  │
│  │ Rate Limiter│  │  API Router    │  │  In-Memory     │  │
│  │  (queue)   │──│  + Validation  │──│  Cache (TTL)   │  │
│  └────────────┘  └────────┬───────┘  └────────────────┘  │
└───────────────────────────┼──────────────────────────────┘
                            │ HTTPS
                   ┌────────┴────────┐
                   │   TMDb REST API  │
                   └─────────────────┘
```

---

## Frontend Architecture

### Folder Structure

```
src/
├── app/
│   ├── App.tsx                    # Root component, layout, routing
│   ├── AppProviders.tsx           # Composes all context providers
│   └── routes.tsx                 # Route definitions (lazy imports)
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx             # Logo, search bar, navigation
│   │   ├── Sidebar.tsx            # Entity detail panel (film/actor info)
│   │   └── ViewSwitcher.tsx       # Tabs: Graph | Timeline | Heatmap | Trending
│   │
│   ├── search/
│   │   ├── SearchBar.tsx          # Input with debounce, autocomplete dropdown
│   │   ├── SearchResults.tsx      # Virtualized result list
│   │   └── SearchResultCard.tsx   # Single result item (poster + title + year)
│   │
│   ├── graph/
│   │   ├── GraphView.tsx          # Container: controls + canvas
│   │   ├── GraphCanvas.tsx        # D3 force-directed graph (SVG)
│   │   ├── GraphNode.tsx          # Single node (actor/film/director)
│   │   ├── GraphEdge.tsx          # Connection line with label
│   │   ├── GraphControls.tsx      # Zoom, filter by type, depth slider
│   │   └── GraphTooltip.tsx       # Hover details
│   │
│   ├── timeline/
│   │   ├── TimelineView.tsx       # Container: actor selector + chart
│   │   ├── TimelineChart.tsx      # D3 horizontal timeline (SVG)
│   │   ├── TimelineItem.tsx       # Single film on the timeline
│   │   └── TimelineLegend.tsx     # Genre color legend
│   │
│   ├── heatmap/
│   │   ├── HeatmapView.tsx        # Container: controls + canvas
│   │   ├── HeatmapCanvas.tsx      # D3 heatmap (Canvas for performance)
│   │   ├── HeatmapAxis.tsx        # Decade (x) and genre (y) labels
│   │   └── HeatmapTooltip.tsx     # Cell detail on hover
│   │
│   ├── trending/
│   │   ├── TrendingDashboard.tsx  # Grid layout for dashboard cards
│   │   ├── TrendingCard.tsx       # Single trending item
│   │   ├── TrendingFilters.tsx    # Time window, media type toggles
│   │   └── TrendingChart.tsx      # Sparkline or mini bar chart
│   │
│   └── shared/
│       ├── ErrorBoundary.tsx      # Catches render errors per panel
│       ├── LoadingSkeleton.tsx    # Placeholder shapes during loading
│       ├── EmptyState.tsx         # "No results" / "Search to begin"
│       └── Poster.tsx             # Responsive TMDb image with fallback
│
├── hooks/
│   ├── useMovieSearch.ts          # Search query → TanStack Query
│   ├── useMovieDetails.ts         # Movie detail + credits fetch
│   ├── usePersonDetails.ts        # Person detail + filmography fetch
│   ├── useGraphData.ts            # Transforms API data → D3 graph nodes/edges
│   ├── useTimelineData.ts         # Transforms filmography → timeline items
│   ├── useHeatmapData.ts          # Aggregates genres × decades → matrix
│   ├── useTrending.ts             # Trending endpoint query
│   ├── useResizeObserver.ts       # Shared responsive container hook
│   └── useDebounce.ts             # Generic debounce hook
│
├── stores/
│   ├── useAppStore.ts             # Navigation: selected entity, active view, search query
│   └── useGraphStore.ts           # Graph UI: zoom level, expanded nodes, pinned nodes
│
├── services/
│   └── api.ts                     # Axios/fetch instance, base URL, error interceptor
│
├── schemas/
│   ├── search.schema.ts           # searchSchema: query string, type filter
│   ├── movie.schema.ts            # movieIdSchema, discoverFiltersSchema
│   ├── person.schema.ts           # personIdSchema
│   ├── trending.schema.ts         # trendingFiltersSchema: time window, media type
│   └── heatmap.schema.ts          # heatmapFiltersSchema: genre, decade range
│
├── types/
│   ├── movie.types.ts             # Movie, MovieDetail, Credits (inferred from schemas where possible)
│   ├── person.types.ts            # Person, PersonDetail, Filmography
│   ├── graph.types.ts             # GraphNode, GraphEdge, GraphData
│   ├── timeline.types.ts          # TimelineItem, TimelineData
│   ├── heatmap.types.ts           # HeatmapCell, HeatmapMatrix
│   └── trending.types.ts          # TrendingItem, TimeWindow
│
├── utils/
│   ├── formatters.ts              # formatRuntime, formatDate, formatCurrency
│   ├── colorScales.ts             # D3 color scales for genres, ratings
│   ├── graphLayout.ts             # Force simulation config, collision params
│   └── constants.ts               # TMDb image base URLs, breakpoints, limits
│
├── styles/
│   └── global.css                 # Tailwind directives, base resets, scrollbar
│
├── main.tsx                       # Entry point, renders App inside StrictMode
└── vite-env.d.ts                  # Vite type declarations
```

### E2E Test Structure

```
e2e/
├── fixtures/
│   └── tmdb-responses.json        # Realistic TMDb mock data for stable tests
│
├── tests/
│   ├── search.spec.ts             # @core: search → results → select entity
│   ├── graph.spec.ts              # @core: graph renders, node click navigates
│   ├── timeline.spec.ts           # @core: actor timeline renders chronologically
│   ├── heatmap.spec.ts            # @core: heatmap displays, hover/click works
│   ├── trending.spec.ts           # @core: dashboard loads, day/week filter
│   └── navigation.spec.ts        # @core: view switching preserves entity
│
├── helpers/
│   └── setup.ts                   # MSW handlers, common navigation helpers
│
├── screenshots/                   # Baseline screenshots for visual regression
│
└── playwright.config.ts           # Browser matrix, base URL, screenshot config
```

### Backend Folder Structure

```
server/
├── src/
│   ├── index.ts                   # Express app bootstrap, middleware, listen
│   ├── config.ts                  # Env vars (PORT, TMDB_API_KEY), validation
│   │
│   ├── routes/
│   │   ├── search.routes.ts       # GET /api/search?query=&type=
│   │   ├── movie.routes.ts        # GET /api/movie/:id, /api/movie/:id/credits
│   │   ├── person.routes.ts       # GET /api/person/:id, /api/person/:id/filmography
│   │   ├── discover.routes.ts     # GET /api/discover?genre=&decade=
│   │   └── trending.routes.ts     # GET /api/trending?window=day|week
│   │
│   ├── middleware/
│   │   ├── rateLimiter.ts         # Queue-based TMDb rate limit (40 req/10s)
│   │   ├── cache.ts               # In-memory cache middleware (node-cache)
│   │   ├── errorHandler.ts        # Centralized error → { error, code }
│   │   └── validate.ts            # Zod schema validation middleware (reuses frontend schemas)
│   │
│   ├── services/
│   │   └── tmdb.ts                # TMDb API client: fetch + key injection
│   │
│   └── types/
│       └── api.types.ts           # Response shapes, types inferred from shared zod schemas
│
├── package.json
└── tsconfig.json
```

---

## Data Flow

### 1. Search Flow

```
User types in SearchBar
       │
       ▼ (debounced 300ms)
Zod searchSchema.safeParse({ query, type })
       │
       ├─ ✗ validation fails → show inline error, no API call
       │
       ▼ ✓ valid
useMovieSearch hook fires
       │
       ▼
TanStack Query → GET /api/search?query=batman&type=movie
       │
       ▼
Backend validates → TMDb /search/movie → reshapes → responds
       │
       ▼
SearchResults renders virtualized list
       │
       ▼ (user clicks result)
useAppStore.getState().selectEntity({ type: 'movie', id: 123 })
       │
       ▼
Active view component fetches detail data + renders visualization
```

### 2. Graph Data Flow

```
Selected entity (movie or person)
       │
       ▼
useMovieDetails / usePersonDetails (fetches credits/filmography)
       │
       ▼
useGraphData transforms:
  - Movie → center node, actors/directors as connected nodes
  - Person → center node, films as connected nodes
  - Shared connections discovered from credits overlap
       │
       ▼
GraphCanvas receives { nodes: GraphNode[], edges: GraphEdge[] }
       │
       ▼
D3 force simulation computes positions
       │
       ▼
React renders SVG <circle> and <line> elements from simulation state
       │
       ▼ (user clicks a node)
useAppStore.selectEntity() called → graph re-centers on new entity
```

### 3. Timeline Data Flow

```
Selected person (actor/director)
       │
       ▼
usePersonDetails → full filmography
       │
       ▼
useTimelineData transforms:
  - Sort films by release_date
  - Map each to { x: date, y: role, genre, rating, revenue }
       │
       ▼
TimelineChart renders:
  - X axis: years (D3 scaleTime)
  - Items positioned by release date
  - Color-coded by genre
  - Size/opacity by rating or revenue
```

### 4. Heatmap Data Flow

```
useHeatmapData:
  - Fetches /api/discover for each genre × decade combination
  - OR aggregates from already-loaded filmography data
  - Builds matrix: rows = genres, cols = decades, value = avg rating or film count
       │
       ▼
HeatmapCanvas renders:
  - Canvas 2D context for performance
  - D3 scaleSequential for color intensity
  - Tooltip on hover shows: genre, decade, count, avg rating
```

---

## API Endpoints

| Method | Endpoint | Description | Cache TTL |
|--------|----------|-------------|-----------|
| GET | `/api/search` | Multi-search (movies, people) | 15 min |
| GET | `/api/movie/:id` | Movie details + credits | 1 hour |
| GET | `/api/movie/:id/credits` | Cast and crew | 1 hour |
| GET | `/api/person/:id` | Person details + filmography | 1 hour |
| GET | `/api/person/:id/filmography` | Combined credits | 1 hour |
| GET | `/api/discover` | Discover by genre/decade | 1 hour |
| GET | `/api/trending` | Trending movies/people | 15 min |
| GET | `/api/genres` | Genre list (for heatmap labels) | 24 hours |

---

## Visualization Specifications

### Graph View
- **Library:** D3 force simulation
- **Rendering:** SVG (React-managed nodes, D3-managed positions)
- **Node types:** Movie (rectangle + poster), Person (circle + photo), Director (diamond)
- **Edges:** Weighted by number of collaborations, labeled with role
- **Interactions:** Click to re-center, drag to reposition, scroll to zoom, double-click to expand connections
- **Performance:** Max 150 nodes displayed; beyond that, show only top connections with "expand" option
- **Layout forces:** charge (repulsion -300), link distance 100, collision radius based on node size, center gravity

### Timeline View
- **Library:** D3 scaleTime + scaleBand
- **Rendering:** SVG
- **X-axis:** Time (years), zoomable/pannable
- **Items:** Circles or cards positioned by release date
- **Color:** Genre-based (consistent palette with heatmap)
- **Size:** Mapped to box office revenue (optional toggle)
- **Interactions:** Hover for details, click to select film, brush to zoom time range

### Heatmap View
- **Library:** D3 scaleSequential + scaleOrdinal
- **Rendering:** Canvas (potentially thousands of cells)
- **X-axis:** Decades (1920s–2020s)
- **Y-axis:** Genres (sorted by total film count)
- **Color:** Sequential scale (light → dark) representing average rating or film count
- **Interactions:** Hover for cell tooltip, click to see films in that genre+decade

### Trending Dashboard
- **Layout:** Tailwind Grid, responsive cards
- **Content:** Top 20 trending movies/people for day/week
- **Visuals:** Poster, title, sparkline of popularity score, genre tags
- **Interactions:** Click to explore in graph/timeline, toggle day/week

---

## Key Technical Decisions

### D3 + React Integration Pattern
React owns the DOM. D3 is used for:
- Scales (`scaleLinear`, `scaleTime`, `scaleOrdinal`, `scaleSequential`)
- Data transforms (`hierarchy`, `forceSimulation`)
- Generators (`line`, `arc`, `area`)
- Axes (via `useRef` + `useEffect` — D3 writes to a dedicated `<g>` ref)

React renders SVG elements using computed positions from D3. This avoids conflicts between D3's and React's DOM management.

### State Architecture
```
┌─────────────────────────────┐
│       TanStack Query        │  ← Server state (movies, people, trending)
│  (fetching, caching, sync)  │     Automatic refetch, stale-while-revalidate
└──────────────┬──────────────┘
               │ data flows down via hooks
┌──────────────┴──────────────┐
│     Zustand Stores          │  ← UI/navigation state
│  useAppStore, useGraphStore │     Selected entity, active view, filters
│                             │     Selective subscriptions → no wasted renders
│                             │     Readable outside React (D3 callbacks)
└──────────────┬──────────────┘
               │ selectors / props
┌──────────────┴──────────────┐
│     Component useState      │  ← Local ephemeral state
│                             │     Tooltips, hover, drag positions
└─────────────────────────────┘
```

#### Zustand Store Boundaries

**useAppStore** — global navigation state:
- `selectedEntity: { type: 'movie' | 'person', id: number } | null`
- `activeView: 'graph' | 'timeline' | 'heatmap' | 'trending'`
- `searchQuery: string`
- Actions: `selectEntity()`, `setActiveView()`, `setSearchQuery()`

**useGraphStore** — graph visualization state (isolated to avoid re-rendering other views):
- `zoomLevel: number`
- `expandedNodes: Set<string>`
- `pinnedNodes: Set<string>`
- `filterByType: 'all' | 'movie' | 'person'`
- Actions: `toggleExpand()`, `togglePin()`, `setZoom()`, `setFilter()`

### Routing Strategy
- `/` — Landing with trending dashboard
- `/search?q=batman` — Search results
- `/movie/:id` — Movie detail with graph as default view
- `/person/:id` — Person detail with timeline as default view
- `/heatmap` — Genre × decade heatmap (standalone exploration)
- View switching (graph/timeline/heatmap) is a tab within the entity page, not a route change

### Error Recovery
Each visualization panel is wrapped in its own `<ErrorBoundary>`. If the graph crashes, the sidebar and other views remain functional. Error boundaries display a retry button that resets the component tree.

### Responsive Behavior
- **Desktop (>1024px):** Sidebar + main visualization side-by-side
- **Tablet (768–1024px):** Sidebar collapses to overlay, visualization full-width
- **Mobile (<768px):** Stacked layout, simplified visualizations (fewer nodes, smaller heatmap)
- All D3 visualizations use `useResizeObserver` to redraw on container size change

### Testing Strategy

```
┌────────────────────────────────────────────────────────────────┐
│                    E2E (Playwright)                             │
│  Full user journeys: search → graph → navigate → timeline      │
│  Visual regression for D3 visualizations                       │
│  6 core spec files tagged @core — gate CI on these             │
├────────────────────────────────────────────────────────────────┤
│              Integration (Vitest + RTL + MSW)                   │
│  Component + hook + store working together                     │
│  MSW intercepts API — tests real data flow without backend     │
│  Each visualization: renders correct elements for given data   │
├────────────────────────────────────────────────────────────────┤
│                    Unit (Vitest)                                │
│  Pure functions: data transforms, Zod schemas, formatters      │
│  D3 scale/layout config helpers                                │
│  Fast, no DOM, no network                                      │
└────────────────────────────────────────────────────────────────┘
```

**CI pipeline order:** Unit → Integration → E2E (`@core` only on PR, full suite on main)

---

## Environment Variables

```
# Backend (.env — never committed)
TMDB_API_KEY=your_key_here
TMDB_BASE_URL=https://api.themoviedb.org/3
PORT=3001
NODE_ENV=development

# Frontend (.env — safe, no secrets)
VITE_API_BASE_URL=http://localhost:3001/api
```

---

## Dependency Summary

### Frontend
| Package | Purpose |
|---------|---------|
| react, react-dom | UI framework |
| react-router-dom | Client-side routing |
| zustand | App state management (selective subscriptions, outside-React access) |
| @tanstack/react-query | Server state management |
| @tanstack/react-virtual | List virtualization |
| d3 | Visualization engine |
| tailwindcss | Utility-first styling |
| clsx + tailwind-merge | Conditional class composition (`cn()` helper) |
| zod | Form/input validation (shared schemas with backend) |
| axios | HTTP client |

### Backend
| Package | Purpose |
|---------|---------|
| express | HTTP server |
| zod | Request validation |
| node-cache | In-memory TTL cache |
| cors | Cross-origin support |
| dotenv | Env variable loading |
| axios | TMDb API calls |

### Dev
| Package | Purpose |
|---------|---------|
| typescript | Type safety |
| vite | Build + dev server |
| vitest | Unit + integration test runner |
| @testing-library/react | Component integration testing |
| @playwright/test | E2E testing (browser automation, visual regression) |
| msw | API mocking (integration tests + e2e fixtures) |
| eslint + prettier | Code quality |
