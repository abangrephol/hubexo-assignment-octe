import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

const TIMEOUT_MS = 30000;

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export function requestTimeout(req: Request, res: Response, next: NextFunction) {
  const requestId = uuidv4();

  res.setHeader('X-Request-Id', requestId);

  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        error: 'REQUEST_TIMEOUT',
        message: `Request exceeded ${TIMEOUT_MS}ms timeout`
      });
    }
  }, TIMEOUT_MS);

  req.requestId = requestId;

  res.on('finish', () => {
    clearTimeout(timeoutId);
  });

  res.on('close', () => {
    clearTimeout(timeoutId);
  });

  next();
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logEntry = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    };

    if (res.statusCode >= 400) {
      console.error(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  });

  next();
}