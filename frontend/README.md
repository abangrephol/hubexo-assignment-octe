# Frontend - Glenigan Project Browser

AngularJS 1.8.x single-page application for browsing construction projects.

## Quick Start

The frontend is served statically by the backend server.

1. Build frontend: `cd frontend && npm install && npm run build`
2. Start the backend: `cd backend && npm install && npm run build && npm start`
3. Open `http://localhost:3000` in your browser

## Project Structure

```
ts/                          # TypeScript source
├── app/
│   └── app.ts
├── core/
│   └── services/
│       └── projectService.ts
└── features/
    └── project-list/
        ├── project-list.html
        └── controllers/
            └── projectListController.ts

dist/                        # Compiled JavaScript (generated)
├── app/
├── core/
└── features/

index.html                   # Main HTML
css/
└── styles.css
```

## Build

```bash
cd frontend
npm install
npm run build    # Compiles TypeScript to dist/
npm run watch    # Watch mode for development
```

Then update index.html to point to `dist/` files.

## Features

- **Project List** - Displays projects with name, company, dates, value, area
- **Search** - Filter by project name keyword
- **Area Filter** - Dropdown to filter by UK city area
- **Pagination** - Navigate through pages of results
- **Loading States** - Shows loading indicator during API calls
- **Error Handling** - Displays error messages when API calls fail

## Architecture

- **AngularJS 1.8.x** - MVC framework
- **TypeScript** - Type-safe development
- **Folder-by-Feature** - Modular structure
- **Plain CSS** - Minimal styling

### Data Flow

1. User clicks "Search" button
2. Controller calls `ProjectService.getProjects(params)`
3. Service makes HTTP request to `/api/projects`
4. Controller receives response and updates `$scope`
5. View automatically re-renders via data binding

## API Integration

The frontend communicates with the backend API at `http://localhost:3000/api`.

### ProjectService

```typescript
getProjects(params: {
  area?: string;
  keyword?: string;
  page?: number;
  per_page?: number;
}): Promise<any>
```

### Response Handling

The service handles both paginated and non-paginated responses:

```typescript
if (response.data) {
  // Paginated response
  this.projects = response.data;
  this.pagination = response.pagination;
} else {
  // Non-paginated (all records)
  this.projects = response;
  this.pagination = null;
}
```

## Areas

Available filter options:
- Birmingham, Bristol, Cardiff, Edinburgh, Glasgow, Leeds, Liverpool, London, Manchester, Newcastle