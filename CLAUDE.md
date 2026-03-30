# Movie Universe Explorer - Project Rules

## Project Overview
A data visualization app for exploring movie industry connections. Users search films/actors and explore data through Graph visualizations, Actor career timelines, Genre heatmaps, and a Trending Dashboard. Built with React, D3.js, Node.js/Express, and TMDb API.

---

## Tech Stack
- **Frontend:** React 18+ with TypeScript, Vite bundler
- **Visualization:** D3.js (low-level bindings, no wrapper libraries)
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand for app state, TanStack Query for server state
- **Backend:** Node.js with Express, TypeScript
- **API:** TMDb (The Movie Database) REST API
- **Testing:** Vitest (unit), Vitest + MSW + React Testing Library (integration), Playwright (e2e)
- **Validation:** Zod (shared schemas for frontend forms + backend request validation)
- **Linting:** ESLint + Prettier

---

## Code Standards

### General
- TypeScript strict mode everywhere — no `any` types, no `@ts-ignore`
- Prefer `const` over `let`, never use `var`
- Use named exports, not default exports
- One component per file, file name matches component name (PascalCase)
- Keep files under 200 lines — split when approaching this limit
- No unused imports, variables, or parameters — clean as you go
- Use absolute imports via path aliases (`@/components/...`, `@/hooks/...`)

### React
- Functional components only — no class components
- Custom hooks for any logic reused across 2+ components
- Memoize expensive computations with `useMemo`, not everything
- Use `useCallback` only when passing callbacks to memoized children
- Props interfaces defined above the component in the same file
- Destructure props in the function signature
- No prop drilling beyond 2 levels — use Zustand store or composition instead
- Keep components pure: no side effects in render, all side effects in `useEffect` or event handlers
- Prefer composition over configuration — small, focused components over mega-components with many props

### D3.js Visualization
- D3 handles data transforms and scales; React handles DOM rendering (no `d3.select` on React-managed DOM)
- Exception: D3 axes and brushes may directly manipulate DOM via `useRef`
- Each visualization is a self-contained component with its own hook for data preparation
- All visualizations must be responsive — use `ResizeObserver` via a shared `useResizeObserver` hook
- Animations via D3 transitions on initial mount; React state changes re-render without transition unless explicitly needed
- SVG for graphs and timelines, Canvas for heatmaps with large datasets
- Color palettes defined in a central theme file, consumed via helper functions (not hardcoded hex values)
- Always provide accessible alternatives: ARIA labels on SVG elements, keyboard navigation for interactive nodes

### State Management (Zustand + TanStack Query)
- **Server state** (API data, caching, loading/error states): TanStack Query — never manually manage fetch lifecycles
- **App state** (selected entity, active view, filters, search query): Zustand stores
- **Local UI state** (tooltips open, hover states): component-level useState
- Never duplicate server state into Zustand — if TanStack Query owns it, read it from the query cache
- Query keys follow the pattern: `['entity', identifier, params]` e.g. `['movie', movieId, { append: 'credits' }]`
- One store per domain: `useAppStore` (navigation/selection), `useGraphStore` (graph-specific UI state like zoom, expanded nodes)
- Use selectors to subscribe to specific slices: `useAppStore((s) => s.selectedEntity)` — never subscribe to the whole store
- Zustand actions are defined inside the store, not as external dispatchers
- Zustand can be read outside React (e.g., inside D3 force tick callbacks) via `useAppStore.getState()`

### Validation (Zod)
- Define all schemas in `src/schemas/` — shared between frontend forms and backend validation
- Every user input (search, filters, URL params) must be validated through a Zod schema before triggering an API call
- Use `z.infer<typeof schema>` to derive TypeScript types from schemas — single source of truth, no manual type duplication
- Form validation errors extracted from `ZodError.flatten()` and displayed inline next to the relevant field
- Backend reuses the same schemas via a shared package or copy — validation runs on both sides
- Schema naming: `searchSchema`, `discoverFiltersSchema`, `movieIdSchema` — always suffixed with `Schema`

### API & Backend
- Backend is a thin proxy — it adds the TMDb API key and reshapes responses, nothing more
- All TMDb API calls go through the backend — never expose the API key to the client
- Backend endpoints mirror the frontend's data needs, not TMDb's API shape
- Rate limiting: respect TMDb's 40 requests/10 seconds — implement a request queue on the backend
- Cache TMDb responses in-memory (node-cache) with 1-hour TTL for detail endpoints, 15-min for trending/search
- API errors return consistent shape: `{ error: string, code: number }`
- Backend validates all incoming requests with the same Zod schemas used on the frontend

### File Naming
- Components: `PascalCase.tsx` (e.g., `MovieGraph.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (e.g., `useMovieSearch.ts`)
- Utilities: `camelCase.ts` (e.g., `formatRuntime.ts`)
- Types: `camelCase.types.ts` (e.g., `movie.types.ts`)
- Constants: `UPPER_SNAKE_CASE` inside `camelCase.ts` files
- Test files: colocated as `ComponentName.test.tsx`

### Design System & UI Quality
This app targets a premium, modern UI — as if designed by a senior UI designer. Every screen, component, and interaction must feel polished, intentional, and consistent.

**Visual identity:**
- Clean, spacious layouts with generous whitespace — never cramped
- Subtle depth via layered surfaces: cards float over backgrounds with soft shadows and/or borders
- Smooth micro-interactions: hover states, focus rings, transitions on every interactive element (150–300ms ease)
- Rounded corners consistently applied (`rounded-lg` for cards/panels, `rounded-full` for avatars/badges)
- Typography hierarchy: clear distinction between headings, body, captions, labels — use font-weight and size, not just size
- Icons: use Lucide React for a consistent, modern icon set — no mixing icon libraries

**Light/Dark theme:**
- Implemented via Tailwind `dark:` variant with `class` strategy on `<html>`
- User preference stored in `useAppStore` (Zustand) as `theme: 'light' | 'dark' | 'system'`
- On mount, resolve `'system'` via `matchMedia('(prefers-color-scheme: dark)')` and listen for changes
- Toggle component in Header — animated icon transition (sun ↔ moon)
- Every component must support both themes — never hardcode a color that only works on one background
- D3 visualizations consume theme-aware colors from `src/utils/theme.ts` which reads the current resolved theme

**Color palette (defined in Tailwind theme + CSS variables):**
- Surfaces: light mode uses white/gray-50/gray-100 layers; dark mode uses gray-950/gray-900/gray-800 layers
- Primary accent: indigo-500 (interactive elements, active states, links)
- Secondary accent: violet-500 (visualization highlights, graph connections)
- Success/Warning/Error: emerald-500 / amber-500 / rose-500
- Text: gray-900/gray-700/gray-500 in light; gray-50/gray-300/gray-500 in dark
- All colors referenced via CSS custom properties so D3/Canvas can read them at runtime

**Consistency rules:**
- Spacing scale: 4px base (Tailwind default) — use `p-4`, `gap-6`, `mb-8`, etc. consistently; avoid arbitrary values like `p-[13px]`
- Border radius: `rounded-lg` (8px) for containers, `rounded-xl` (12px) for modals/large cards, `rounded-full` for pills/avatars
- Shadow scale: `shadow-sm` for subtle cards, `shadow-md` for elevated panels, `shadow-lg` for modals/dropdowns
- Transitions: `transition-colors duration-200` on all interactive elements; `transition-all duration-300` for layout shifts
- Cursor: `cursor-pointer` on all clickable elements (buttons, toggles, selects, links) — enforced globally in `global.css` base layer
- Focus states: `outline-2 outline-offset-2 outline-primary` on all focusable elements — enforced globally in `global.css` base layer, never remove or override with `outline-none`
- Disabled states: `opacity-50 cursor-not-allowed` — consistent across buttons, inputs, links
- Loading states: skeleton shimmer animation (not spinners) matching the shape of the content being loaded

### shadcn/ui Components
- All UI primitives (Button, Input, Card, Badge, Skeleton, Tabs, Tooltip, ScrollArea, Dialog, Sheet, Toggle, ToggleGroup) come from `src/components/ui/` — ALWAYS use them, NEVER use raw HTML elements (`<button>`, `<input>`, `<select>`) in feature components
- If a shadcn component doesn't support a use case, add a new `variant` to that component (e.g., Input has `default` and `ghost` variants) — do NOT bypass it with a raw element
- All interactive behavior (cursor-pointer, focus outlines, disabled states) is defined inside these components — NEVER override or duplicate these styles in feature components
- `cn()` from `@/lib/utils` is the only class merging utility — no other `cn` or `clsx` wrapper

### Colors — STRICT RULES
- **NEVER hardcode color values** in components. No `bg-black`, `text-white`, `bg-gray-*`, `border-gray-*`, `text-gray-*`, `bg-indigo-*`, etc.
- **ALWAYS use CSS variable-based semantic tokens**: `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `bg-muted`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`, `bg-secondary`, `text-secondary-foreground`, `bg-accent`, `text-accent-foreground`, `bg-popover`, `text-popover-foreground`, `bg-destructive`, `text-destructive`, `border-border`, `border-input`, `ring-ring`, `bg-overlay`, `text-overlay-foreground`
- These tokens are defined in `global.css` under `:root` (light) and `.dark` (dark) — they auto-switch on theme change
- If you need a new semantic color (e.g., for a new surface type), add it to BOTH `:root` and `.dark` in `global.css` and register it in `@theme inline` — never use raw oklch/hex/rgb values in components
- The ONLY exception for non-variable colors: brand-specific accent on visualization elements (e.g., `fill-amber-400` for star rating icons) where the color is intentionally the same in both themes
- For elements overlaying images (badges, tooltips on posters): use `bg-overlay text-overlay-foreground`

### Tailwind CSS
- Use Tailwind utility classes directly in JSX — no separate CSS files per component
- Extract repeated class combinations into component variants (shadcn CVA pattern), not `@apply`
- Use `@apply` only in `global.css` for base element styles (e.g., body, scrollbar)
- Custom theme values (colors, spacing, fonts) defined via `@theme` in `global.css` and CSS custom properties
- Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`) — mobile-first approach
- For D3/SVG elements that Tailwind can't style: read CSS custom properties via `getComputedStyle()` in `src/utils/theme.ts`
- Dark mode via Tailwind `dark:` variant with class strategy on `<html>` element
- No `!important` ever
- Keep class strings readable — break long className onto multiple lines

### Testing — Three Levels

**Unit tests (Vitest)**
- Test pure logic in isolation: data transforms, Zod schemas, formatters, D3 scale configs
- No DOM, no components, no network — fast and deterministic
- Colocated as `*.test.ts` next to the source file
- All data transformation utilities and Zod schemas must have unit tests

**Integration tests (Vitest + React Testing Library + MSW)**
- Test components with their hooks, stores, and mocked API responses working together
- MSW intercepts network calls — no mocking fetch/axios directly
- Hooks: test via `renderHook` with real Zustand stores and QueryClient
- Each visualization component: test that correct SVG/Canvas elements render for given data
- Colocated as `*.test.tsx` next to the component

**E2E tests (Playwright)**
- Test full user journeys through the real app (dev server + backend with MSW at network level)
- Live in `e2e/` folder at project root, not inside `src/`
- Core flows that must be covered:
  - Search → select result → graph renders with correct nodes
  - Graph node click → navigation → new entity loads
  - View switching (graph → timeline → heatmap) preserves selected entity
  - Timeline renders for an actor with correct chronological order
  - Heatmap displays and responds to hover/click
  - Trending dashboard loads and filters by day/week
- Use Playwright's visual comparison (`toHaveScreenshot()`) for D3 visualization regression testing
- Tag critical-path tests with `@core` for CI gating

**General testing rules**
- Test behavior, not implementation — never test internal state or private methods
- No `any` in test files — test types must be as strict as production code
- Prefer `getByRole` and `getByText` over `getByTestId` — test what the user sees

### Error Handling
- All API calls wrapped in try/catch at the hook level
- Display user-friendly error messages — never show raw API errors in UI
- Use Error Boundaries around each visualization panel (one failing chart shouldn't break the page)
- Loading skeletons for all async content — no empty white spaces while loading

### Performance
- Lazy load visualization components with `React.lazy` + `Suspense`
- Debounce search input (300ms)
- Virtualize long lists (cast lists, search results) with `@tanstack/react-virtual`
- D3 force simulations: stop on unmount, limit node count to prevent jank
- Images: use TMDb image CDN sizes appropriately (w185 for thumbnails, w500 for cards, original only in modals)

### Git
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- One logical change per commit
- Branch naming: `feat/graph-visualization`, `fix/search-debounce`

---

## Do NOT
- Install wrapper libraries over D3 (no recharts, nivo, victory, visx)
- Use Redux, MobX, or Jotai — Zustand is the chosen state manager
- Put TMDb API key in frontend code or commit it to git
- Use `dangerouslySetInnerHTML`
- Use inline styles (use Tailwind classes) — exception: D3/SVG dynamic positioning
- Use raw HTML elements (`<button>`, `<input>`, `<select>`) — ALWAYS use shadcn components from `src/components/ui/`
- Hardcode colors (`bg-black`, `text-white`, `bg-gray-*`, `text-gray-*`, etc.) — ALWAYS use CSS variable tokens (`bg-background`, `text-foreground`, `bg-primary`, etc.)
- Override focus/cursor/disabled styles from shadcn components in feature components — these are defined once in `src/components/ui/` and must not be duplicated
- Create barrel files (index.ts re-exports) — import directly from source
- Add comments that restate what the code does — only comment *why* when non-obvious