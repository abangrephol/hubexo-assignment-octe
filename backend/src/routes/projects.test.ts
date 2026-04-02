import express, { Express } from 'express';
import request from 'supertest';
import projectsRouter from './projects';

jest.mock('../db/database', () => ({
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
  getAll: jest.fn()
}));

const app: Express = express();
app.use(express.json());
app.use('/api', projectsRouter);

const { getAll } = require('../db/database');

describe('GET /api/projects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated response with default page', async () => {
    getAll
      .mockResolvedValueOnce([{ total: 100 }])
      .mockResolvedValueOnce([{ project_name: 'Test', project_start: '2025-01-01', project_end: '2025-12-31', company: 'Co', description: 'desc', project_value: 100, area: 'London' }]);

    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.total).toBe(100);
  });

  it('accepts pagination parameters', async () => {
    getAll.mockResolvedValueOnce([{ total: 50 }]).mockResolvedValueOnce([]);
    const res = await request(app).get('/api/projects?page=2&per_page=10');
    expect(res.body.pagination.page).toBe(2);
    expect(res.body.pagination.per_page).toBe(10);
  });

  it('filters by area', async () => {
    getAll.mockResolvedValueOnce([{ total: 20 }]).mockResolvedValueOnce([]);
    const res = await request(app).get('/api/projects?area=London');
    expect(getAll).toHaveBeenCalledWith(expect.stringContaining('pam.area = ?'), ['London']);
  });

  it('filters by keyword searching name and description', async () => {
    getAll.mockResolvedValueOnce([{ total: 5 }]).mockResolvedValueOnce([]);
    const res = await request(app).get('/api/projects?keyword=Bridge');
    expect(getAll).toHaveBeenCalledWith(expect.stringContaining('project_name LIKE ? OR p.description LIKE ?'), ['%Bridge%', '%Bridge%']);
  });

  it('filters by company', async () => {
    getAll.mockResolvedValueOnce([{ total: 10 }]).mockResolvedValueOnce([]);
    const res = await request(app).get('/api/projects?company=NorthBuild%20Ltd');
    expect(getAll).toHaveBeenCalledWith(expect.stringContaining('c.company_name = ?'), ['NorthBuild Ltd']);
  });

  it('filters by minValue', async () => {
    getAll.mockResolvedValueOnce([{ total: 5 }]).mockResolvedValueOnce([]);
    const res = await request(app).get('/api/projects?minValue=1000000');
    expect(getAll).toHaveBeenCalledWith(expect.stringContaining('p.project_value >= ?'), [1000000]);
  });

  it('filters by maxValue', async () => {
    getAll.mockResolvedValueOnce([{ total: 5 }]).mockResolvedValueOnce([]);
    const res = await request(app).get('/api/projects?maxValue=500000');
    expect(getAll).toHaveBeenCalledWith(expect.stringContaining('p.project_value <= ?'), [500000]);
  });

  it('filters by startDateFrom', async () => {
    getAll.mockResolvedValueOnce([{ total: 5 }]).mockResolvedValueOnce([]);
    const res = await request(app).get('/api/projects?startDateFrom=2025-01-01');
    expect(getAll).toHaveBeenCalledWith(expect.stringContaining('p.project_start >= ?'), ['2025-01-01']);
  });

  it('filters by startDateTo', async () => {
    getAll.mockResolvedValueOnce([{ total: 5 }]).mockResolvedValueOnce([]);
    const res = await request(app).get('/api/projects?startDateTo=2025-12-31');
    expect(getAll).toHaveBeenCalledWith(expect.stringContaining('p.project_start <= ?'), ['2025-12-31']);
  });

  it('filters by multiple combined filters', async () => {
    getAll.mockResolvedValueOnce([{ total: 3 }]).mockResolvedValueOnce([]);
    const res = await request(app).get('/api/projects?area=London&keyword=Bridge&company=NorthBuild%20Ltd&minValue=1000000&maxValue=5000000&startDateFrom=2025-01-01&startDateTo=2025-12-31');
    const lastCall = getAll.mock.calls[1];
    expect(lastCall[0]).toContain('pam.area = ?');
    expect(lastCall[0]).toContain('project_name LIKE ? OR p.description LIKE ?');
    expect(lastCall[0]).toContain('c.company_name = ?');
    expect(lastCall[0]).toContain('p.project_value >= ?');
    expect(lastCall[0]).toContain('p.project_value <= ?');
    expect(lastCall[0]).toContain('p.project_start >= ?');
    expect(lastCall[0]).toContain('p.project_start <= ?');
  });

  it('returns 404 when no projects found for area', async () => {
    getAll.mockResolvedValueOnce([{ total: 0 }]);
    const res = await request(app).get('/api/projects?area=NonExistent');
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid page', async () => {
    const res = await request(app).get('/api/projects?page=-1');
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid per_page', async () => {
    const res = await request(app).get('/api/projects?per_page=200');
    expect(res.status).toBe(400);
  });

  it('returns all records when all=true', async () => {
    getAll.mockResolvedValueOnce([{ total: 5 }]);
    getAll.mockResolvedValueOnce([{ project_name: 'P1' }]);
    const res = await request(app).get('/api/projects?all=true');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 413 when all=true exceeds max records', async () => {
    getAll.mockResolvedValueOnce([{ total: 10001 }]);
    const res = await request(app).get('/api/projects?all=true');
    expect(res.status).toBe(413);
  });
});

describe('GET /api/areas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns list of unique areas', async () => {
    getAll.mockResolvedValueOnce([{ area: 'London' }, { area: 'Manchester' }]);
    const res = await request(app).get('/api/areas');
    expect(res.body.areas).toEqual(['London', 'Manchester']);
  });

  it('returns empty array when no areas', async () => {
    getAll.mockResolvedValueOnce([]);
    const res = await request(app).get('/api/areas');
    expect(res.body.areas).toEqual([]);
  });
});

describe('GET /api/companies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns list of unique companies', async () => {
    getAll.mockResolvedValueOnce([{ company_name: 'NorthBuild Ltd' }, { company_name: 'Beacon' }]);
    const res = await request(app).get('/api/companies');
    expect(res.body.companies).toEqual(['NorthBuild Ltd', 'Beacon']);
  });

  it('returns empty array when no companies', async () => {
    getAll.mockResolvedValueOnce([]);
    const res = await request(app).get('/api/companies');
    expect(res.body.companies).toEqual([]);
  });
});