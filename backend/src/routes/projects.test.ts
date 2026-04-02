import express, { Express } from 'express';
import request from 'supertest';
import projectsRouter from './projects';

// Mock the database module
jest.mock('../db/database', () => ({
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
  getAll: jest.fn()
}));

const app: Express = express();
app.use(express.json());
app.use('/api', projectsRouter);

describe('GET /api/projects', () => {
  const { getAll } = require('../db/database');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return paginated response with default page', async () => {
    (getAll as jest.Mock)
      .mockResolvedValueOnce([{ total: 100 }]) // count query
      .mockResolvedValueOnce([ // data query
        { project_name: 'Test Project', project_start: '2025-01-01', project_end: '2025-12-31', company: 'Test Co', description: 'Test', project_value: 100000, area: 'London' }
      ]);

    const response = await request(app).get('/api/projects');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination).toEqual({
      page: 1,
      per_page: 20,
      total: 100,
      total_pages: 5
    });
  });

  it('should accept pagination parameters', async () => {
    (getAll as jest.Mock)
      .mockResolvedValueOnce([{ total: 50 }])
      .mockResolvedValueOnce([]);

    const response = await request(app).get('/api/projects?page=2&per_page=10');

    expect(response.status).toBe(200);
    expect(response.body.pagination.page).toBe(2);
    expect(response.body.pagination.per_page).toBe(10);
  });

  it('should filter by area', async () => {
    (getAll as jest.Mock)
      .mockResolvedValueOnce([{ total: 20 }])
      .mockResolvedValueOnce([]);

    const response = await request(app).get('/api/projects?area=London');

    expect(response.status).toBe(200);
    expect(getAll).toHaveBeenCalledWith(
      expect.stringContaining('pam.area = ?'),
      ['London']
    );
  });

  it('should filter by keyword', async () => {
    (getAll as jest.Mock)
      .mockResolvedValueOnce([{ total: 5 }])
      .mockResolvedValueOnce([]);

    const response = await request(app).get('/api/projects?keyword=Bridge');

    expect(response.status).toBe(200);
    expect(getAll).toHaveBeenCalledWith(
      expect.stringContaining('project_name LIKE ?'),
      ['%Bridge%']
    );
  });

  it('should return 404 when no projects found for area', async () => {
    (getAll as jest.Mock).mockResolvedValueOnce([{ total: 0 }]);

    const response = await request(app).get('/api/projects?area=NonExistent');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('NOT_FOUND');
  });

  it('should return 400 for invalid page parameter', async () => {
    const response = await request(app).get('/api/projects?page=-1');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('INVALID_PARAMS');
  });

  it('should return 400 for invalid per_page parameter', async () => {
    const response = await request(app).get('/api/projects?per_page=200');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('INVALID_PARAMS');
  });

  it('should return all records when all=true', async () => {
    (getAll as jest.Mock).mockResolvedValueOnce([{ total: 5 }]);
    (getAll as jest.Mock).mockResolvedValueOnce([
      { project_name: 'Project 1', project_start: '2025-01-01', project_end: '2025-12-31', company: 'Co1', description: 'Desc1', project_value: 100, area: 'London' },
      { project_name: 'Project 2', project_start: '2025-01-01', project_end: '2025-12-31', company: 'Co2', description: 'Desc2', project_value: 200, area: 'London' }
    ]);

    const response = await request(app).get('/api/projects?all=true');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(2);
  });

  it('should return 413 when all=true exceeds max records', async () => {
    (getAll as jest.Mock).mockResolvedValueOnce([{ total: 10001 }]);

    const response = await request(app).get('/api/projects?all=true');

    expect(response.status).toBe(413);
    expect(response.body.error).toBe('PAYLOAD_TOO_LARGE');
  });
});

describe('GET /api/areas', () => {
  const { getAll } = require('../db/database');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of unique areas', async () => {
    (getAll as jest.Mock).mockResolvedValueOnce([
      { area: 'London' },
      { area: 'Manchester' },
      { area: 'Birmingham' }
    ]);

    const response = await request(app).get('/api/areas');

    expect(response.status).toBe(200);
    expect(response.body.areas).toEqual(['London', 'Manchester', 'Birmingham']);
  });

  it('should return empty array when no areas', async () => {
    (getAll as jest.Mock).mockResolvedValueOnce([]);

    const response = await request(app).get('/api/areas');

    expect(response.status).toBe(200);
    expect(response.body.areas).toEqual([]);
  });
});