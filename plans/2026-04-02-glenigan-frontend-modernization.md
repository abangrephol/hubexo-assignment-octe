# Glenigan Frontend Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace existing AngularJS UI with modern dashboard featuring sidebar navigation and advanced filters panel while keeping AngularJS framework.

**Architecture:** Sidebar-based layout with main content area. Sidebar contains navigation (Projects, Dashboard). Main area has collapsible advanced filters panel above project list.

**Tech Stack:**
- AngularJS 1.8.x (unchanged)
- Vanilla CSS with CSS variables (shadcn-inspired design)
- Express.js backend (add new endpoints)

---

## File Structure

```
frontend/
├── index.html           # Main entry with sidebar layout + CSS variables
├── css/
│   └── styles.css       # Modern CSS with sidebar, filters, table styles
├── ts/
│   ├── app/
│   │   └── app.ts       # AngularJS module with sidebar route config
│   ├── core/
│   │   └── services/
│   │       └── projectService.ts  # Updated to support new filters
│   ├── shared/
│   │   ├── sidebar.ts   # Sidebar component (AngularJS directive)
│   │   └── filterPanel.ts  # Advanced filters panel component
│   └── features/
│       ├── dashboard/
│       │   └── dashboard.ts  # Dashboard controller + template
│       └── project-list/
│           ├── project-list.html  # Updated with new filters UI
│           └── controllers/
│               └── projectListController.ts  # Updated with new filter logic

backend/
├── src/
│   └── routes/
│       └── projects.ts  # Add search on description, companies endpoint
```

---

## Backend Tasks

### Task B1: Add /api/companies endpoint

**Files:**
- Modify: `backend/src/routes/projects.ts:183-205` (add new route)

- [ ] **Step 1: Add companies endpoint**

Add after existing `/areas` endpoint:
```typescript
router.get('/companies', async (_req: Request, res: Response) => {
  try {
    await ensureDatabase();
    const sql = `SELECT DISTINCT c.company_name FROM companies c 
                 INNER JOIN projects p ON c.company_id = p.company_id 
                 ORDER BY c.company_name`;
    const results = await getAll<{ company_name: string }>(sql, []);
    res.json({ companies: results.map(r => r.company_name) });
  } catch (error: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
});
```

- [ ] **Step 2: Build and test**

```bash
cd backend && npm run build
curl http://localhost:3000/api/companies
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/projects.ts
git commit -m "feat: add /api/companies endpoint"
```

---

### Task B2: Update keyword search to include description

**Files:**
- Modify: `backend/src/routes/projects.ts:77-80`

- [ ] **Step 1: Update keyword WHERE clause**

Change existing keyword filter from:
```typescript
whereConditions.push('p.project_name LIKE ?');
```
To:
```typescript
whereConditions.push('(p.project_name LIKE ? OR p.description LIKE ?)');
```
And update params from:
```typescript
params.push(`%${keyword}%`);
```
To:
```typescript
params.push(`%${keyword}%`, `%${keyword}%`);
```

- [ ] **Step 2: Build and test**

```bash
cd backend && npm run build
curl "http://localhost:3000/api/projects?keyword=infrastructure"
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/projects.ts
git commit -m "feat: search project name and description"
```

---

## Frontend Tasks

### Task F1: Create CSS with sidebar and modern UI

**Files:**
- Modify: `frontend/css/styles.css` (replace entire file)

- [ ] **Step 1: Write new CSS**

```css
:root {
  --sidebar-width: 240px;
  --header-height: 56px;
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-muted: #f1f5f9;
  --border-color: #e2e8f0;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --accent-primary: #3b82f6;
  --accent-hover: #2563eb;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-secondary);
  color: var(--text-primary);
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-logo {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.sidebar-nav {
  flex: 1;
  padding: 12px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  cursor: pointer;
  margin-bottom: 4px;
}

.nav-item:hover {
  background: var(--bg-muted);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent-primary);
  color: white;
}

.nav-icon {
  width: 20px;
  height: 20px;
}

/* Main Content */
.main-content {
  margin-left: var(--sidebar-width);
  flex: 1;
  padding: 24px;
  min-height: 100vh;
}

/* Page Header */
.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

/* Card */
.card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-body {
  padding: 20px;
}

/* Filters */
.filters-section {
  margin-bottom: 24px;
}

.filters-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
}

.filters-toggle:hover {
  background: var(--bg-muted);
}

.filters-panel {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  margin-top: 8px;
  overflow: hidden;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.filter-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 14px;
  background: var(--bg-primary);
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.filters-actions {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-muted);
}

.btn {
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-secondary {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.btn-secondary:hover {
  background: var(--bg-muted);
}

/* Table */
.project-table {
  width: 100%;
  border-collapse: collapse;
}

.project-table th,
.project-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.project-table th {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  background: var(--bg-muted);
}

.project-table tr:hover {
  background: var(--bg-muted);
}

.project-value {
  color: var(--success);
  font-weight: 600;
}

.project-area {
  display: inline-block;
  padding: 2px 8px;
  background: var(--bg-muted);
  border-radius: var(--radius-sm);
  font-size: 12px;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
}

.pagination-info {
  font-size: 14px;
  color: var(--text-secondary);
}

.pagination-controls {
  display: flex;
  gap: 8px;
}

/* Loading & Error */
.loading {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
}

.error-message {
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-md);
  color: var(--error);
  margin-bottom: 16px;
}

.empty-message {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.2s;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/css/styles.css
git commit -m "feat: add modern CSS with sidebar and shadcn-inspired design"
```

---

### Task F2: Update index.html with new layout structure

**Files:**
- Modify: `frontend/index.html`

- [ ] **Step 1: Update index.html**

```html
<!DOCTYPE html>
<html lang="en" ng-app="gleniganApp">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Glenigan Project Browser</title>
    <link rel="stylesheet" href="css/styles.css">
    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.2/angular.min.js"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.8.2/angular-route.min.js"></script>
</head>
<body>
    <!-- Sidebar -->
    <aside class="sidebar" ng-include="'ts/shared/sidebar.html'"></aside>
    
    <!-- Main Content -->
    <main class="main-content">
        <ng-view></ng-view>
    </main>

    <script src="dist/app/app.js"></script>
    <script src="dist/core/services/projectService.js"></script>
    <script src="dist/shared/sidebar.js"></script>
    <script src="dist/shared/filterPanel.js"></script>
    <script src="dist/features/dashboard/dashboard.js"></script>
    <script src="dist/features/project-list/controllers/projectListController.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/index.html
git commit -m "feat: update index.html with sidebar layout"
```

---

### Task F3: Create sidebar component

**Files:**
- Create: `frontend/ts/shared/sidebar.html`
- Create: `frontend/ts/shared/sidebar.ts`

- [ ] **Step 1: Create sidebar.html**

```html
<div class="sidebar-header">
    <div class="sidebar-logo">Glenigan</div>
</div>
<nav class="sidebar-nav">
    <a class="nav-item" ng-class="{active: $location.path() === '/'}" href="#!/">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        Projects
    </a>
    <a class="nav-item" ng-class="{active: $location.path() === '/dashboard'}" href="#!/dashboard">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
        Dashboard
    </a>
</nav>
```

- [ ] **Step 2: Create sidebar.ts**

```typescript
declare var angular: any;

var sidebarModule = angular.module('gleniganApp.sidebar', []);

sidebarModule.directive('sidebar', ['$location', function($location: any) {
    return {
        restrict: 'E',
        templateUrl: 'ts/shared/sidebar.html',
        link: function(scope: any) {
            scope.$location = $location;
        }
    };
}]);
```

- [ ] **Step 3: Update app.ts to include sidebar module**

Modify `frontend/ts/app/app.ts`:
```typescript
var appModule = angular.module('gleniganApp', ['ngRoute', 'gleniganApp.sidebar']);
```

Add route for dashboard:
```typescript
appModule.config(['$routeProvider', function($routeProvider: any) {
  $routeProvider
    .when('/', {
      templateUrl: 'ts/features/project-list/project-list.html',
      controller: 'ProjectListController'
    })
    .when('/dashboard', {
      templateUrl: 'ts/features/dashboard/dashboard.html',
      controller: 'DashboardController'
    })
    .otherwise({
      redirectTo: '/'
    });
}]);
```

- [ ] **Step 4: Build and test**

```bash
cd frontend && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add frontend/ts/shared/sidebar.html frontend/ts/shared/sidebar.ts frontend/ts/app/app.ts
git commit -m "feat: add sidebar component"
```

---

### Task F4: Update projectService with new filter support

**Files:**
- Modify: `frontend/ts/core/services/projectService.ts`

- [ ] **Step 1: Update projectService**

```typescript
declare var angular: any;

interface ProjectParams {
  area?: string;
  keyword?: string;
  page?: number;
  per_page?: number;
  company?: string;
  minValue?: number;
  maxValue?: number;
  startDateFrom?: string;
  startDateTo?: string;
}

interface ProjectService {
  getProjects(params: ProjectParams): angular.IPromise<any>;
  getAreas(): angular.IPromise<any>;
  getCompanies(): angular.IPromise<any>;
}

appModule.factory('ProjectService', ['$http', function($http: angular.IHttpService): ProjectService {
  return {
    getProjects: function(params: ProjectParams): angular.IPromise<any> {
      return $http.get('/api/projects', { params }).then(response => response.data);
    },
    
    getAreas: function(): angular.IPromise<any> {
      return $http.get('/api/areas').then(response => response.data);
    },
    
    getCompanies: function(): angular.IPromise<any> {
      return $http.get('/api/companies').then(response => response.data);
    }
  };
}]);
```

- [ ] **Step 2: Build**

```bash
cd frontend && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add frontend/ts/core/services/projectService.ts
git commit -m "feat: add getCompanies and filter params to ProjectService"
```

---

### Task F5: Update project list controller with advanced filters

**Files:**
- Modify: `frontend/ts/features/project-list/controllers/projectListController.ts`
- Modify: `frontend/ts/features/project-list/project-list.html`

- [ ] **Step 1: Update projectListController.ts**

```typescript
declare var angular: any;

interface ProjectListScope extends ng.IScope {
  projects: any[];
  pagination: any;
  filters: {
    keyword: string;
    area: string;
    company: string;
    minValue: string;
    maxValue: string;
    startDateFrom: string;
    startDateTo: string;
  };
  areas: string[];
  companies: string[];
  loading: boolean;
  error: string;
  emptyMessage: string;
  showFilters: boolean;
  search: () => void;
  clearFilters: () => void;
  nextPage: () => void;
  prevPage: () => void;
}

appModule.controller('ProjectListController', ['$scope', 'ProjectService', function($scope: ProjectListScope, ProjectService: any) {
  $scope.projects = [];
  $scope.filters = {
    keyword: '',
    area: '',
    company: '',
    minValue: '',
    maxValue: '',
    startDateFrom: '',
    startDateTo: ''
  };
  $scope.loading = false;
  $scope.error = '';
  $scope.emptyMessage = '';
  $scope.pagination = null;
  $scope.areas = [];
  $scope.companies = [];
  $scope.showFilters = false;

  ProjectService.getAreas().then(function(response: any) {
    if (response.areas) {
      $scope.areas = response.areas;
    }
  }).catch(function(_error: any) {
    $scope.areas = [];
  });

  ProjectService.getCompanies().then(function(response: any) {
    if (response.companies) {
      $scope.companies = response.companies;
    }
  }).catch(function(_error: any) {
    $scope.companies = [];
  });

  $scope.search = function() {
    $scope.loading = true;
    $scope.error = '';
    $scope.emptyMessage = '';

    const params: any = {};
    
    if ($scope.filters.keyword) params.keyword = $scope.filters.keyword;
    if ($scope.filters.area) params.area = $scope.filters.area;
    if ($scope.filters.company) params.company = $scope.filters.company;
    if ($scope.filters.minValue) params.minValue = $scope.filters.minValue;
    if ($scope.filters.maxValue) params.maxValue = $scope.filters.maxValue;
    if ($scope.filters.startDateFrom) params.startDateFrom = $scope.filters.startDateFrom;
    if ($scope.filters.startDateTo) params.startDateTo = $scope.filters.startDateTo;
    
    params.page = 1;

    ProjectService.getProjects(params).then(function(response: any) {
      if (response.data && Array.isArray(response.data)) {
        if (response.data.length === 0) {
          $scope.emptyMessage = 'No projects found matching your search criteria.';
        }
        $scope.projects = response.data;
        $scope.pagination = response.pagination;
      } else if (Array.isArray(response)) {
        if (response.length === 0) {
          $scope.emptyMessage = 'No projects found matching your search criteria.';
        }
        $scope.projects = response;
        $scope.pagination = null;
      } else {
        $scope.projects = [];
        $scope.pagination = null;
      }
    }).catch(function(error: any) {
      if (error.status === 404) {
        $scope.error = 'No projects found for the selected filters.';
      } else if (error.status === 429) {
        $scope.error = 'Too many requests. Please try again later.';
      } else if (error.status === 413) {
        $scope.error = 'Too many results. Please narrow your search.';
      } else if (error.status === 0) {
        $scope.error = 'Unable to connect to server. Please check your connection.';
      } else {
        $scope.error = error.data?.message || 'An unexpected error occurred. Please try again.';
      }
    }).finally(function() {
      $scope.loading = false;
    });
  };

  $scope.clearFilters = function() {
    $scope.filters = {
      keyword: '',
      area: '',
      company: '',
      minValue: '',
      maxValue: '',
      startDateFrom: '',
      startDateTo: ''
    };
    $scope.search();
  };

  $scope.nextPage = function() {
    if ($scope.pagination && $scope.pagination.page < $scope.pagination.total_pages) {
      $scope.loading = true;
      const params: any = {};
      
      if ($scope.filters.keyword) params.keyword = $scope.filters.keyword;
      if ($scope.filters.area) params.area = $scope.filters.area;
      if ($scope.filters.company) params.company = $scope.filters.company;
      if ($scope.filters.minValue) params.minValue = $scope.filters.minValue;
      if ($scope.filters.maxValue) params.maxValue = $scope.filters.maxValue;
      if ($scope.filters.startDateFrom) params.startDateFrom = $scope.filters.startDateFrom;
      if ($scope.filters.startDateTo) params.startDateTo = $scope.filters.startDateTo;
      
      params.page = $scope.pagination.page + 1;

      ProjectService.getProjects(params).then(function(response: any) {
        $scope.emptyMessage = '';
        if (response.data) {
          if (response.data.length === 0) {
            $scope.emptyMessage = 'No projects found matching your search criteria.';
          }
          $scope.projects = response.data;
          $scope.pagination = response.pagination;
        }
      }).catch(function(error: any) {
        if (error.status === 0) {
          $scope.error = 'Connection lost. Please try again.';
        } else {
          $scope.error = error.data?.message || 'Failed to load more projects.';
        }
      }).finally(function() {
        $scope.loading = false;
      });
    }
  };

  $scope.prevPage = function() {
    if ($scope.pagination && $scope.pagination.page > 1) {
      $scope.loading = true;
      const params: any = {};
      
      if ($scope.filters.keyword) params.keyword = $scope.filters.keyword;
      if ($scope.filters.area) params.area = $scope.filters.area;
      if ($scope.filters.company) params.company = $scope.filters.company;
      if ($scope.filters.minValue) params.minValue = $scope.filters.minValue;
      if ($scope.filters.maxValue) params.maxValue = $scope.filters.maxValue;
      if ($scope.filters.startDateFrom) params.startDateFrom = $scope.filters.startDateFrom;
      if ($scope.filters.startDateTo) params.startDateTo = $scope.filters.startDateTo;
      
      params.page = $scope.pagination.page - 1;

      ProjectService.getProjects(params).then(function(response: any) {
        $scope.emptyMessage = '';
        if (response.data) {
          if (response.data.length === 0) {
            $scope.emptyMessage = 'No projects found matching your search criteria.';
          }
          $scope.projects = response.data;
          $scope.pagination = response.pagination;
        }
      }).catch(function(error: any) {
        if (error.status === 0) {
          $scope.error = 'Connection lost. Please try again.';
        } else {
          $scope.error = error.data?.message || 'Failed to load previous page.';
        }
      }).finally(function() {
        $scope.loading = false;
      });
    }
  };

  $scope.search();
}]);
```

- [ ] **Step 2: Update project-list.html with advanced filters UI**

```html
<div class="page-header">
    <h1 class="page-title">Projects</h1>
</div>

<div class="filters-section">
    <button class="filters-toggle" ng-click="showFilters = !showFilters">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        {{showFilters ? 'Hide' : 'Show'}} Filters
    </button>
    
    <div class="filters-panel" ng-show="showFilters">
        <div class="filters-grid">
            <div class="filter-group">
                <label class="filter-label">Keyword</label>
                <input type="text" class="filter-input" ng-model="filters.keyword" placeholder="Search...">
            </div>
            <div class="filter-group">
                <label class="filter-label">Area</label>
                <select class="filter-select" ng-model="filters.area">
                    <option value="">All Areas</option>
                    <option ng-repeat="a in areas" value="{{a}}">{{a}}</option>
                </select>
            </div>
            <div class="filter-group">
                <label class="filter-label">Company</label>
                <select class="filter-select" ng-model="filters.company">
                    <option value="">All Companies</option>
                    <option ng-repeat="c in companies" value="{{c}}">{{c}}</option>
                </select>
            </div>
            <div class="filter-group">
                <label class="filter-label">Min Value (£)</label>
                <input type="number" class="filter-input" ng-model="filters.minValue" placeholder="0">
            </div>
            <div class="filter-group">
                <label class="filter-label">Max Value (£)</label>
                <input type="number" class="filter-input" ng-model="filters.maxValue" placeholder="999999999">
            </div>
            <div class="filter-group">
                <label class="filter-label">Start Date From</label>
                <input type="date" class="filter-input" ng-model="filters.startDateFrom">
            </div>
            <div class="filter-group">
                <label class="filter-label">Start Date To</label>
                <input type="date" class="filter-input" ng-model="filters.startDateTo">
            </div>
        </div>
        <div class="filters-actions">
            <button class="btn btn-secondary" ng-click="clearFilters()">Clear</button>
            <button class="btn btn-primary" ng-click="search()">Apply Filters</button>
        </div>
    </div>
</div>

<div class="card" ng-if="!loading && !error && !emptyMessage">
    <table class="project-table">
        <thead>
            <tr>
                <th>Project Name</th>
                <th>Company</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Value</th>
                <th>Area</th>
            </tr>
        </thead>
        <tbody>
            <tr ng-repeat="project in projects">
                <td>{{project.project_name}}</td>
                <td>{{project.company}}</td>
                <td>{{project.project_start}}</td>
                <td>{{project.project_end}}</td>
                <td class="project-value">£{{project.project_value | number}}</td>
                <td><span class="project-area">{{project.area}}</span></td>
            </tr>
        </tbody>
    </table>
    <div class="pagination" ng-if="pagination.total_pages > 1">
        <span class="pagination-info">Page {{pagination.page}} of {{pagination.total_pages}}</span>
        <div class="pagination-controls">
            <button class="btn btn-secondary" ng-click="prevPage()" ng-disabled="pagination.page <= 1">Previous</button>
            <button class="btn btn-secondary" ng-click="nextPage()" ng-disabled="pagination.page >= pagination.total_pages">Next</button>
        </div>
    </div>
</div>

<div class="loading" ng-if="loading">
    Loading projects...
</div>

<div class="error-message" ng-if="error">
    {{error}}
</div>

<div class="empty-message" ng-if="emptyMessage">
    {{emptyMessage}}
</div>
```

- [ ] **Step 3: Build**

```bash
cd frontend && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add frontend/ts/features/project-list/controllers/projectListController.ts frontend/ts/features/project-list/project-list.html
git commit -m "feat: add advanced filters to project list"
```

---

### Task F6: Create dashboard page

**Files:**
- Create: `frontend/ts/features/dashboard/dashboard.html`
- Create: `frontend/ts/features/dashboard/dashboard.ts`

- [ ] **Step 1: Create dashboard.ts**

```typescript
declare var angular: any;

appModule.controller('DashboardController', ['$scope', 'ProjectService', function($scope: any, ProjectService: any) {
  $scope.stats = {
    totalProjects: 0,
    totalValue: 0,
    areasCount: 0,
    companiesCount: 0
  };
  $scope.loading = true;

  ProjectService.getProjects({ per_page: 1 }).then(function(response: any) {
    if (response.pagination) {
      $scope.stats.totalProjects = response.pagination.total;
    }
  }).finally(function() {
    $scope.loading = false;
  });

  ProjectService.getAreas().then(function(response: any) {
    if (response.areas) {
      $scope.stats.areasCount = response.areas.length;
    }
  });

  ProjectService.getCompanies().then(function(response: any) {
    if (response.companies) {
      $scope.stats.companiesCount = response.companies.length;
    }
  });
}]);
```

- [ ] **Step 2: Create dashboard.html**

```html
<div class="page-header">
    <h1 class="page-title">Dashboard</h1>
</div>

<div class="loading" ng-if="loading">
    Loading...
</div>

<div class="stats-grid" ng-if="!loading">
    <div class="card stat-card">
        <div class="stat-value">{{stats.totalProjects | number}}</div>
        <div class="stat-label">Total Projects</div>
    </div>
    <div class="card stat-card">
        <div class="stat-value">{{stats.areasCount}}</div>
        <div class="stat-label">Areas</div>
    </div>
    <div class="card stat-card">
        <div class="stat-value">{{stats.companiesCount}}</div>
        <div class="stat-label">Companies</div>
    </div>
</div>

<style>
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}
.stat-card {
    padding: 24px;
    text-align: center;
}
.stat-value {
    font-size: 32px;
    font-weight: 600;
    color: var(--accent-primary);
}
.stat-label {
    font-size: 14px;
    color: var(--text-secondary);
    margin-top: 8px;
}
</style>
```

- [ ] **Step 3: Add CSS for stats**

Add to `styles.css`:
```css
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}

.stat-card {
    padding: 24px;
    text-align: center;
}

.stat-value {
    font-size: 32px;
    font-weight: 600;
    color: var(--accent-primary);
}

.stat-label {
    font-size: 14px;
    color: var(--text-secondary);
    margin-top: 8px;
}
```

- [ ] **Step 4: Build and commit**

```bash
cd frontend && npm run build
git add frontend/ts/features/dashboard/
git commit -m "feat: add dashboard page with stats"
```

---

## Spec Coverage Check

| Spec Requirement | Task |
|-------------------|------|
| shadcn UI dashboard with sidebar | Task F1, F3 |
| Sidebar navigation (Projects, Dashboard) | Task F3 |
| Advanced filters (company, value range, date range, keyword searches description) | Task B2, F4, F5 |
| Modern CSS styling | Task F1 |

---

## Execution Choice

**Plan complete and saved to `docs/superpowers/plans/2026-04-02-glenigan-frontend-modernization.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**