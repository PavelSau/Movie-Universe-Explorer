# Backend Audit Report -- Movie Universe Explorer

**Date:** 2026-03-31
**Auditor:** Senior Backend Architect
**Scope:** All files under `server/src/`, database schema, Docker configuration, and test suite
**Branch:** `dev`

---

## Summary

| Category                    | Verdict      | Notes                                                                 |
|-----------------------------|--------------|-----------------------------------------------------------------------|
| Code Quality & Architecture | **PASS**     | Clean proxy pattern, good separation, minor duplication               |
| Security                    | **PASS** (fixed) | JWT secret enforced, rate limiting added, CORS restricted, input validation via Zod |
| Performance                 | **PASS**     | Caching is solid, minor improvements possible                         |
| Testing                     | **PASS**     | Good route coverage, but some gaps in security and edge case testing  |
| Database & Data             | **PASS**     | Parameterized queries, proper indexing, minor schema improvements     |

---

## 1. Code Quality & Architecture

### What's Good

- **Clean TMDb proxy pattern.** Each route file does one thing: receives a request, calls TMDb via the shared axios client (`server/src/services/tmdb.ts`), reshapes snake_case to camelCase, and returns. The backend never exposes the TMDb API key to the client.
- **Consistent error delegation.** Every route handler wraps its logic in try/catch and calls `next(err)`, letting the centralized `errorHandler` middleware handle all errors uniformly.
- **Express 5 usage.** The project uses Express 5.2.1 (`server/package.json` line 18), which is the current major version. Route handlers correctly return `void` (no `return res.json(...)` chaining issues).
- **TypeScript strict mode enabled.** `server/tsconfig.json` has `"strict": true`, `"noUnusedLocals": true`, and `"noUnusedParameters": true`.
- **No `any` types in production code.** All source files under `server/src/` (excluding tests) use `Record<string, unknown>` for TMDb response mapping, which is acceptable given TMDb's untyped responses. The test files do use `any` via `eslint-disable` comments, which is a reasonable tradeoff for accessing Express router internals.
- **Good separation of concerns.** Routes, middleware, services, and config are properly separated into their own files and directories.

### Issues

**W-01: Response mapping duplication across routes.**
The pattern of mapping TMDb fields from snake_case to camelCase is repeated in every route handler. For example, the `similar` and `recommendations` handlers in `server/src/routes/movie.routes.ts` (lines 108-115 and 129-135) have identical mapping logic. A shared `mapMovieSummary()` utility would reduce duplication.

**W-02: No shared TypeScript interfaces for TMDb responses.**
Every route uses inline `Record<string, unknown>` type annotations (e.g., `server/src/routes/movie.routes.ts` lines 28, 50, 64, 86, 109, 129; `server/src/routes/person.routes.ts` lines 36, 44, 58, 63, etc.). This means there's no compile-time safety on the TMDb response shape. Defining interfaces like `TmdbMovieResult`, `TmdbPersonResult`, etc. would catch mapping errors at compile time.

**W-03: `GET /me` route duplicates auth logic instead of using `requireAuth` middleware.**
`server/src/routes/auth.routes.ts` lines 101-131 manually re-implements the Bearer token extraction and JWT verification that already exists in `server/src/middleware/auth.ts`. This should use `requireAuth` middleware and read `req.userId` to look up the user.

**W-04: `express.json()` has no body size limit configured.**
`server/src/index.ts` line 18 calls `app.use(express.json())` without specifying a `limit` option. Express defaults to 100kb, which is reasonable, but explicitly setting it (e.g., `express.json({ limit: '10kb' })`) would be a defense-in-depth measure since request bodies in this app are tiny (login credentials, wishlist items).

---

## 2. Security Review

### CRITICAL Issues

**C-01: Hardcoded weak JWT secret in docker-compose.yml and .env.example.**
- `docker-compose.yml` line 33: `JWT_SECRET: movie-explorer-jwt-secret-2024`
- `.env.example` line 10: `JWT_SECRET=movie-explorer-jwt-secret-2024`
- `server/src/config.ts` line 13: fallback is `'dev-fallback-secret'`

The JWT secret is a short, guessable, human-readable string. An attacker who reads the docker-compose file or guesses the pattern can forge arbitrary JWT tokens and impersonate any user. The fallback secret in config.ts means the server will silently start with a trivially weak secret if the environment variable is missing.

**Fix:** Generate a cryptographically random secret (at least 256 bits / 32 bytes). In `config.ts`, fail hard if `JWT_SECRET` is not set (same pattern as `TMDB_API_KEY` on line 16-19). Remove the fallback string entirely.

**C-02: No rate limiting on any endpoint.**
There is no rate limiting middleware anywhere in the codebase. This creates two problems:
1. **Auth brute-force:** An attacker can attempt unlimited login requests against `POST /api/auth/login`, making password brute-forcing trivial.
2. **TMDb API abuse:** TMDb allows 40 requests per 10 seconds. Without a server-side request queue or rate limiter, a burst of client requests could exhaust the TMDb quota, causing cascading 429 errors.

**Fix:** Add `express-rate-limit` for general API rate limiting (e.g., 100 req/min per IP). Add a stricter limiter for auth endpoints (e.g., 5 req/min per IP). Implement a TMDb request queue (e.g., `bottleneck` or `p-queue`) to respect the 40 req/10s limit.

**C-03: CORS is completely open.**
`server/src/index.ts` line 17: `app.use(cors())` with no configuration. This allows any origin to make requests to the API, including reading response data. In production, this means any website can make authenticated API calls on behalf of a logged-in user if cookies were used (though JWT in headers mitigates CSRF specifically).

**Fix:** Configure CORS with explicit allowed origins: `cors({ origin: ['http://localhost:5173', process.env.FRONTEND_URL] })`.

**C-04: No validation on route parameter `:id` (path traversal / injection).**
Multiple routes accept `:id` as a path parameter and directly interpolate it into TMDb API URLs:
- `server/src/routes/movie.routes.ts` line 9: `` `/movie/${id}` ``
- `server/src/routes/person.routes.ts` line 9: `` `/person/${id}` ``
- `server/src/routes/providers.routes.ts` line 9: `` `/movie/${id}/watch/providers` ``

While TMDb will likely return 404 for non-numeric IDs, there is no validation that `id` is a positive integer. A malformed `id` like `550/../../configuration` could theoretically cause unexpected TMDb API calls. Axios URL encoding likely prevents actual path traversal, but explicit validation is defense-in-depth.

**Fix:** Validate `:id` as a positive integer at the start of each route handler: `const id = Number(req.params.id); if (!Number.isInteger(id) || id <= 0) { return res.status(400).json({...}) }`.

### Warnings

**S-01: Seed users all share the same password (`password123`).**
`server/db/seed.sql` lines 2-7 seed 5 users with identical bcrypt hashes for `password123`. If this data persists into any staging/production environment, it's a trivially exploitable credential.

**Fix:** Add a comment that seed data is dev-only. Better: use a Docker entrypoint script that only runs seed.sql when `NODE_ENV=development`.

**S-02: No password complexity enforcement beyond length.**
`server/src/routes/auth.routes.ts` line 64 only checks `password.length < 6`. There's no check for common passwords, mixed case, numbers, or special characters.

**S-03: No username sanitization.**
`server/src/routes/auth.routes.ts` lines 57-67 validate username length (3+ chars) but don't restrict characters. Usernames could contain HTML, SQL keywords, or control characters. While parameterized queries prevent SQL injection, storing raw HTML in the database could lead to XSS if the display name is ever rendered unsafely.

**S-04: Missing `DATABASE_URL` does not cause a hard failure.**
`server/src/config.ts` line 12: `databaseUrl: process.env.DATABASE_URL || ''`. If `DATABASE_URL` is missing, the server starts but will crash on the first database query with an unhelpful error. The TMDb key gets a hard exit (line 16-19), but the database URL does not.

**Fix:** Add the same exit-on-missing pattern for `DATABASE_URL` and `JWT_SECRET`.

**S-05: Error handler does not log stack traces to a structured logger.**
`server/src/middleware/errorHandler.ts` line 5 only logs `err.message`. In production, the full stack trace would be valuable for debugging. The current approach is safe (no stack traces leak to the client), but server-side logging should include the full error.

---

## 3. Performance Review

### What's Good

- **Caching strategy is well-structured.** Cache TTLs are appropriate:
  - Search and trending: 900s (15 min) -- `server/src/routes/search.routes.ts` line 7, `server/src/routes/trending.routes.ts` lines 7, 32
  - Movie details, credits, videos, similar, recommendations: 3600s (1 hour) -- `server/src/routes/movie.routes.ts` lines 7, 44, 79, 103, 123
  - Person details and credits: 3600s (1 hour) -- `server/src/routes/person.routes.ts` lines 7, 29
  - Genres: 86400s (24 hours) -- `server/src/routes/genres.routes.ts` line 7
  - Providers: 3600s (1 hour) -- `server/src/routes/providers.routes.ts` line 7
- **Response payloads are lean.** Each route maps only the fields the frontend needs, stripping TMDb's verbose responses. `similar` and `recommendations` are capped at 10 results (`server/src/routes/movie.routes.ts` lines 108, 128).
- **Database queries are simple and indexed.** The wishlist queries use the `idx_wishlists_user` index and the unique constraint index. No N+1 patterns.
- **Connection pooling is used.** `server/src/services/db.ts` uses `pg.Pool`, which is the correct pattern for PostgreSQL connection management.

### Issues

**P-01: In-memory cache does not scale across multiple server instances.**
`server/src/middleware/cache.ts` uses `node-cache`, which is process-local. If the backend is scaled to multiple instances (e.g., behind a load balancer), each instance maintains its own cache, leading to cache misses and redundant TMDb API calls. This is acceptable for a single-instance deployment but won't scale.

**Fix for scale:** Replace `node-cache` with Redis for shared caching when scaling horizontally.

**P-02: No cache invalidation or max-size limit.**
The `NodeCache` instance on `server/src/middleware/cache.ts` line 4 is created with default options -- no `maxKeys` limit. Over time, the cache will grow unbounded in memory. For a small app this is unlikely to be a problem, but setting `maxKeys: 10000` or similar would add a safety net.

**P-03: Person credits endpoint returns unbounded results.**
`server/src/routes/person.routes.ts` lines 34-77 return ALL cast and crew credits for a person after deduplication. Prolific actors could have hundreds of credits. Unlike `similar`/`recommendations` which are capped at 10, this endpoint has no limit.

**Fix:** Consider adding pagination or a reasonable cap (e.g., top 50 by popularity).

**P-04: `pg.Pool` has no configuration.**
`server/src/services/db.ts` line 4 creates the pool with only the `connectionString`. Default pool size is 10 connections. For this app, defaults are fine, but explicitly setting `max`, `idleTimeoutMillis`, and `connectionTimeoutMillis` would make the behavior predictable and observable.

---

## 4. Testing Coverage Assessment

### What's Covered

| File                             | Tests | Verdict     |
|----------------------------------|-------|-------------|
| `middleware/auth.test.ts`        | 5     | Good -- covers no header, wrong scheme, invalid token, valid token, token extraction |
| `middleware/errorHandler.test.ts`| 7     | Good -- covers AxiosError (no status, 404, 429), generic Error, response shape, logging |
| `middleware/cache.test.ts`       | 6     | Good -- covers miss, hit, storage, isolation, second-request caching |
| `routes/auth.routes.test.ts`    | 12    | Good -- covers login (400, 401 x2, success, DB error), register (400 x3, 409, 201, DB error), /me (401 x3, success) |
| `routes/wishlist.routes.test.ts` | 9    | Good -- covers GET (items, empty), GET /check (true, false, 400 x2), POST (400, invalid type, 201, duplicate), DELETE (400, success) |
| `routes/search.routes.test.ts`  | 7     | Good -- covers 400 (missing, empty, whitespace), filtering, mapping, person path, error |
| `routes/trending.routes.test.ts`| 7     | Good -- covers day default, week, invalid fallback, mapping, error, people filtering, people mapping |
| `routes/movie.routes.test.ts`   | 10    | Good -- covers /:id mapping and defaults, credits filtering and mapping, videos filtering, similar limit and mapping, recommendations limit and mapping |
| `routes/person.routes.test.ts`  | 8     | Good -- covers /:id mapping and null defaults, credits dedup, mapping, sort, crew dedup, TV fallback, error |
| `routes/providers.routes.test.ts`| 5    | Good -- covers US providers, no US, empty results, null logo, error |
| `routes/genres.routes.test.ts`  | 4     | Adequate -- covers shape, endpoint, empty, error |
| `routes/discover.routes.test.ts`| 6     | Good -- covers mapping, defaults, genre filter, date range, custom sort/page, error |

**Total test count: ~86 test cases across 12 test files.**

### Test Coverage Gaps

**T-01: No test for malformed `:id` parameters.**
No test verifies what happens when `req.params.id` is a non-numeric string (e.g., `"abc"`, `"1;DROP TABLE"`, `"../../../etc/passwd"`). This is relevant to security finding C-04.

**T-02: No integration test for the full middleware chain on TMDb routes.**
The TMDb route tests extract the final handler and call it directly, bypassing the cache middleware. While the cache middleware is tested separately, there's no test confirming the middleware and route handler work together correctly (e.g., that cached responses don't bypass response mapping).

**T-03: No test for `POST /api/auth/register` with SQL injection payloads.**
While parameterized queries prevent SQL injection, there's no test confirming that usernames containing SQL keywords (e.g., `"admin'; DROP TABLE users; --"`) are handled safely.

**T-04: No test for expired JWT tokens specifically.**
`auth.test.ts` tests an "invalid token" (generic `jwt.verify` throw), but doesn't specifically test an expired token (`TokenExpiredError`), which has a different error class in jsonwebtoken.

**T-05: No test for `wishlist DELETE /` when the entity doesn't exist.**
The test at `wishlist.routes.test.ts` line 268 mocks `{ rows: [] }` but doesn't verify the response status code (it passes silently, returning 200 with "Removed from wishlist" even if nothing was deleted). This is a design decision to test -- should it return 404?

**T-06: No test for concurrent requests / race conditions.**
The `POST /api/wishlist` route relies on `ON CONFLICT DO NOTHING` for idempotency, but there's no test confirming this handles concurrent duplicate inserts correctly.

**T-07: No tests for the `db.ts` pool error handler.**
`server/src/services/db.ts` line 8-10 has a `pool.on('error')` handler that logs and does nothing else. There's no test confirming the server remains stable after a database connection error.

**T-08: No tests for `config.ts` validation.**
The TMDb API key validation logic (`server/src/config.ts` lines 16-19) is not tested. If `process.exit` is called, it should be tested (or at least documented that it's untestable without mocking).

---

## 5. Database & Data

### What's Good

- **All queries are parameterized.** Every `pool.query()` call uses `$1`, `$2`, etc. placeholders:
  - `server/src/routes/auth.routes.ts` lines 19, 69, 76-78, 112-113
  - `server/src/routes/wishlist.routes.ts` lines 23, 50-51, 77-80, 113-114

  There are zero string concatenation or template literal SQL queries with user input. SQL injection is not possible through these queries.

- **Proper indexing.** `server/db/init.sql` line 21 creates `idx_wishlists_user` on `wishlists(user_id)`, which covers the most common query pattern (fetching a user's wishlist). The `UNIQUE(user_id, entity_type, entity_id)` constraint on line 17 automatically creates an index that supports the check/delete queries.

- **Referential integrity.** `user_id` has a foreign key to `users(id)` with `ON DELETE CASCADE` (`server/db/init.sql` line 11), ensuring wishlist items are cleaned up when a user is deleted.

- **CHECK constraint on entity_type.** `server/db/init.sql` line 12: `CHECK (entity_type IN ('movie', 'person'))` provides database-level validation in addition to the application-level check.

- **Upsert handling.** `server/src/routes/wishlist.routes.ts` line 79 uses `ON CONFLICT ... DO NOTHING`, preventing duplicate wishlist entries at the database level.

### Issues

**D-01: Dynamic query construction in `GET /api/wishlist`.**
`server/src/routes/wishlist.routes.ts` lines 14-20 build a SQL query string dynamically:
```typescript
let query = 'SELECT ... FROM wishlists WHERE user_id = $1'
if (type === 'movie' || type === 'person') {
  query += ' AND entity_type = $2'
  params.push(type)
}
query += ' ORDER BY created_at DESC'
```
While the `type` value is validated against `'movie'` or `'person'` before being used (so it's safe), the pattern of building SQL strings with `+=` is fragile. A future developer could accidentally introduce an injection by appending an unvalidated value.

**Fix:** Consider using a query builder or at minimum adding a comment explaining why this dynamic query is safe.

**D-02: No `created_at` index on wishlists.**
The `GET /api/wishlist` endpoint orders by `created_at DESC` (`server/src/routes/wishlist.routes.ts` line 22). For users with many wishlist items, this query will need to sort. A composite index on `(user_id, created_at DESC)` would make this efficient.

**D-03: `entity_id` is not validated as positive integer before DB write.**
`server/src/routes/wishlist.routes.ts` line 81 passes `entityId` directly from `req.body` to the query. If a client sends `entityId: -1` or `entityId: 0`, it will be stored. Add validation: `Number.isInteger(entityId) && entityId > 0`.

**D-04: `poster_path` and `title` are not length-validated before DB write.**
`server/src/routes/wishlist.routes.ts` lines 76-82 insert `title` (VARCHAR 255) and `poster_path` (VARCHAR 255) from request body without length checks. A malicious client could send a title longer than 255 characters, causing a database error that would surface as a generic 500.

---

## Critical Issues (Must Fix)

| ID   | Severity | File                              | Line(s)  | Issue                                           |
|------|----------|-----------------------------------|----------|--------------------------------------------------|
| C-01 | CRITICAL | `config.ts`                       | 13       | JWT secret has weak fallback; not validated       |
| C-01 | CRITICAL | `docker-compose.yml`              | 33       | Hardcoded weak JWT secret                         |
| C-02 | CRITICAL | `index.ts`                        | --       | No rate limiting on any endpoint                  |
| C-03 | HIGH     | `index.ts`                        | 17       | CORS allows all origins                           |
| C-04 | HIGH     | `movie.routes.ts`, `person.routes.ts`, `providers.routes.ts` | 9, 9, 9  | No `:id` param validation |

## Warnings (Should Fix)

| ID   | Severity | File                              | Line(s)  | Issue                                           |
|------|----------|-----------------------------------|----------|--------------------------------------------------|
| S-01 | MEDIUM   | `seed.sql`                        | 1-8      | All seed users share `password123`                |
| S-02 | MEDIUM   | `auth.routes.ts`                  | 64       | Weak password policy (length only)                |
| S-03 | LOW      | `auth.routes.ts`                  | 57       | No username character validation                  |
| S-04 | MEDIUM   | `config.ts`                       | 12       | Missing `DATABASE_URL` silently accepted          |
| S-05 | LOW      | `errorHandler.ts`                 | 5        | No full stack trace in server logs                |
| W-01 | LOW      | `movie.routes.ts`                 | 108, 129 | Duplicated response mapping logic                 |
| W-02 | LOW      | Multiple route files              | --       | No shared TMDb response interfaces                |
| W-03 | MEDIUM   | `auth.routes.ts`                  | 101-131  | `/me` duplicates auth logic                       |
| W-04 | LOW      | `index.ts`                        | 18       | No explicit body size limit                       |
| D-01 | LOW      | `wishlist.routes.ts`              | 14-20    | Dynamic SQL construction pattern                  |
| D-02 | LOW      | `init.sql`                        | --       | Missing composite index for wishlist ordering     |
| D-03 | MEDIUM   | `wishlist.routes.ts`              | 81       | `entityId` not validated as positive integer      |
| D-04 | LOW      | `wishlist.routes.ts`              | 76-82    | No length validation on title/poster_path         |
| P-03 | LOW      | `person.routes.ts`                | 34-77    | Unbounded person credits response                 |

## Recommendations (Nice to Have)

| ID   | File                              | Recommendation                                   |
|------|-----------------------------------|--------------------------------------------------|
| R-01 | All route files                   | Use Zod schemas for request validation (package is installed but unused) |
| R-02 | `services/tmdb.ts`                | Add axios request interceptor for TMDb rate limiting / retry on 429 |
| R-03 | `middleware/cache.ts`             | Add `maxKeys` limit to NodeCache to prevent unbounded memory growth |
| R-04 | `services/db.ts`                  | Explicitly configure pool options (`max`, `idleTimeoutMillis`) |
| R-05 | `index.ts`                        | Add `helmet` middleware for security headers |
| R-06 | `index.ts`                        | Add a health check endpoint (`GET /api/health`) for Docker/k8s readiness probes |
| R-07 | Multiple route files              | Create shared `mapMovieSummary()`, `mapPersonSummary()` transform utilities |
| R-08 | `auth.routes.ts`                  | Add account lockout after N failed login attempts |
| R-09 | `Dockerfile`                      | Use `node dist/index.js` in production instead of `npx tsx` for better performance |
| R-10 | --                                | Add structured logging (e.g., `pino`) instead of `console.error` |

## Test Coverage Gaps

| ID   | What's Missing                                               | Why It Matters                        |
|------|--------------------------------------------------------------|---------------------------------------|
| T-01 | Malformed `:id` parameter tests                              | Security validation                   |
| T-02 | Full middleware chain integration tests                       | Cache + route handler interaction     |
| T-03 | SQL injection payload tests on auth routes                   | Regression safety for parameterized queries |
| T-04 | Expired JWT token test (distinct from invalid)               | Different error handling path          |
| T-05 | DELETE wishlist for non-existent entity                       | Idempotency behavior verification     |
| T-06 | Concurrent duplicate wishlist insert test                    | Race condition coverage                |
| T-07 | Database pool error handler test                             | Server stability under DB failure      |
| T-08 | Config validation tests                                       | Startup guard regression               |

---

## Architecture Diagram (Current)

```
Client (React)
    |
    | HTTP (no CORS restriction)
    v
Express Server (index.ts)
    |--- cors() (wide open)
    |--- express.json() (no body limit)
    |
    |--- /api/search -------> searchRoutes -----> tmdbClient --> TMDb API
    |--- /api/trending -----> trendingRoutes ---> tmdbClient --> TMDb API
    |--- /api/movie --------> movieRoutes ------> tmdbClient --> TMDb API
    |--- /api/person -------> personRoutes -----> tmdbClient --> TMDb API
    |--- /api/discover -----> discoverRoutes ---> tmdbClient --> TMDb API
    |--- /api/genres -------> genresRoutes -----> tmdbClient --> TMDb API
    |--- /api/providers ----> providersRoutes --> tmdbClient --> TMDb API
    |--- /api/auth ---------> authRoutes -------> pg.Pool ----> PostgreSQL
    |--- /api/wishlist -----> wishlistRoutes ---> pg.Pool ----> PostgreSQL
    |        ^                     (requireAuth middleware)
    |
    |--- errorHandler (global)
    |--- cacheMiddleware (per-route, in-memory NodeCache)
```

---

## Fixes Applied (2026-03-31)

All critical security issues have been resolved:

| Issue | Status | What was done |
|-------|--------|---------------|
| C-01: JWT secret | **FIXED** | Removed fallback in `config.ts` — server exits if `JWT_SECRET` is missing. Stronger secret in `docker-compose.yml`. |
| C-02: No rate limiting | **FIXED** | Added `express-rate-limit`: general API limiter (100 req/15min) + strict auth limiter (10 req/15min) in `index.ts`. |
| C-03: CORS open | **FIXED** | Restricted to `CORS_ORIGIN` env var with `http://localhost:5173` default in `index.ts`. |
| C-04: Route param validation | **FIXED** | All `:id` params validated as positive integers in `movie.routes.ts`, `person.routes.ts`, `providers.routes.ts`. |
| Zod not used | **FIXED** | Zod schemas added for login, register (`auth.routes.ts`), and wishlist (`wishlist.routes.ts`) request validation. |

Tests updated and passing: **98 tests across 12 files**.

---

## Final Notes

The backend is well-structured for a development/demo application. The TMDb proxy pattern is clean, response shaping is consistent, and the test suite is thorough with 98 test cases covering happy paths, edge cases, and error propagation. All critical security issues have been addressed.
