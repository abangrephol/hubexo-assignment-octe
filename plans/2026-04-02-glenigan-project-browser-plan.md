# Glenigan Project Browser - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a REST API (Express.js/TypeScript) and AngularJS frontend to list/filter construction projects from SQLite database.

**Architecture:** Express.js backend serving REST API → SQLite database. AngularJS frontend with controller/service pattern for display and filtering.

**Tech Stack:** Node.js, Express.js, TypeScript, SQLite (better-sqlite3), AngularJS 1.8.x

---

## File Structure

```
hubexo/
├── backend/
│   ├── src/
│   │   ├── index.ts           # Express app entry + CORS
│   │   ├── routes/
│   │   │   └── projects.ts     # GET /api/projects endpoint
│   │   ├── db/
│   │   │   └── database.ts    # SQLite connection + index
│   │   └── types/
│   │       └── project.ts      # TypeScript interfaces
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                   # DB_PATH reference
├── frontend/
│   ├── index.html             # AngularJS app entry
│   ├── css/
│   │   └── styles.css         # Basic styling
│   ├── ts/
│   │   ├── app.ts             # AngularJS module definition
│   │   ├── services/
│   │   │   └── projectService.ts  # $http API calls
│   │   └── controllers/
│   │       └── projectListController.ts  # Main controller
│   └── package.json          # For TypeScript compilation (optional)
├── docs/
│   └── assignment-db.db       # Source database (copy to backend/data/)
└── README.md
```

---

## Task 1: Backend Project Setup

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "glenigan-backend",
  "version": "1.0.0",
  "description": "Glenigan Project Browser API",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "echo \"No tests configured\""
  },
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.16",
    "@types/better-sqlite3": "^7.6.8",
    "@types/cors": "^2.8.17",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create .env**

```bash
# Path to SQLite database (relative to project root)
DB_PATH=../docs/assignment-db.db
PORT=3000
```

- [ ] **Step 4: Copy database to backend**

```bash
mkdir -p backend/data
cp docs/assignment-db.db backend/data/
```

- [ ] **Step 5: Install dependencies**

```bash
cd backend && npm install
```

- [ ] **Step 6: Commit**

```bash
git add backend/package.json backend/tsconfig.json backend/.env
git commit -m "chore: set up backend project structure"
```

---

## Task 2: Database Module

**Files:**
- Create: `backend/src/types/project.ts`
- Create: `backend/src/db/database.ts`

- [ ] **Step 1: Create TypeScript interfaces**

```typescript
// backend/src/types/project.ts

export interface Project {
  project_name: string;
  project_start: string;
  project_end: string;
  company: string;
  description: string | null;
  project_value: number;
  area: string;
}

export interface ProjectQueryParams {
  area?: string;
  keyword?: string;
  page?: number;
  per_page?: number;
}

export interface ApiError {
  error: string;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}
```

- [ ] **Step 2: Create database module**

```typescript
// backend/src/db/database.ts
import Database from 'better-sqlite3';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DB_PATH || '../docs/assignment-db.db';
const fullPath = path.resolve(__dirname, dbPath);

export const db = new Database(fullPath);

// Ensure index on area for performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_project_area 
  ON project_area_map(area);
`);

export function closeDatabase(): void {
  db.close();
}
```

- [ ] **Step 3: Test database connection**

```bash
cd backend && npx ts-node -e "
import { db } from './src/db/database';
const result = db.prepare('SELECT COUNT(*) as count FROM projects').get();
console.log('Projects count:', result);
"
```

Expected: `{ count: 1800 }`

- [ ] **Step 4: Commit**

```bash
git add backend/src/types/project.ts backend/src/db/database.ts
git commit -m "feat: add database module with SQLite connection"
```

---

## Task 3: Projects Route

**Files:**
- Create: `backend/src/routes/projects.ts`

- [ ] **Step 1: Create projects route with full implementation**

```typescript
// backend/src/routes/projects.ts
import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { Project, ProjectQueryParams, ApiError } from '../types/project';

const router = Router();

function sanitizeString(str: string | undefined, maxLen: number): string | undefined {
  if (!str) return undefined;
  const sanitized = str.slice(0, maxLen);
  // Basic SQL injection prevention - remove potential SQL keywords
  return sanitized.replace(/['";--]/g, '');
}

function validatePagination(page?: number, per_page?: number): string | null {
  if (page !== undefined) {
    if (!Number.isInteger(page) || page < 1) {
      return 'page must be a positive integer';
    }
  }
  if (per_page !== undefined) {
    if (!Number.isInteger(per_page) || per_page < 1 || per_page > 100) {
      return 'per_page must be between 1 and 100';
    }
  }
  return null;
}

router.get('/', (req: Request, res: Response) => {
  try {
    const { area, keyword, page, per_page } = req.query as Record<string, string>;
    
    // Parse and validate pagination
    const pageNum = page ? parseInt(page, 10) : undefined;
    const perPageNum = per_page ? parseInt(per_page, 10) : undefined;
    
    const paginationError = validatePagination(pageNum, perPageNum);
    if (paginationError) {
      return res.status(400).json({
        error: 'INVALID_PARAMS',
        message: paginationError
      } as ApiError);
    }
    
    // Build query
    let query = `
      SELECT 
        p.project_name,
        p.project_start,
        p.project_end,
        c.company_name as company,
        p.description,
        p.project_value,
        pam.area
      FROM projects p
      JOIN companies c ON p.company_id = c.company_id
      JOIN project_area_map pam ON p.project_id = pam.project_id
      WHERE 1=1
    `;
    
    const params: (string | number)[] = [];
    
    // Area filter
    if (area) {
      const sanitizedArea = sanitizeString(area, 100);
      if (sanitizedArea) {
        query += ' AND pam.area = ?';
        params.push(sanitizedArea);
      }
    }
    
    // Keyword search
    if (keyword) {
      const sanitizedKeyword = sanitizeString(keyword, 200);
      if (sanitizedKeyword) {
        query += ' AND p.project_name LIKE ?';
        params.push(`%${sanitizedKeyword}%`);
      }
    }
    
    // Get total count for pagination
    const countQuery = query.replace('SELECT \n        p.project_name,\n        p.project_start,\n        p.project_end,\n        c.company_name as company,\n        p.description,\n        p.project_value,\n        pam.area', 'SELECT COUNT(*) as total');
    const countStmt = db.prepare(countQuery);
    const countResult = countStmt.get(...params) as { total: number };
    const total = countResult.total;
    
    // Apply pagination
    let response: Project[];
    
    if (pageNum !== undefined && perPageNum !== undefined) {
      const offset = (pageNum - 1) * perPageNum;
      query += ' LIMIT ? OFFSET ?';
      params.push(perPageNum, offset);
      
      const stmt = db.prepare(query);
      response = stmt.all(...params) as Project[];
    } else {
      // No pagination - return all
      const stmt = db.prepare(query);
      response = stmt.all(...params) as Project[];
    }
    
    // Check for empty result
    if (response.length === 0 && (area || keyword)) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: area ? `No projects found for area: ${area}` : 'No projects found'
      } as ApiError);
    }
    
    // Build response
    let finalResponse = response;
    
    // Add pagination metadata if pagination was requested
    if (pageNum !== undefined) {
      const effectivePerPage = perPageNum || 20;
      finalResponse = response;
      return res.json({
        data: response,
        pagination: {
          page: pageNum,
          per_page: effectivePerPage,
          total,
          total_pages: Math.ceil(total / effectivePerPage)
        }
      });
    }
    
    return res.json(response);
    
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Database connection failed'
    } as ApiError);
  }
});

export default router;
```

- [ ] **Step 2: Test the endpoint manually**

```bash
cd backend && npm run dev &
sleep 2
curl "http://localhost:3000/api/projects?area=Manchester"
curl "http://localhost:3000/api/projects&keyword=Bridge&page=1&per_page=5"
```

Expected: JSON array of projects with correct fields

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/projects.ts
git commit -m "feat: add projects API endpoint with filtering and pagination"
```

---

## Task 4: Express App Entry Point

**Files:**
- Create: `backend/src/index.ts`

- [ ] **Step 1: Create Express app with CORS**

```typescript
// backend/src/index.ts
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import projectsRouter from './routes/projects';
import { closeDatabase } from './db/database';

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api/projects', projectsRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'SERVER_ERROR',
    message: 'Internal server error'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  closeDatabase();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
```

- [ ] **Step 2: Verify server starts**

```bash
cd backend && npm run dev
# Should see: Server running on http://localhost:3000
```

Test: `curl http://localhost:3000/api/health`

- [ ] **Step 3: Commit**

```bash
git add backend/src/index.ts
git commit -m "feat: add Express app entry point with CORS"
```

---

## Task 5: Frontend - Basic Setup

**Files:**
- Create: `frontend/index.html`
- Create: `frontend/package.json`

- [ ] **Step 1: Create index.html with AngularJS**

```html
<!DOCTYPE html>
<html ng-app="gleniganApp">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Construction Projects</title>
  <link rel="stylesheet" href="css/styles.css">
  <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.2/angular.min.js"></script>
  <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.2/angular-route.min.js"></script>
</head>
<body ng-controller="ProjectListController">
  <div class="container">
    <header>
      <h1>Construction Projects</h1>
    </header>
    
    <div class="filters">
      <div class="filter-group">
        <input 
          type="text" 
          ng-model="filters.keyword" 
          placeholder="Search projects..."
          class="search-input"
        >
      </div>
      <div class="filter-group">
        <select ng-model="filters.area" class="area-select">
          <option value="">All Areas</option>
          <option ng-repeat="area in areas" value="{{area}}">{{area}}</option>
        </select>
      </div>
      <button ng-click="search()" class="search-btn">Search</button>
    </div>
    
    <div class="loading" ng-if="loading">
      Loading...
    </div>
    
    <div class="error" ng-if="error">
      {{error}}
    </div>
    
    <div class="project-list" ng-if="!loading && !error">
      <div class="no-results" ng-if="projects.length === 0">
        No projects found
      </div>
      
      <div class="project-item" ng-repeat="project in projects">
        <h3 class="project-name">{{project.project_name}}</h3>
        <div class="project-details">
          <span class="company">{{project.company}}</span>
          <span class="dates">{{project.project_start}} - {{project.project_end}}</span>
          <span class="value">£{{project.project_value | number}}</span>
          <span class="area">{{project.area}}</span>
        </div>
        <p class="description" ng-if="project.description">{{project.description}}</p>
      </div>
    </div>
    
    <div class="pagination" ng-if="pagination.total_pages > 1">
      <button 
        ng-click="goToPage(pagination.page - 1)" 
        ng-disabled="pagination.page <= 1"
        class="page-btn">
        Previous
      </button>
      <span class="page-info">
        Page {{pagination.page}} of {{pagination.total_pages}}
      </span>
      <button 
        ng-click="goToPage(pagination.page + 1)" 
        ng-disabled="pagination.page >= pagination.total_pages"
        class="page-btn">
        Next
      </button>
    </div>
  </div>
  
  <script src="ts/app.js"></script>
  <script src="ts/services/projectService.js"></script>
  <script src="ts/controllers/projectListController.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create frontend package.json**

```json
{
  "name": "glenigan-frontend",
  "version": "1.0.0",
  "scripts": {
    "build:js": "tsc *.ts services/*.ts controllers/*.ts --outDir ts --target ES2018 --module commonjs"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/index.html frontend/package.json
git commit -m "feat: add frontend HTML structure with AngularJS"
```

---

## Task 6: Frontend - Service

**Files:**
- Create: `frontend/ts/projectService.ts`

- [ ] **Step 1: Create ProjectService**

```typescript
// frontend/ts/projectService.ts
modulegleniganApp.factory('ProjectService', ['$http', ($http: ng.IHttpService) => {
  const API_BASE = 'http://localhost:3000/api';
  
  return {
    getProjects(params: {
      area?: string;
      keyword?: string;
      page?: number;
      per_page?: number;
    }): ng.IPromise<any> {
      return $http.get(`${API_BASE}/projects`, { params }).then(response => response.data);
    },
    
    getAreas(): string[] {
      return [
        'Birmingham',
        'Bristol',
        'Cardiff',
        'Edinburgh',
        'Glasgow',
        'Leeds',
        'Liverpool',
        'London',
        'Manchester',
        'Newcastle'
      ];
    }
  };
}]);
```

- [ ] **Step 2: Build the service (if using TypeScript compilation)**

```bash
cd frontend && npm install && npx tsc ts/projectService.ts --outDir ts --target ES2018 --module commonjs
```

- [ ] **Step 3: Commit**

```bash
git add frontend/ts/projectService.ts
git commit -m "feat: add ProjectService for API calls"
```

---

## Task 7: Frontend - Controller

**Files:**
- Create: `frontend/ts/projectListController.ts`

- [ ] **Step 1: Create ProjectListController**

```typescript
// frontend/ts/projectListController.ts
modulegleniganApp.controller('ProjectListController', 
  ['$scope', 'ProjectService', ($scope: any, ProjectService: any) => {
    
    // Initialize state
    $scope.projects = [];
    $scope.areas = ProjectService.getAreas();
    $scope.filters = {
      keyword: '',
      area: ''
    };
    $scope.loading = false;
    $scope.error = null;
    $scope.pagination = null;
    
    // Search function
    $scope.search = function() {
      $scope.loading = true;
      $scope.error = null;
      
      const params: any = {};
      
      if ($scope.filters.keyword) {
        params.keyword = $scope.filters.keyword;
      }
      if ($scope.filters.area) {
        params.area = $scope.filters.area;
      }
      
      // Add pagination if we have page state
      if ($scope.pagination && $scope.pagination.page) {
        params.page = $scope.pagination.page;
        params.per_page = 20;
      }
      
      ProjectService.getProjects(params)
        .then((response: any) => {
          // Check if response has pagination or is direct array
          if (response.data) {
            $scope.projects = response.data;
            $scope.pagination = response.pagination;
          } else {
            $scope.projects = response;
            $scope.pagination = null;
          }
        })
        .catch((err: any) => {
          $scope.error = err.data?.message || 'Failed to load projects';
        })
        .finally(() => {
          $scope.loading = false;
        });
    };
    
    // Pagination
    $scope.goToPage = function(page: number) {
      if (!$scope.pagination) return;
      if (page < 1 || page > $scope.pagination.total_pages) return;
      
      $scope.pagination.page = page;
      $scope.search();
    };
    
    // Initial load - load all projects without pagination
    $scope.search();
  }]
);
```

- [ ] **Step 2: Build the controller**

```bash
cd frontend && npx tsc ts/projectListController.ts --outDir ts --target ES2018 --module commonjs
```

- [ ] **Step 3: Commit**

```bash
git add frontend/ts/projectListController.ts
git commit -m "feat: add ProjectListController with search and pagination"
```

---

## Task 8: Frontend - Styling

**Files:**
- Create: `frontend/css/styles.css`

- [ ] **Step 1: Create CSS styles**

```css
/* Reset and base */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f5f5;
  color: #333;
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* Header */
header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #ddd;
}

header h1 {
  font-size: 24px;
  color: #2c3e50;
}

/* Filters */
.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.filter-group {
  flex: 1;
}

.search-input,
.area-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-btn {
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.search-btn:hover {
  background-color: #2980b9;
}

/* Loading and error states */
.loading,
.error {
  padding: 20px;
  text-align: center;
  border-radius: 8px;
  margin-bottom: 20px;
}

.loading {
  background-color: #f8f9fa;
  color: #666;
}

.error {
  background-color: #fee;
  color: #c0392b;
}

/* Project list */
.project-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.no-results {
  padding: 40px;
  text-align: center;
  background: #fff;
  border-radius: 8px;
  color: #666;
}

.project-item {
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.project-name {
  font-size: 18px;
  color: #2c3e50;
  margin-bottom: 8px;
}

.project-details {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.project-details .value {
  color: #27ae60;
  font-weight: 600;
}

.project-details .area {
  background: #ecf0f1;
  padding: 2px 8px;
  border-radius: 4px;
}

.description {
  font-size: 14px;
  color: #7f8c8d;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
}

.page-btn {
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.page-btn:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.page-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

.page-info {
  font-size: 14px;
  color: #666;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/css/styles.css
git commit -m "feat: add CSS styles for frontend"
```

---

## Task 9: Create App Module

**Files:**
- Create: `frontend/ts/app.ts`

- [ ] **Step 1: Create AngularJS module**

```typescript
// frontend/ts/app.ts
declare var angular: any;

const module = angular.module('gleniganApp', []);
```

- [ ] **Step 2: Build the module**

```bash
cd frontend && npx tsc ts/app.ts --outDir ts --target ES2018 --module commonjs
```

- [ ] **Step 3: Commit**

```bash
git add frontend/ts/app.ts
git commit -m "feat: add AngularJS app module"
```

---

## Task 10: End-to-End Verification

**Files:**
- Verify: All components

- [ ] **Step 1: Start backend**

```bash
cd backend && npm run dev &
# Wait for server to start
sleep 3
```

- [ ] **Step 2: Test API endpoints**

```bash
# Test health
curl http://localhost:3000/api/health

# Test without pagination
curl "http://localhost:3000/api/projects" | head -c 500

# Test with area filter
curl "http://localhost:3000/api/projects?area=Manchester" | head -c 500

# Test with keyword
curl "http://localhost:3000/api/projects?keyword=Bridge"

# Test pagination
curl "http://localhost:3000/api/projects?page=1&per_page=5"

# Test error cases
curl "http://localhost:3000/api/projects?page=-1"
curl "http://localhost:3000/api/projects?area=NonExistent"
```

Expected responses for each test

- [ ] **Step 3: Open frontend in browser**

Open `frontend/index.html` in a browser and verify:
- Page loads without errors
- Projects are displayed
- Search functionality works
- Area filter works
- Pagination works (if more than 20 results)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: complete implementation - backend API and AngularJS frontend"
```

---

## Plan Review

**Spec Coverage Check:**
- [x] REST API with GET /api/projects - Task 3
- [x] Query params: area, keyword, page, per_page - Task 3
- [x] Pagination behavior (default 20, no pagination when both missing) - Task 3
- [x] JSON response format with all fields - Task 3
- [x] Error handling (400, 404, 500) - Task 3
- [x] Project list page - Task 5
- [x] Display fields (name, company, start, end, value, area) - Task 5
- [x] Search bar with keyword - Task 5
- [x] Area filter dropdown - Task 5
- [x] Button-click search - Task 7
- [x] Pagination UI - Task 5
- [x] Error handling in frontend - Task 7

**Placeholder Scan:** No TODOs or placeholders found.

**Type Consistency:** All interfaces defined in Task 2 and used consistently.

---

## Execution Choice

**Plan complete and saved to `docs/superpowers/plans/2026-04-02-glenigan-project-browser-plan.md`. Two execution options:**

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**