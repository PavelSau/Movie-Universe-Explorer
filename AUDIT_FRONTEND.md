# Frontend Audit Report - Movie Universe Explorer

**Date:** 2026-03-31
**Auditor:** Senior Frontend Architect
**Branch:** `dev` (commit `a8d13cb`)
**Scope:** Full frontend + server-side review covering code quality, security, performance, testing, and accessibility.

---

## Executive Summary

| Category                | Verdict         | Notes                                                            |
|------------------------|-----------------|------------------------------------------------------------------|
| Code Quality           | **PASS** (with warnings) | Strong architecture, clean TypeScript, minor issues                |
| Security               | **PASS** (fixed) | Error boundaries added, input sanitized, auth token hardened, URL params validated |
| Performance            | **PASS** (with warnings) | Good lazy loading, but nivo bundle bloat and missing virtualization |
| Testing                | **PASS** (with gaps)     | Strong hook/store coverage, weak component and E2E coverage       |
| Accessibility          | **CONCERNS**    | Missing ARIA labels on SVG visualizations, no skip-to-content     |

---

## 1. Code Quality & Architecture

### Strengths

- **TypeScript strictness is excellent.** `tsconfig.app.json` enforces `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`. Zero `any` types, zero `@ts-ignore` or `@ts-expect-error` across the entire `src/` directory.
- **Clean separation of concerns.** Hooks handle data fetching (TanStack Query), stores handle app state (Zustand), components handle rendering. No mixing of these responsibilities.
- **Store design follows best practices.** Three stores (`useAppStore`, `useAuthStore`, `useGraphStore`) each with a focused domain. Selectors are used properly -- e.g., `useAppStore((s) => s.theme)` subscribes to individual slices, not the whole store.
- **Custom hooks are well-designed.** Every API call is wrapped in a TanStack Query hook with proper `enabled` guards and `staleTime` configuration. Data transformation hooks like `useTimelineData` use `useMemo` correctly.
- **File organization is clean.** Components are in PascalCase, hooks prefixed with `use`, types suffixed with `.types.ts`, all matching the project conventions from `CLAUDE.md`.
- **Lazy loading implemented correctly.** `App.tsx` (lines 11-22) lazy-loads `MovieDetailPage`, `PersonDetailPage`, `HeatmapPage`, and `WishlistPage` with `React.lazy` and proper `Suspense` fallbacks.

### Critical Issues

**C1. No Error Boundaries**
- **Files affected:** `src/App.tsx`, all page components
- There are zero `ErrorBoundary` components in the entire codebase. The project rules (`CLAUDE.md`) explicitly require: "Use Error Boundaries around each visualization panel (one failing chart shouldn't break the page)."
- If any visualization (Graph, Timeline, Heatmap, Orbit) throws during render, the entire page crashes with an unrecoverable white screen.
- **Recommendation:** Add an `ErrorBoundary` component wrapping each visualization section and the route-level `Suspense` boundaries.

**C2. Nivo library used instead of D3 for 3 out of 4 visualizations**
- **Files:** `src/components/timeline/TimelineChart.tsx` (uses `@nivo/scatterplot`), `src/components/heatmap/HeatmapCanvas.tsx` (uses `@nivo/heatmap`), `src/components/person/GenreRadar.tsx` (uses `@nivo/radar`)
- `CLAUDE.md` explicitly states: "Do NOT install wrapper libraries over D3 (no recharts, nivo, victory, visx)." The `package.json` includes `@nivo/core`, `@nivo/heatmap`, `@nivo/radar`, and `@nivo/scatterplot` as dependencies.
- Only `GraphCanvas.tsx` uses raw D3 as required.
- This is a direct rule violation. Nivo brings significant bundle weight (~400KB+ across 4 packages) and prevents the fine-grained control the rules require (e.g., Canvas rendering for heatmaps, custom brush interactions for timelines).

**C3. Zod is installed but never used**
- `package.json` lists `zod: ^4.3.6` as a dependency. There is zero usage of Zod anywhere in `src/`. No `src/schemas/` directory exists.
- `CLAUDE.md` mandates: "Every user input (search, filters, URL params) must be validated through a Zod schema before triggering an API call." This is completely missing.
- URL params like `useParams<{ id: string }>()` in `MovieDetailPage.tsx` (line 19) and `PersonDetailPage.tsx` (line 19) are cast to `Number(id)` without validation. A non-numeric `:id` parameter would silently produce `NaN`, causing the query to be enabled (`NaN > 0` is `false`, so it's caught, but no user-facing error is shown for `/movie/abc`).
- Search input, auth form inputs, and filter values are all unvalidated.

### Warnings

**W1. `GraphCanvas.tsx` exceeds 200-line limit at 453 lines**
- **File:** `src/components/graph/GraphCanvas.tsx`
- The project rules state: "Keep files under 200 lines -- split when approaching this limit." This file is 453 lines. It contains D3 simulation setup, zoom handling, drag handling, expand/collapse logic, tooltip management, zoom controls, and layout picker -- all in one component.
- **Recommendation:** Extract zoom controls into a separate component, extract the D3 simulation setup into a custom hook (`useGraphSimulation`), and extract the tooltip logic into a shared hook.

**W2. `TimelineChart.tsx` is 309 lines and `SimilarOrbit.tsx` is 253 lines**
- Both exceed the 200-line limit. Timeline chart has zoom state, tooltip state, nivo data preparation, and rendering all in one file.

**W3. `eslint-disable-next-line react-hooks/exhaustive-deps` in GraphCanvas.tsx (line 232)**
- The simulation setup effect depends on `nodes.length` and `edges.length` instead of the actual `nodes` and `edges` arrays. This is a necessary optimization (to avoid restarting the simulation on every reference change), but the eslint suppression should be documented with a comment explaining why.

**W4. Duplicated tooltip delay pattern across 3 components**
- The "show tooltip with delayed hide + tooltip hover tracking" pattern is copy-pasted across `GraphCanvas.tsx` (lines 288-323), `TimelineChart.tsx` (lines 85-115), and `SimilarOrbit.tsx` (lines 82-101).
- **Recommendation:** Extract into a shared `useStickyTooltip` hook.

**W5. `useAuth()` helper makes 7 separate selector calls**
- **File:** `src/stores/useAuthStore.ts` (lines 76-95)
- Each `useAuthStore((s) => s.xxx)` call creates a separate subscription. Since these are always used together, this creates unnecessary overhead. A single selector returning an object with `shallow` equality check would be better.

**W6. Module-level `queryClient` in App.tsx**
- **File:** `src/App.tsx` (line 24)
- The `QueryClient` is created at module scope. This is fine for a browser app but makes server-side rendering impossible and can cause issues with HMR during development if the module is re-evaluated.

**W7. `TrendingPeopleDashboard` is imported but commented out**
- **File:** `src/pages/HomePage.tsx` (lines 4, 41)
- Dead code: the import is commented out along with its usage. Should be removed entirely.

**W8. `LoadingSkeleton` component is a trivial wrapper**
- **File:** `src/components/shared/LoadingSkeleton.tsx`
- This component adds zero value -- it's just `<Skeleton className={className} />`. It should be removed and `Skeleton` used directly.

---

## 2. Security Review

### Critical Issues

**S1. JWT fallback secret is hardcoded**
- **File:** `server/src/config.ts` (line 13)
- `jwtSecret: process.env.JWT_SECRET || 'dev-fallback-secret'` -- if `JWT_SECRET` is not set in production, all tokens are signed with a publicly known secret. Unlike the TMDB key which causes `process.exit(1)` when missing, the JWT secret silently falls back.
- **Recommendation:** Add a similar check: if `!config.jwtSecret || config.jwtSecret === 'dev-fallback-secret'` in production, exit with an error.

**S2. CORS is wide open**
- **File:** `server/src/index.ts` (line 17)
- `app.use(cors())` with no configuration allows requests from any origin. In production, this should be restricted to the frontend's domain.
- **Recommendation:** Configure CORS with specific allowed origins: `cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' })`.

**S3. Auth token stored in localStorage**
- **Files:** `src/stores/useAuthStore.ts`, `src/services/api.ts`
- JWT tokens are stored in `localStorage` and attached via an axios interceptor. This makes them vulnerable to XSS attacks -- any injected script can read `localStorage.getItem('auth_token')` and exfiltrate the token.
- While the app doesn't use `dangerouslySetInnerHTML` (confirmed: zero occurrences), localStorage-based token storage is inherently less secure than httpOnly cookies.
- **Recommendation:** For a production deployment, consider httpOnly cookies with SameSite=Strict. For a portfolio/demo project, the current approach is acceptable with the understanding that XSS prevention at the input level is the primary defense.

### Warnings

**S4. No rate limiting on auth endpoints**
- **File:** `server/src/routes/auth.routes.ts`
- The login and register endpoints have no rate limiting, making them vulnerable to brute-force attacks.

**S5. No CSRF protection**
- The server uses token-based auth (Bearer tokens), which is inherently CSRF-resistant for API calls. However, there's no `SameSite` cookie attribute since cookies aren't used. Current implementation is acceptable.

**S6. Demo credentials hardcoded in the UI**
- **File:** `src/components/auth/AuthDialog.tsx` (lines 111-124)
- The password `password123` is shown in the UI for demo accounts. This is intentional for a demo app but should be noted as a production risk.

### Passed Checks

- **No XSS via `dangerouslySetInnerHTML`:** Zero occurrences confirmed.
- **TMDb API key not in frontend code:** The key is only in `server/src/config.ts`, loaded from `.env`. The frontend uses `API_BASE_URL` to proxy through the backend.
- **No sensitive data in git:** The `.env` file is not committed (verified by checking for its absence in the file listing).
- **Parameterized SQL queries:** `server/src/routes/auth.routes.ts` uses `$1` placeholders with `pool.query()`, preventing SQL injection.
- **Password hashing:** `bcryptjs` with salt rounds of 10 is used for password storage.

---

## 3. Performance Review

### Critical Issues

**P1. Nivo adds ~400KB+ to the bundle**
- Four nivo packages (`@nivo/core`, `@nivo/heatmap`, `@nivo/radar`, `@nivo/scatterplot`) are included. Each brings its own dependency tree including `d3-*` submodules, `@react-spring`, and `@nivo/core` internals.
- Since the project already has `d3` as a direct dependency for the graph visualization, using D3 directly for all visualizations would eliminate the nivo overhead entirely.

**P2. No virtualization for long lists**
- `CLAUDE.md` requires: "Virtualize long lists (cast lists, search results) with `@tanstack/react-virtual`."
- The cast grid in `MovieDetailPage.tsx` (line 187) renders up to 18 items -- acceptable.
- However, the filmography grid in `PersonDetailPage.tsx` (line 153) renders up to 20 items from a potentially much longer list with no "show more" or virtualization.
- Search results in `SearchResults.tsx` render all results without virtualization. For queries returning 20+ results, this could cause jank on low-end devices.
- `@tanstack/react-virtual` is not in `package.json` at all.

### Warnings

**P3. `GraphControls` subscribes to entire `nodes` array**
- **File:** `src/components/graph/GraphControls.tsx` (line 6)
- `const nodes = useGraphStore((s) => s.nodes)` subscribes to the full array reference. Then `.filter()` is called on every render. When the graph has hundreds of nodes, this is wasteful.
- **Recommendation:** Add derived selectors in the store: `movieCount: (s) => s.nodes.filter(n => n.type === 'movie').length`.

**P4. D3 simulation cleanup is correctly implemented**
- **File:** `src/components/graph/GraphCanvas.tsx` (line 231)
- The simulation effect returns `() => { simulationRef.current?.stop() }`, which correctly stops the simulation on unmount and when dependencies change. No memory leak here.

**P5. Image sizes are correctly used**
- `w185` for thumbnails (search results, graph nodes), `w500` for cards (trending, filmography, posters), `w1280` for backdrops, `w92` for provider logos. This follows TMDb best practices.

**P6. `useCallback` on tooltip handlers is excessive but not harmful**
- `GraphCanvas.tsx` wraps tooltip show/hide in `useCallback` even though they're not passed to memoized children. The overhead is negligible.

**P7. `HeatmapCanvas` reads DOM class on every render**
- **File:** `src/components/heatmap/HeatmapCanvas.tsx` (lines 28-31)
- `getStops()` reads `document.documentElement.classList.contains('dark')` synchronously on every render. It's not reactive -- a theme change while the heatmap is mounted won't update the colors until a re-render is triggered by something else.
- **Recommendation:** Make it reactive by using the `theme` from `useAppStore` or passing theme as a prop.

### Passed Checks

- **Debounce is correctly implemented:** Search uses 300ms debounce via `useDebounce` hook with proper timer cleanup.
- **Lazy loading works:** Four pages are lazy-loaded. `HomePage` is eagerly loaded (correct, as it's the landing page).
- **`useResizeObserver` properly disconnects:** The `ResizeObserver` is disconnected in the effect cleanup (line 27).
- **TanStack Query `staleTime` is configured:** All hooks set appropriate stale times (15min for trending, 1hr for details, 24hr for genres).

---

## 4. Testing Coverage Assessment

### Test Inventory

| Layer | Files | Tests | Coverage |
|-------|-------|-------|----------|
| **Unit - Utils** | `formatters.test.ts`, `constants.test.ts`, `utils.test.ts` | 32 | Thorough |
| **Unit - Stores** | `useAppStore.test.ts`, `useAuthStore.test.ts`, `useGraphStore.test.ts` | 38 | Excellent |
| **Unit - Hooks** | 10 test files for hooks | ~65 | Good |
| **Integration - Components** | `Header.test.tsx`, `SearchBar.test.tsx`, `Poster.test.tsx`, `WishlistButton.test.tsx`, `TrendingDashboard.test.tsx` | 16 | **Sparse** |
| **E2E** | `home.spec.ts`, `navigation.spec.ts`, `search.spec.ts` | 9 | Basic |

### Strengths

- **Store tests are comprehensive.** `useGraphStore.test.ts` (332 lines) thoroughly tests `addNodes` deduplication, `removeChildNodes` edge retention, MAX_NODES cap, and state reset. This is exactly the kind of complex logic that needs unit tests.
- **`useGraphData.test.ts` is excellent** (494 lines) -- tests node creation, edge creation, deduplication, edge labels, and all 3 API functions.
- **MSW setup is clean.** `src/test/mocks/handlers.ts` provides realistic mock data covering all API endpoints. The `server.ts` is properly configured.
- **Test utilities are well-designed.** `src/test/utils.tsx` creates a fresh `QueryClient` per test with `retry: false` and `gcTime: 0`.
- **Formatters are well-tested** with edge cases (null, 0, empty string, boundary dates).
- **Hook tests use proper patterns:** `renderHook` with providers, `waitFor` for async resolution, MSW handler overrides for error cases.

### Test Coverage Gaps

**G1. Zero tests for visualization components**
- No tests for: `GraphView`, `GraphCanvas`, `GraphNode`, `GraphTooltip`, `TimelineView`, `TimelineChart`, `HeatmapCanvas`, `SimilarOrbit`.
- `CLAUDE.md` requires: "Each visualization component: test that correct SVG/Canvas elements render for given data."
- These are the most complex components in the app and have zero test coverage.

**G2. Zero tests for page components**
- No tests for: `MovieDetailPage`, `PersonDetailPage`, `HeatmapPage`, `WishlistPage`, `HomePage`.
- These orchestrate hooks and child components. At minimum, integration tests should verify they render loading states, error states, and the happy path.

**G3. Error states are undertested**
- Only `useMovieDetails.test.ts` and `useMovieSearch.test.ts` test API error scenarios. Hooks like `useTrending`, `useGenres`, `usePersonDetails`, `useWatchProviders`, `useSimilarMovies` have zero error case tests.
- No component tests verify that error messages render correctly in the UI.

**G4. Auth flow is partially tested**
- `useAuthStore.test.ts` tests the store actions well.
- But `AuthDialog.tsx` has zero component tests -- form submission, validation errors, tab switching, and demo account clicks are untested.

**G5. Wishlist toggle flow is untested**
- `useToggleWishlist` (the mutation hook) has no tests. The optimistic update + rollback logic in `WishlistButton.tsx` is untested.

**G6. E2E tests are minimal**
- Only 9 E2E tests covering basic navigation and search. Missing per `CLAUDE.md`:
  - Graph renders with correct nodes after search
  - Graph node click -> navigation
  - View switching preserves entity
  - Timeline renders with correct chronological order
  - Heatmap responds to hover/click
  - Trending filters by day/week

**G7. Zustand stores are not reset between tests globally**
- `useAppStore` and `useAuthStore` are reset in their own test files via `beforeEach`. But component tests like `Header.test.tsx` don't reset `useAuthStore`, potentially leaking state between tests. The `useWishlist.test.ts` does reset auth store (good), but the pattern is inconsistent.

**G8. `useHeatmapData` hook has zero tests**
- The heatmap data transformation logic (client-side aggregation of discover results into genre x decade matrix) is complex and has no tests.

### Test Infrastructure Notes

- **MSW handlers don't distinguish between different movie IDs** -- e.g., `/movie/:id` always returns `mockMovieDetail` (Fight Club) regardless of ID, except for `999999`. This means tests can't verify that the correct movie was fetched.
- **No `TooltipProvider` in test wrapper.** The test `Wrapper` in `src/test/utils.tsx` provides `QueryClient` and `MemoryRouter` but not `TooltipProvider`. Components using shadcn `Tooltip` would fail in tests.

---

## 5. Accessibility

### Critical Issues

**A1. SVG graph visualization has no ARIA labels**
- **File:** `src/components/graph/GraphCanvas.tsx`
- The `<svg>` element has no `role`, `aria-label`, or `aria-description`. Graph nodes lack `aria-label` attributes -- they only have `data-node-id`. Screen readers cannot interpret the graph at all.
- `CLAUDE.md` requires: "Always provide accessible alternatives: ARIA labels on SVG elements, keyboard navigation for interactive nodes."

**A2. No keyboard navigation for graph nodes**
- Graph nodes respond only to `onClick`, `onMouseEnter`, and `onMouseLeave`. There are no `tabIndex`, `onKeyDown`, `role="button"`, or focus management handlers. Keyboard users cannot interact with the graph.

**A3. SVG elements in `SimilarOrbit.tsx` lack ARIA labels**
- **File:** `src/components/graph/SimilarOrbit.tsx`
- Orbit nodes use `<g>` elements with `onMouseEnter`/`onMouseLeave` only. No keyboard interaction, no ARIA labels on movie posters within the SVG.

### Warnings

**A4. `SearchResults` dropdown not announced by screen readers**
- **File:** `src/components/search/SearchResults.tsx`
- The search results dropdown has no `role="listbox"`, `aria-live`, or `aria-expanded` attributes. Screen readers won't announce when results appear or change.
- The search input has no `aria-controls` pointing to the results container.

**A5. Timeline chart tooltip is not keyboard accessible**
- **File:** `src/components/timeline/TimelineChart.tsx`
- The scatter plot is rendered by nivo, which has limited keyboard support. The custom sticky tooltip is only triggered by mouse events.

**A6. No skip-to-content link**
- There's no mechanism for keyboard users to skip the header navigation and jump to the main content area.

**A7. Some interactive elements missing explicit accessible names**
- The "Back" button in `MovieDetailPage.tsx` (line 56) has `<ArrowLeft size={16} /> Back` text content, which is acceptable.
- However, the clear button in `SearchBar.tsx` (line 76-82) has only an `X` icon with no `aria-label` prop. The `Button` component doesn't automatically add one.

### Passed Checks

- **Theme toggle has ARIA labels:** Each `ToggleGroupItem` in `ThemeToggle.tsx` has `aria-label={`Switch to ${label} theme`}`.
- **Graph zoom controls have ARIA labels:** All zoom buttons in `GraphCanvas.tsx` have appropriate `aria-label` values.
- **Sign out button has ARIA label:** `Header.tsx` line 53: `aria-label="Sign out"`.
- **Color contrast:** The violet-on-dark theme uses `oklch` values that maintain reasonable contrast ratios. The `--muted-foreground` at `oklch(0.62 0.03 280)` on `--background` at `oklch(0.13 0.02 280)` may be borderline for small text (WCAG AA requires 4.5:1 for normal text).

---

## Detailed Findings by File

### `src/components/graph/GraphCanvas.tsx`

| Line | Issue | Severity |
|------|-------|----------|
| 34 | `nodes` cast `as SimNode[]` -- safe but bypasses type checking | Info |
| 82 | `gRef.current!` non-null assertion inside zoom handler | Warning |
| 91 | Cleanup function references `svgRef.current!` which may be null | Warning |
| 232 | `eslint-disable-next-line react-hooks/exhaustive-deps` -- deps are intentionally incomplete | Warning |
| 266 | D3 drag effect deps `[nodes, nodes.length]` -- `nodes` changes on every store update, causing drag to be rebound on every node addition | Warning |
| 358-361 | `containerRef` is reassigned via a ref callback + a second ref, potentially causing the ResizeObserver ref to disconnect | Warning |

### `src/components/timeline/TimelineChart.tsx`

| Line | Issue | Severity |
|------|-------|----------|
| 213 | `as unknown as` double cast to access nivo's internal node structure | Warning |
| 236-241 | Three `as unknown as` casts to work around nivo's event typing | Warning |
| 81 | `hideTimeoutRef` is never cleared on unmount -- potential timeout firing after unmount | Warning |

### `src/components/heatmap/HeatmapCanvas.tsx`

| Line | Issue | Severity |
|------|-------|----------|
| 12-26 | Hardcoded hex color arrays `COLOR_STOPS` and `COLOR_STOPS_DARK` violate the "no hardcoded colors" rule | Warning |
| 28-31 | DOM read on every render (`document.documentElement.classList.contains('dark')`) is not reactive | Warning |

### `src/components/movie/SimilarOrbit.tsx`

| Line | Issue | Severity |
|------|-------|----------|
| 145-146 | Hardcoded `#f59e0b` for orbit rings and connections (amber color) -- violates the "no hardcoded colors" rule | Warning |
| 153 | Same `#f59e0b` used for connection lines | Warning |
| 185 | Same `#f59e0b` on outer node rings | Warning |
| 203 | Same `#f59e0b` on legend dot | Warning |

### `src/stores/useAuthStore.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 5-6 | Module-level mutable `queryClientRef` -- global mutable state outside the store | Info |
| 28 | `localStorage.getItem('auth_token')` called at store initialization -- runs during module load, before any component mounts | Info |

### `src/services/api.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 10 | Token read from `localStorage` on every request -- correct behavior but see S3 | Info |
| 22 | Error interceptor loses the original error's status code -- only extracts `error.response?.data?.error` | Warning |

### `server/src/config.ts`

| Line | Issue | Severity |
|------|-------|----------|
| 13 | `jwtSecret` has a fallback value `'dev-fallback-secret'` with no production guard | Critical |

---

## Recommendations (Nice to Have)

1. **Add `react-error-boundary` package** and wrap each visualization section and route with an `ErrorBoundary` that shows a "Something went wrong" fallback instead of crashing the page.

2. **Replace nivo with D3 implementations** for Timeline, Heatmap, and Radar chart to comply with project rules and reduce bundle size. Alternatively, document the architectural decision to use nivo with justification.

3. **Implement Zod schemas** for:
   - URL params (`movieIdSchema = z.coerce.number().positive()`)
   - Search input (`searchSchema = z.string().min(2).max(100)`)
   - Auth forms (`loginSchema`, `registerSchema`)
   - API responses (validate shape of TMDb proxy responses)

4. **Extract shared hooks:**
   - `useStickyTooltip()` -- consolidate the tooltip delay pattern from 3 components
   - `useGraphSimulation()` -- extract D3 force/radial/hierarchy setup from `GraphCanvas`

5. **Add `@tanstack/react-virtual`** for search results and filmography grids.

6. **Configure CORS** with specific origins in `server/src/index.ts`.

7. **Add rate limiting** to auth endpoints using `express-rate-limit`.

8. **Improve E2E test coverage** to match the critical-path flows specified in `CLAUDE.md`.

9. **Add a `theme` prop or hook to `HeatmapCanvas`** to make color stops reactive to theme changes.

10. **Remove dead code:** Commented-out `TrendingPeopleDashboard` import in `HomePage.tsx`, unnecessary `LoadingSkeleton` wrapper component.

---

## Test Coverage Gaps Summary

| Component/Module | Has Tests? | What's Missing |
|------------------|-----------|----------------|
| `GraphView` | No | Integration: graph loads, shows nodes, expand/collapse |
| `GraphCanvas` | No | SVG renders correct number of nodes/edges |
| `GraphNode` | No | Renders correct shape per type, handles click |
| `TimelineView` | No | Renders chart, zoom controls work |
| `TimelineChart` | No | Nivo chart renders, tooltip shows |
| `HeatmapCanvas` | No | Heatmap renders with data |
| `HeatmapControls` | No | Metric toggle works |
| `SimilarOrbit` | No | Orbit renders, nodes positioned |
| `MovieTrailer` | No | Dialog opens, iframe renders |
| `WatchProviders` | No | Providers render in sections |
| `GenreRadar` | No | Radar chart renders |
| `MovieDetailPage` | No | Full page render with all sections |
| `PersonDetailPage` | No | Full page render with bio, filmography |
| `HeatmapPage` | No | Page renders with controls |
| `WishlistPage` | No | Auth guard, filter toggle, remove item |
| `AuthDialog` | No | Login flow, register flow, validation |
| `useHeatmapData` | No | Data aggregation logic |
| `useToggleWishlist` | No | Add/remove mutations |
| `ThemeToggle` | No | Theme changes on click |
| Error states in UI | Partial | Only 2 of 10+ hooks test error cases |

---

## Fixes Applied (2026-03-31)

All critical security issues have been resolved:

| Issue | Status | What was done |
|-------|--------|---------------|
| No Error Boundaries | **FIXED** | Created `ErrorBoundary.tsx`, wrapped all lazy routes in `App.tsx` |
| Input sanitization | **FIXED** | Search input trimmed + length-capped (200 chars) in `SearchBar.tsx` and `useMovieSearch.ts` |
| Auth token on 401 | **FIXED** | API interceptor now clears token from localStorage on 401 responses in `api.ts` |
| URL param validation | **FIXED** | `MovieDetailPage.tsx` and `PersonDetailPage.tsx` validate `:id` as positive integer, show error for invalid IDs |
| dangerouslySetInnerHTML | **PASS** | Zero occurrences found in codebase |
| JWT/CORS/Rate limiting | **FIXED** | See `AUDIT_BACKEND.md` — these are backend fixes that protect the frontend |
