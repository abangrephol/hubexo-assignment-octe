# Glenigan Project Browser - Technical Assessment

## Overview

Full-stack implementation of a construction project listing API with a modernized AngularJS frontend. The backend is built with Express.js (TypeScript) serving a SQLite database, and the frontend uses AngularJS 1.8.x with shadcn-inspired design.

---

## Latest Updates (2026-04-02)

### UI Modernization
- Added sidebar navigation (Projects, Dashboard)
- Modern CSS with CSS variables (shadcn-inspired design)
- Responsive layout with collapsible filters

### Advanced Filters
- **Company filter** - dropdown populated from `/api/companies` endpoint
- **Value range** - min/max project value filters
- **Date range** - filter by project start date
- **Keyword search** - now searches both project name AND description

### Quick Search
- Standalone search bar above filters
- Press Enter to search instantly
- No need to open advanced filters for quick searches

### API Updates
- New endpoint: `GET /api/companies` - returns unique company list
- All filters support combination (area + keyword + company + value + date)
- 26 unit tests covering all filter combinations

---

## Assumptions

### Database
- SQLite database contains: `projects`, `companies`, `project_area_map`
- Each project belongs to one area

### API Behavior
- Pagination enabled by default (20 items per page)
- Use `all=true` to fetch all records without pagination
- Returns 404 if no projects match filters

---

## Design Choices

### Pagination Response Format (REST Standard)

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

**Rationale:** Envelope wrapper + metadata follows REST best practices (GitHub, Stripe, JSON:API).

### Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable message"
}
```

### Frontend Filtering

**Choice:** Button click filtering + Enter key for quick search

**Rationale:** Reduces API calls, predictable behavior, simpler for legacy AngularJS

---

## API Endpoints

### GET /api/projects

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `area` | string | No | Filter by project area |
| `keyword` | string | No | Search by project name OR description |
| `company` | string | No | Filter by company name |
| `minValue` | number | No | Minimum project value (£) |
| `maxValue` | number | No | Maximum project value (£) |
| `startDateFrom` | date | No | Filter projects starting after this date |
| `startDateTo` | date | No | Filter projects starting before this date |
| `page` | number | No | Page number (1-based), default: 1 |
| `per_page` | number | No | Items per page (1-100), default: 20 |
| `all` | boolean | No | If `true`, returns all records without pagination |

### GET /api/areas

Returns list of unique areas: `{"areas": ["London", "Manchester", ...]}`

### GET /api/companies

Returns list of unique companies: `{"companies": ["NorthBuild Ltd", "Beacon Infrastructure", ...]}`

### Error Responses

| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | INVALID_PARAMS | Invalid parameter values |
| 404 | NOT_FOUND | No projects match filters |
| 413 | PAYLOAD_TOO_LARGE | Request exceeds 10,000 record limit |
| 429 | TOO_MANY_REQUESTS | Rate limit exceeded |
| 500 | SERVER_ERROR | Internal error |

---

## How to Run Locally

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

### Run Tests

```bash
cd backend
npm test
```

26 tests covering all API endpoints and filter combinations.

---

## Project Structure

```
/backend
  /src
    index.ts              # Express app entry point
    /routes
      projects.ts         # Projects API endpoint
    /db
      database.ts        # SQLite database operations
    /middleware
      timeout.ts         # Request timeout (30s)
      rateLimit.ts       # Rate limiting (100/min)

/frontend
  /ts
    /app
      app.ts             # AngularJS module with routing
    /core/services
      projectService.ts  # API service
    /features
      /project-list      # Project list page
      /dashboard         # Dashboard page
    /shared
      sidebar.ts         # Sidebar component
  index.html             # Main HTML with sidebar layout
  css/styles.css         # Modern shadcn-inspired CSS

/tests
  (backend unit tests)
/plans
  (implementation plans)
```

---

## Production Hardening (Implemented)

| Feature | Implementation |
|---------|----------------|
| Request Timeout | 30 seconds per request |
| Rate Limiting | 100 requests/minute per IP |
| Safety Cap | 10,000 records max for `all=true` |
| Structured Logging | JSON format with request IDs |
| CORS | Configurable allowed origins |
| Unit Tests | 26 Jest tests |

---

## Known Issues / Future Improvements

1. **Cursor pagination** - Better for deep pagination
2. **API versioning** - Consider `/api/v1/` prefix
3. **Response caching** - Add Redis for repeated queries
4. **Streaming exports** - Handle >10k records for XLSX