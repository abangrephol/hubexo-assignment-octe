# Frontend - Glenigan Project Browser

AngularJS 1.8.x single-page application with modern shadcn-inspired UI.

## Quick Start

The frontend is served statically by the backend server.

1. Build frontend: `cd frontend && npm install && npm run build`
2. Start the backend: `cd backend && npm install && npm run build && npm start`
3. Open `http://localhost:3000` in your browser

## Build

```bash
cd frontend
npm install
npm run build    # Compiles TypeScript to dist/
```

## Project Structure (Folder-by-Feature)

```
ts/
├── app/
│   └── app.ts               # AngularJS module with routing
├── core/
│   └── services/
│       └── projectService.ts  # API service
├── features/
│   ├── project-list/
│   │   ├── project-list.html    # Project list template
│   │   └── controllers/
│   │       └── projectListController.ts
│   └── dashboard/
│       ├── dashboard.html
│       └── dashboard.ts
└── shared/
    └── sidebar.html         # Sidebar component

dist/                       # Compiled JavaScript (generated)
index.html                   # Main HTML with sidebar layout
css/
└── styles.css              # Modern shadcn-inspired CSS
```

## Features

### Project List Page
- **Quick Search** - Standalone search bar, press Enter to search
- **Advanced Filters** - Collapsible panel with:
  - Area dropdown
  - Company dropdown
  - Min/Max value range
  - Start date range
- **Project Table** - Name, Company, Description, Start Date, End Date, Value, Area
- **Pagination** - Navigate through pages
- **Date Formatting** - Displayed as MM/DD/YYYY

### Dashboard Page
- Statistics: Total Projects, Areas, Companies

### UI Components
- Sidebar navigation (Projects, Dashboard)
- Responsive design
- Loading states and error handling

## Architecture

- **AngularJS 1.8.x** - MVC framework
- **TypeScript** - Type-safe development
- **Folder-by-Feature** - Modular structure
- **Plain CSS with Variables** - shadcn-inspired design

### Data Flow

1. User enters search/selects filters and clicks "Apply" (or presses Enter for quick search)
2. Controller calls `ProjectService.getProjects(params)`
3. Service makes HTTP request to `/api/projects`
4. Controller receives response and updates `$scope`
5. View automatically re-renders via data binding

## API Integration

### ProjectService

```typescript
getProjects(params: {
  area?: string;
  keyword?: string;
  company?: string;
  minValue?: number;
  maxValue?: number;
  startDateFrom?: string;
  startDateTo?: string;
  page?: number;
  per_page?: number;
}): Promise<any>

getAreas(): Promise<any>
getCompanies(): Promise<any>
```

### Response Handling

The service handles paginated responses with proper data extraction:

```typescript
// response.data contains { data: [...], pagination: {...} }
$scope.projects = response.data.data;
$scope.pagination = response.data.pagination;
```

## Available Filters

| Filter | Source |
|--------|--------|
| Areas | `/api/areas` - 10 UK cities |
| Companies | `/api/companies` - 8 companies |
| Value Range | Min/Max numeric input |
| Date Range | Start date from/to |
| Keyword | Searches name AND description |

## Quick Search vs Advanced Filters

- **Quick Search** (search bar): Immediate search on Enter key, searches keyword only
- **Advanced Filters** (Filters button): Full filter panel, combines all filter options