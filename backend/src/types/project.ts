/**
 * TypeScript interfaces for Glenigan Project Browser API
 */

export interface Project {
  id: number;
  project_id: string;
  name: string;
  description: string | null;
  status: string | null;
  sector: string | null;
  region: string | null;
  county: string | null;
  address: string | null;
  postcode: string | null;
  value_low: number | null;
  value_high: number | null;
  start_date: string | null;
  end_date: string | null;
  company: string | null;
  created_at: string | null;
}

export interface ProjectQueryParams {
  search?: string;
  sector?: string;
  region?: string;
  county?: string;
  status?: string;
  minValue?: number;
  maxValue?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}