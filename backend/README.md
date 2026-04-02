# Backend - Glenigan Project API

Express.js (TypeScript) REST API serving construction project data from SQLite.

## Quick Start

```bash
npm install
npm run build
npm start
```

Server runs on `http://localhost:3000`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run dev` | Start with ts-node (no build) |
| `npm test` | Run Jest unit tests (26 tests) |

## API Endpoints

### GET /api/projects

Query parameters:
- `area` - Filter by area (e.g., "London")
- `keyword` - Search by project name OR description
- `company` - Filter by company name
- `minValue` - Minimum project value (£)
- `maxValue` - Maximum project value (£)
- `startDateFrom` - Projects starting after this date (YYYY-MM-DD)
- `startDateTo` - Projects starting before this date (YYYY-MM-DD)
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 20, max: 100)
- `all=true` - Return all records (max 10,000)

All filters can be combined.

### GET /api/areas

Returns list of unique areas:
```json
{"areas": ["London", "Manchester", "Birmingham", ...]}
```

### GET /api/companies

Returns list of unique companies:
```json
{"companies": ["NorthBuild Ltd", "Beacon Infrastructure", ...]}
```

### GET /api/health

Health check endpoint.

## Response Format

**Paginated:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 1800,
    "total_pages": 90
  }
}
```

**All records (`all=true`):**
```json
[{ "project_name": "...", ... }]
```

## Error Responses

| Status | Error Code | Description |
|--------|------------|-------------|
| 400 | INVALID_PARAMS | Invalid pagination parameters |
| 404 | NOT_FOUND | No projects match filters |
| 408 | REQUEST_TIMEOUT | Request exceeded 30s timeout |
| 413 | PAYLOAD_TOO_LARGE | `all=true` exceeds 10,000 records |
| 429 | TOO_MANY_REQUESTS | Rate limit exceeded (100/min) |
| 500 | SERVER_ERROR | Internal error |

## Production Features

- Request timeout (30s)
- Rate limiting (100 requests/minute)
- Request correlation IDs
- Structured JSON logging
- Safety cap on full exports (10,000 records)

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npx jest src/routes/projects.test.ts
```

26 unit tests covering:
- All filter parameters (area, keyword, company, minValue, maxValue, startDateFrom, startDateTo)
- Combined filter queries
- Pagination
- Error handling (400, 404, 413)
- /api/areas endpoint
- /api/companies endpoint

## Project Structure

```
src/
├── index.ts           # Express app entry
├── routes/
│   └── projects.ts    # Projects API + areas + companies
├── db/
│   └── database.ts   # SQLite operations
├── middleware/
│   ├── timeout.ts     # Timeout + logging
│   └── rateLimit.ts   # Rate limiting
└── types/
    └── project.ts     # TypeScript interfaces
```

## Environment

Create `.env` file:
```
PORT=3000
DB_PATH=../docs/assignment-db.db
```