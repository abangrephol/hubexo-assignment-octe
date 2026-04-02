import { Router, Request, Response } from 'express';
import { initializeDatabase, getAll } from '../db/database';

const router = Router();

interface ProjectRow {
  project_name: string;
  project_start: string | null;
  project_end: string | null;
  company: string;
  description: string | null;
  project_value: number | null;
  area: string;
}

interface PaginatedResponse {
  data: ProjectRow[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

async function ensureDatabase() {
  try {
    await initializeDatabase();
  } catch (error) {
    throw new Error('Database connection failed');
  }
}

router.get('/projects', async (req: Request, res: Response) => {
  try {
    await ensureDatabase();

    const { area, keyword, page, per_page, all } = req.query;

    const fetchAll = all === 'true';

    if (page !== undefined && !fetchAll) {
      const pageNum = Number(page);
      if (!Number.isInteger(pageNum) || pageNum < 1) {
        return res.status(400).json({
          error: 'INVALID_PARAMS',
          message: 'page must be a positive integer'
        });
      }
    }

    if (per_page !== undefined && !fetchAll) {
      const perPageNum = Number(per_page);
      if (!Number.isInteger(perPageNum) || perPageNum < 1 || perPageNum > 100) {
        return res.status(400).json({
          error: 'INVALID_PARAMS',
          message: 'per_page must be an integer between 1 and 100'
        });
      }
    }

    if (all !== undefined && all !== 'true' && all !== 'false') {
      return res.status(400).json({
        error: 'INVALID_PARAMS',
        message: 'all must be a boolean (true or false)'
      });
    }

    let whereConditions: string[] = [];
    let params: (string | number)[] = [];

    if (area) {
      whereConditions.push('pam.area = ?');
      params.push(String(area));
    }

    if (keyword) {
      whereConditions.push('p.project_name LIKE ?');
      params.push(`%${keyword}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const effectivePerPage = per_page ? Number(per_page) : 20;
    const effectivePage = page ? Number(page) : 1;
    const isPaginated = !fetchAll;
    const MAX_RECORDS = 10000;

    const countSql = `
      SELECT COUNT(*) as total
      FROM projects p
      LEFT JOIN companies c ON p.company_id = c.company_id
      LEFT JOIN project_area_map pam ON p.project_id = pam.project_id
      ${whereClause}
    `;

    const countResult = await getAll<{ total: number }>(countSql, params);
    const total = countResult[0]?.total || 0;

    if (fetchAll && total > MAX_RECORDS) {
      return res.status(413).json({
        error: 'PAYLOAD_TOO_LARGE',
        message: `Request exceeds maximum of ${MAX_RECORDS} records. Use pagination or narrow your filters.`
      });
    }

    if (isPaginated) {
      const offset = (effectivePage - 1) * effectivePerPage;
      const totalPages = Math.ceil(total / effectivePerPage);

      const dataSql = `
        SELECT 
          p.project_name,
          p.project_start,
          p.project_end,
          c.company_name as company,
          p.description,
          p.project_value,
          pam.area
        FROM projects p
        LEFT JOIN companies c ON p.company_id = c.company_id
        LEFT JOIN project_area_map pam ON p.project_id = pam.project_id
        ${whereClause}
        LIMIT ? OFFSET ?
      `;

      const dataParams = [...params, effectivePerPage, offset];
      const data = await getAll<ProjectRow>(dataSql, dataParams);

      if (total === 0) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'No projects found matching your search criteria.'
        });
      }

      const response: PaginatedResponse = {
        data,
        pagination: {
          page: effectivePage,
          per_page: effectivePerPage,
          total,
          total_pages: totalPages
        }
      };

      return res.json(response);
    }

    const sql = `
      SELECT 
        p.project_name,
        p.project_start,
        p.project_end,
        c.company_name as company,
        p.description,
        p.project_value,
        pam.area
      FROM projects p
      LEFT JOIN companies c ON p.company_id = c.company_id
      LEFT JOIN project_area_map pam ON p.project_id = pam.project_id
      ${whereClause}
    `;

    const results = await getAll<ProjectRow>(sql, params);

    if (results.length === 0) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'No projects found matching your search criteria.'
      });
    }

    return res.json(results);

  } catch (error: any) {
    if (error.message === 'Database connection failed') {
      return res.status(500).json({
        error: 'SERVER_ERROR',
        message: 'Database connection failed'
      });
    }
    console.error('Error fetching projects:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Internal server error'
    });
  }
});

router.get('/areas', async (_req: Request, res: Response) => {
  try {
    await ensureDatabase();

    const sql = `SELECT DISTINCT area FROM project_area_map ORDER BY area`;
    const results = await getAll<{ area: string }>(sql, []);
    const areas = results.map(row => row.area).filter(Boolean);

    res.json({ areas });
  } catch (error: any) {
    if (error.message === 'Database connection failed') {
      return res.status(500).json({
        error: 'SERVER_ERROR',
        message: 'Database connection failed'
      });
    }
    console.error('Error fetching areas:', error);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Internal server error'
    });
  }
});

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

export default router;
