# 🎬 Movie Universe Explorer
## Hackathon Demo Presentation

---

## 1. THE PROBLEM (30 sec)

### Ever tried to explore connections in cinema?

- **IMDb** shows you a movie page. That's it. Dead end.
- **Want to know** which actors keep working with the same directors?
- **Want to see** how an actor's career evolved over decades?
- **Want to discover** which genres dominated each era?

> **There's no tool that lets you visually *explore* the movie universe as a connected, living graph.**

### Our solution: **Movie Universe Explorer**
A data visualization platform that turns the movie industry into an **interactive, explorable universe** — graphs, timelines, heatmaps, and more.

---

## 2. THE FIRST PROMPT (30 sec)

### It all started with a CLAUDE.md file

We didn't write code first. We wrote **rules**.

**CLAUDE.md** = 400+ lines defining:
- Tech stack decisions (React 18+, D3.js, Zustand, TanStack Query)
- Code standards (TypeScript strict, no `any`, no `@ts-ignore`)
- Design system (violet cinematic theme, glassmorphism, micro-interactions)
- Color rules (NEVER hardcode — always CSS variable tokens)
- Testing strategy (3 tiers: unit → integration → E2E)
- Component rules (shadcn/ui only, no raw HTML elements)

> **The AI didn't just write code — it followed a strict architectural vision from day one.**

### The PRD was the visualization concept:
- **Connection Graph** — D3 force simulation showing movie↔person relationships
- **Career Timeline** — Actor's work across decades with genre coloring
- **Genre Heatmap** — Genre × decade performance matrix
- **Trending Dashboard** — Real-time popular movies from TMDb API

---

## 3. THE BUILD MONTAGE (60 sec)

### 26 commits. One coherent product. Here's how it happened:

```
Commit 1-2:  Project scaffold + architecture docs
Commit 3:    Cinematic UI — violet palette, glassmorphism, glow effects
Commit 4:    shadcn/ui component library integration
Commit 5-6:  Home page with search, trending, Express backend proxy
Commit 7-10: Connection graph — D3 force simulation, expand/collapse, drag, zoom
Commit 11:   Movie & person detail pages with routing
Commit 12:   Career timeline — D3 brush zoom, genre colors, interactive tooltips
Commit 13:   Genre heatmap — decade × genre visualization
Commit 14:   Genre radar — spider chart for actor genre analysis
Commit 15:   Where to watch — streaming provider cards
Commit 16:   Movie trailers — YouTube embed modal
Commit 17:   Similar movies — orbital visualization
Commit 18:   Docker Compose — PostgreSQL, JWT auth, 5 seed users
Commit 19:   Wishlist — per-user storage, toggle buttons
Commit 20-22: 335 unit + integration tests (5 parallel QA agents)
Commit 23-26: Playwright E2E tests with demo mode
```

### Key AI techniques used:

- **Agent teams** — Deployed 5 parallel QA specialists + 1 architect reviewer
- **Worktree isolation** — Each agent worked in its own git worktree
- **CLAUDE.md as constitution** — Every line of code followed the rules
- **Iterative refinement** — "Fix the tooltip" → "Make it sticky" → "Add genre colors"

### The numbers:

| Metric | Count |
|--------|-------|
| Source files | 94 |
| Lines of code | 7,000+ |
| React components | 44 |
| Custom hooks | 16 |
| Backend routes | 9 |
| Zustand stores | 3 |
| shadcn/ui components | 13 |
| Test files | 35 |
| Total tests | 345 (unit + integration + E2E) |
| Technologies | 30+ packages |

---

## 4. THE LIVE DEMO (90 sec)

### Demo script (run: `npm run test:e2e:demo`)

The E2E tests ARE the demo — they run in a visible browser, one at a time, with slow motion:

**Scene 1: Home page**
- Hero section with cinematic gradient background
- Trending movies load from TMDb API in real-time

**Scene 2: Search → Movie Detail**
- Type "Fight Club" → results appear with posters, ratings, badges
- Click → full movie page: backdrop, cast, where to watch, similar movies orbit

**Scene 3: Search → Person Detail**
- Type "Brad Pitt" → navigate to actor page
- Career timeline, genre radar, connection graph, filmography

**Scene 4: No results**
- Type gibberish → graceful "No results found" state

**Scene 5: Heatmap exploration**
- Navigate to genre heatmap → decade × genre performance matrix
- Navigate back home via logo

**Scene 6: Direct navigation**
- Movie detail page (Fight Club) → cast section
- Person detail page (Brad Pitt) → biography

**Scene 7: Auth gate**
- Wishlist page → "Sign in to view your lists"

### Also demo manually:
- 🌓 **Toggle dark/light theme** — entire app transforms
- 🔍 **Expand a graph node** — D3 force simulation in action
- 📱 **Resize browser** — fully responsive

---

## 5. LESSONS LEARNED (60 sec)

### What surprised us:

**1. CLAUDE.md is the most important file in the repo**
> Writing rules BEFORE code meant every feature was consistent from day one. The AI never hardcoded a color, never used a raw `<button>`, never skipped TypeScript strict mode — because the rules said so.

**2. Parallel agents are a game-changer for testing**
> We deployed 5 QA specialists simultaneously, each covering a different area. 335 tests written and verified in one pass. One architect agent reviewed everything after.

**3. The hardest bugs were visual, not logical**
> "Tooltip gets clipped by overflow-hidden" and "dropdown hides behind the hero section" took more iterations than building the D3 force graph from scratch.

**4. D3 + React = careful boundaries**
> The CLAUDE.md rule "D3 handles data transforms and scales; React handles DOM rendering" prevented the most common D3+React footgun. Exception: axes and brushes get direct DOM access via `useRef`.

**5. TMDb API has adult content in trending people**
> Discovered during testing. Fixed with `include_adult=false` globally + server-side `adult !== true` filter. Real-world edge case caught by actually using the product.

### What we'd do differently:
- Start with E2E tests earlier — they caught UI issues unit tests never would
- Add TV show support (TMDb has the full API, we only used movies)
- Implement the Discover/Browse page (backend route exists, no UI yet)

---

## TECH STACK AT A GLANCE

```
Frontend:  React 19 · TypeScript · Vite · Tailwind CSS 4 · Zustand · TanStack Query
Viz:       D3.js · Nivo (heatmap, radar, scatterplot)
UI:        shadcn/ui · Lucide icons · Glassmorphism design system
Backend:   Node.js · Express 5 · PostgreSQL · JWT auth
API:       TMDb (The Movie Database) REST API
Testing:   Vitest (335 tests) · Playwright E2E (10 scenarios)
Infra:     Docker Compose · 3 containers (frontend, backend, db)
```

---

## COMMANDS FOR DEMO

```bash
# Start the app
docker compose up --build -d

# Run unit + integration tests (335 tests)
npm test                    # frontend (238 tests)
cd server && npm test       # server (97 tests)

# Run E2E demo (visible browser, slow motion, single session)
npm run test:e2e:demo

# Run E2E fast (headless)
npm run test:e2e
```

---

> **Movie Universe Explorer** — From CLAUDE.md to production in 26 commits.
