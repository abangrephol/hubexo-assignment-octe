import initSqlJs, { Database, SqlValue } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';

let db: Database | null = null;

export async function initializeDatabase(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs();
  const dbPath = path.resolve(__dirname, '../../.env');
  const envContent = fs.readFileSync(dbPath, 'utf-8');
  const dbFilePath = envContent.split('\n').find(line => line.startsWith('DB_PATH='))?.split('=')[1]?.trim();
  
  if (!dbFilePath) {
    throw new Error('DB_PATH not found in .env file');
  }

  const absoluteDbPath = path.resolve(__dirname, '../../', dbFilePath);
  const fileBuffer = fs.readFileSync(absoluteDbPath);
  db = new SQL.Database(fileBuffer);

  return db;
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function runQuery(sql: string, params: SqlValue[] = []): Promise<void> {
  const database = getDatabase();
  database.run(sql, params);
}

export async function getOne<T>(sql: string, params: SqlValue[] = []): Promise<T | null> {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  
  if (stmt.step()) {
    const row = stmt.getAsObject() as T;
    stmt.free();
    return row;
  }
  
  stmt.free();
  return null;
}

export async function getAll<T>(sql: string, params: SqlValue[] = []): Promise<T[]> {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  
  stmt.free();
  return results;
}