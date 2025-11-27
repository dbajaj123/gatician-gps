# Backend Developer Guide — Gatician GPS

This document is aimed at backend engineers who will work on the Node.js/Express API and supporting services.
It covers repository layout, local setup, development workflow, conventions, testing, and deployment.

---

## Goals
- Maintain a secure, testable, and documented REST API
- Keep CPU/network load predictable for GPS ingestion
- Make it easy for new backend engineers to get started quickly

---

## Repository overview
- `src/` — Main backend source
  - `config/` — environment, database, logger
  - `controllers/` — request handlers
  - `middleware/` — auth, rate limiting, validation
  - `models/` — Mongoose models (User, Device, Location)
  - `routes/` — API routes (auth, devices, locations)
  - `services/` — long-running / domain services (TCP GPS server)
  - `utils/` — helpers, validators, token service
- `scripts/` — tooling (synthetic data, OSM parsing, uploads)
- `frontend/` — React app (separate deliverable)
- `logs/` — runtime logs (rotate daily)

---

## Local setup (backend)
1. Clone and install:

```powershell
git clone https://github.com/dbajaj123/gatician-gps.git
cd gatician-gps
npm install
```

2. Environment
- Copy `.env.example` to `.env` and set database and secrets.

3. Run MongoDB locally and ensure `MONGODB_URI` is correct.

4. Start the API server:

```powershell
npm run dev
# or
npm start
```

5. TCP GPS server (for protocol testing) runs as part of the Node process under `src/services/gpsTcpServer.js`.

---

## Coding & style conventions
- JavaScript (Node 16+), ES modules allowed where appropriate
- Use `async/await` consistently for I/O
- Keep controllers thin; business logic belongs in services
- Use `Joi` (or `utils/validation.js`) for request validation
- Write unit tests for new logic (Jest preferred)
- Follow existing naming and folder conventions

Commit messages:
- Use terse subject line and optional body.
- Example: `fix(locations): validate latitude/longitude format`

---

## API conventions
- All endpoints under `/api/v1`
- Pagination keys: `page`, `limit`
- Use `Authorization: Bearer <token>` for authenticated routes
- Successful responses follow `{ success: true, data: ... }`
- Errors: proper status codes and `{ success: false, message: ... }`

---

## Key development tasks & tips
- When adding location ingestion routes, ensure geospatial indexes exist on the `locations` collection.
- Keep insertion batches reasonably sized to avoid blocking the event loop (use streams or bulk insert with `ordered: false`).
- Rate limiting: `src/middleware/rateLimiter.js` is already configured. Increase `apiLimiter.max` only if absolutely necessary.
- For synthetic data: see `scripts/generate_synthetic_locations.js` and `scripts/uploadSyntheticData.js`.
  - Use `resetAndUpload.js` if you want to wipe and repopulate test data for a device.

---

## Performance & scaling
- Use a replica set for MongoDB in production.
- Add indexes: `locations` should have a geospatial index on `{ location: '2dsphere' }` (or store lat/lng and create compound indexes as appropriate).
- Offload heavy parsing (e.g., OSM processing) to scripts or worker processes.
- For heavy ingestion, consider batching and a lightweight queue (Redis/ Bull) to prevent spikes.

---

## Security
- Keep `JWT_SECRET` and DB credentials out of version control
- Use HTTPS in production and configure CORS to accept only the frontend domain
- Limit rate limits for auth endpoints; `authLimiter.skipSuccessfulRequests` is enabled

---

## Running tests
- Use `npm test` (Jest) — tests live under `test/` if present.

---

## Deployment
- `deploy.sh` contains PM2-based example deployment steps
- Production should run under PM2 (or equivalent process manager)
- Set `NODE_ENV=production` and ensure logs rotate

---

## Helpful commands
```powershell
# Run locally
npm run dev
# Run linter (if available)
npm run lint
# Run tests
npm test
```

---

## Troubleshooting
- If a route fails: check logs in `logs/` and `src/config/logger.js` settings
- If OSRM routing returns `InvalidValue`, verify coordinates are inside campus bounding box and in `lat,lng` order

---

## Next steps you may want to take
- Add a `Makefile` or npm scripts to standardize common tasks
- Add CI checks: lint, tests, security scans
- Document the API using OpenAPI / Swagger for easier onboarding

---

If you want, I can:
- Add a `docs/` section for developer checklists
- Add a `backend/README.md` inside `src/` with code-level notes
- Open a PR with these changes

