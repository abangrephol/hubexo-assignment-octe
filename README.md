# Glenigan Project API - Technical Assessment

## Overview

This is a full-stack implementation for a construction project listing API with an AngularJS frontend. The backend is built with Express.js (TypeScript) serving a SQLite database, and the frontend uses AngularJS 1.8.x.

---

## Assumptions

### Database
- The SQLite database (`projects.db`) exists and contains tables: `projects`, `companies`, and `project_area_map`
- Each project can belong to only one area (one-to-many relationship between projects and areas)

### API Behavior
- Pagination is enabled by default (always returns first page with pagination metadata)
- Use `all=true` query parameter to fetch all records without pagination
- Area filter returns 404 if no projects exist for that area
- Keyword search uses SQL LIKE with wildcards on project name

### Frontend
- Users have JavaScript enabled (AngularJS dependency)
- The application runs on `localhost:3000` (same port as API)

### Pagination
- Page numbers are 1-based (not 0-based)
- Default `per_page` is 20 when pagination is enabled
- Maximum `per_page` is 100 to prevent excessive data retrieval

---

## Design Choices

### Backend - Pagination Response Format

**REST API Standard Compliance:**

The pagination format follows REST best practices:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

**Rationale:**
- **Envelope wrapper** (`data` key): Separates payload from metadata, standard in REST APIs
- **Pagination object**: Contains all pagination metadata in one place
- **total/total_pages**: Allows clients to calculate client-side pagination UI
- This format is consistent with popular APIs (GitHub, Stripe, JSON:API conventions)

### Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable message"
}
```

**Rationale:**
- Follows RFC 7807 (Problem Details for HTTP APIs) pattern
- `error` code for programmatic handling
- `message` for debugging/display

### Database Query Strategy

Two queries are executed for paginated requests:
1. `COUNT(*)` to get total records
2. `SELECT` with `LIMIT` and `OFFSET`

**Tradeoff:** This is slightly less efficient than a single query but provides accurate total counts. For large datasets, cursor-based pagination would be better, but offset-based is simpler for this assignment.

### Frontend Filtering

**Choice:** Filtering on button click (not instant)

**Rationale:**
- Reduces API calls compared to instant filtering
- More predictable behavior for users
- Easier to handle loading states
- Simpler implementation for legacy AngularJS

---

## Tradeoffs

### Offset-based Pagination

**Limitation:** Not ideal for deep pagination (page 1000+)
- Offset calculations become slow on large datasets
- Not stable if data changes between requests

**Alternative:** Cursor-based pagination (better for production)

### Single Area per Project

**Assumption:** One project = one area (based on database structure)

**Limitation:** Can't represent projects spanning multiple areas

### No Caching

- No Redis/in-memory caching implemented
- Every request hits the database

### No Rate Limiting

- Unprotected API could be abused
- Would add in production

### Minimal Validation

- Basic type checking on pagination params
- No sanitization of `keyword` input (SQL injection prevented by parameterized queries)

---

## API Endpoints

### GET /api/projects

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `area` | string | No | Filter by project area |
| `keyword` | string | No | Search by project name (partial match) |
| `page` | number | No | Page number (1-based), default: 1 |
| `per_page` | number | No | Items per page (1-100), default: 20 |
| `all` | boolean | No | If `true`, returns all records without pagination |

**Response (default - paginated):**

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

**Response (all=true - no pagination):**

```json
[
  { "project_name": "...", ... }
]
```

**Error Responses:**

| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | INVALID_PARAMS | Invalid page/per_page values |
| 404 | NOT_FOUND | No projects found for area |
| 500 | SERVER_ERROR | Database/internal error |

---

## How to Run/Run Locally

### Prerequisites

- Node.js 18+
- npm

### Backend Setup

```bash
cd backend
npm install
npm run build
npm start
```

Server runs on `http://localhost:3000`

### Frontend Setup

The frontend is served statically from the backend. Open `http://localhost:3000` in a browser.

### Development (Optional)

For TypeScript compilation:

```bash
# Backend
cd backend
npx tsc --watch

# Frontend (if editing TypeScript)
cd frontend/ts
npx tsc --watch
```

### Testing the API

```bash
# Get all projects
curl http://localhost:3000/api/projects

# Filter by area
curl "http://localhost:3000/api/projects?area=London"

# Search by keyword
curl "http://localhost:3000/api/projects?keyword=building"

# Paginated request
curl "http://localhost:3000/api/projects?page=1&per_page=10"

# Combined filters
curl "http://localhost:3000/api/projects?area=London&keyword=bridge&page=1&per_page=5"
```

---

## Project Structure

```
/backend
  /src
    index.ts          # Express app entry point
    /routes
      projects.ts     # Projects API endpoint
    /db
      database.ts     # SQLite database operations
    /types
      project.ts      # TypeScript interfaces

/frontend
  /ts
    app.ts            # AngularJS module
    projectService.ts # API service
    projectListController.ts # List controller
  index.html          # Main HTML file

/docs
  assignment-spec.md  # Original assignment specification
```

---

## Production Hardening (Implemented)

The following production safeguards have been implemented:

### Request Timeout
- All requests timeout after 30 seconds
- Prevents resource exhaustion from hanging connections

### Safety Limit on Full Exports
- `all=true` queries are capped at 10,000 records maximum
- Prevents memory exhaustion from loading massive datasets
- Returns error `413 PAYLOAD_TOO_LARGE` if limit exceeded

### Rate Limiting
- 100 requests per minute per IP address
- Returns `429 TOO_MANY_REQUESTS` when exceeded
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Structured Logging
- Request correlation IDs (UUID) for debugging
- Request/response logging with timing
- Log format: JSON for production compatibility

### CORS Configuration
- Configured for production deployment
- Restricted origins (configurable via environment)

### Unit Testing
- Jest configured with ts-jest
- 18 unit tests covering middleware and API endpoints
- Run with `npm test`

---

## Known Issues / Improvements

1. **Cursor pagination**: Would be better for deep pagination (offset-based slows on page 1000+)
2. **API versioning**: Consider `/api/v1/projects` prefix for API evolution
3. **Input sanitization**: Add XSS protection for keyword search display
4. **Redis caching**: Add response caching for repeated queries
5. **Testing**: Add unit/integration tests with Jest/Supertest
6. **Streaming exports**: For XLSX reports, implement streaming to handle >10k records