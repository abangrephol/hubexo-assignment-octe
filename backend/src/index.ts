import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase } from './db/database';
import projectsRouter from './routes/projects';
import { requestTimeout, requestLogger } from './middleware/timeout';
import { rateLimiter } from './middleware/rateLimit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || '3000';

app.use(requestTimeout);
app.use(requestLogger);

app.use(cors());
app.use(express.json());

const apiRouter = express.Router();
apiRouter.use(rateLimiter);

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

apiRouter.use(projectsRouter);

app.use('/api', apiRouter);

app.use(express.static(path.join(__dirname, '../../frontend')));

// Serve index.html for non-API routes
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'SERVER_ERROR',
    message: 'Internal server error'
  });
});

let server: ReturnType<typeof app.listen> | null = null;

async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized');

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function shutdown() {
  console.log('Shutting down gracefully...');
  
  if (server) {
    server.close(() => {
      console.log('Server closed');
    });
  }

  const database = await import('./db/database');
  if (database.getDatabase) {
    database.getDatabase().close();
    console.log('Database connection closed');
  }

  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();