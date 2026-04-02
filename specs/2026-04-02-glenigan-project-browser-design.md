# Glenigan Project Browser - Design Specification

**Date**: 2026-04-02  
**Project**: Construction Project Browser API + Frontend

---

## 1. Architecture Overview

### System Components

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  AngularJS UI   │────▶│  Express API   │────▶│   SQLite DB    │
│   (Browser)     │◀────│   (Node.js)     │◀────│   (assignment- │
│                 │     │   Port: 3000    │     │    db.db)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

- **Backend**: Express.js on Node.js, TypeScript, serving REST API on port 3000
- **Database**: SQLite (existing `assignment-db.db`)
- **Frontend**: AngularJS 1.8.x + TypeScript, served by Express

### API Endpoint Design

**Endpoint**: `GET /api/projects`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `area` | string | No | Filter by city |
| `keyword` | string | No | Search in project_name |
| `page` | number | No | 1-based pagination |
| `per_page` | number | No | Items per page (1-100) |

**Behavior**:
- If `page` provided without `per_page`: default to 20
- If neither `page` nor `per_page`: return all projects (no pagination)

**Success Response** (200):
```json
[
  {
    "project_name": "Manchester Bridge Phase 2",
    "project_start": "2025-05-16 00:00:00",
    "project_end": "2026-02-28 00:00:00",
    "company": "NorthBuild Ltd",
    "description": "Major road expansion project...",
    "project_value": 4832115,
    "area": "Manchester"
  }
]
```

### Database Query Strategy

- Join `projects` + `companies` + `project_area_map` tables
- Use parameterized queries to prevent SQL injection
- Add index on `area` column if not exists

---

## 2. Frontend Components

### Page Layout

```
┌─────────────────────────────────────────────────┐
│  Header: "Construction Projects"                │
├─────────────────────────────────────────────────┤
│  Filters Bar:                                   │
│  [Search Input] [Area Dropdown] [Search Button]│
├─────────────────────────────────────────────────┤
│  Project List (ng-repeat):                     │
│  ┌─────────────────────────────────────────────┐│
│  │ Project Name                                ││
│  │ Company | Start - End | £Value | Area      ││
│  └─────────────────────────────────────────────┘│
├─────────────────────────────────────────────────┤
│  Pagination: [◀ Prev] Page 1 of 10 [Next ▶]     │
└─────────────────────────────────────────────────┘
```

### AngularJS Architecture

| Component | Responsibility |
|-----------|----------------|
| `ProjectService` | $http calls to backend, handles errors |
| `ProjectListController` | Manages state, API calls, pagination |
| `$scope` | Projects array, filters, pagination state, loading |

### Filtering Behavior

- **Search trigger**: Button-click (not instant typing)
- **Rationale**: Reduces API calls, clearer UX, simpler state management

### Project Display Fields

- Project Name
- Company
- Project Start
- Project End
- Project Value (GBP)
- Area

---

## 3. Error Handling

### API Error Responses

| Status | Code | Message |
|--------|------|---------|
| 400 | `INVALID_PARAMS` | "page must be a positive integer" |
| 400 | `INVALID_PARAMS` | "per_page must be between 1 and 100" |
| 404 | `NOT_FOUND` | "No projects found for area: {area}" |
| 500 | `SERVER_ERROR` | "Database connection failed" |

**Example**:
```json
{ "error": "INVALID_PARAMS", "message": "page must be a positive integer" }
```

### Frontend Error Handling

- Show toast/alert on API errors
- Display "No projects found" for empty results
- Loading spinner during API calls
- Graceful degradation — show cached data if available

### Validation Rules

| Parameter | Rule |
|-----------|------|
| `area` | String, max 100 chars |
| `keyword` | String, max 200 chars, sanitize for SQL |
| `page` | Positive integer, min 1 |
| `per_page` | Positive integer, 1-100 range |

---

## 4. File Structure

```
hubexo/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express app entry
│   │   ├── routes/
│   │   │   └── projects.ts   # /api/projects endpoint
│   │   ├── db/
│   │   │   └── database.ts   # SQLite connection
│   │   └── types/
│   │       └── project.ts    # TypeScript interfaces
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── ts/
│   │   ├── app.ts            # AngularJS module
│   │   ├── controllers/
│   │   │   └── projectList.ts
│   │   └── services/
│   │       └── projectService.ts
│   └── package.json
└── README.md
```

---

## 5. Design Choices & Trade-offs

| Decision | Rationale |
|----------|-----------|
| Express.js over Fastify | Most mature, largest ecosystem, excellent TS support |
| Button-click search over instant | Reduces API load, clearer user intent |
| No pagination by default | Assignment allows "return all" when no pagination params |
| Button-click filtering | Simpler implementation, matches spec "on button click" option |
| Join in SQL, not code | Better performance, reduces data transfer |
| Error codes in response | Enables frontend to handle specific error types |

---

## 6. Assumptions

1. Database file (`assignment-db.db`) is in `docs/` and accessible to backend
2. No authentication required (not mentioned in spec)
3. Single page application — no routing needed
4. CORS enabled for local frontend development
5. Users have Node.js 18+ installed

---

## 7. How to Run

1. **Backend**: `cd backend && npm install && npm run dev`
2. **Frontend**: Open `frontend/index.html` in browser, or serve via Express
3. **Database**: Already provided at `docs/assignment-db.db`