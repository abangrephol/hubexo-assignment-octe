import { Request, Response, NextFunction } from 'express';
import { requestTimeout, requestLogger } from '../middleware/timeout';

jest.mock('uuid', () => ({
  v4: () => 'test-uuid-1234'
}));

describe('requestTimeout middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      requestId: 'test-uuid-1234',
      startTime: Date.now()
    } as Partial<Request>;

    mockRes = {
      setHeader: jest.fn(),
      headersSent: false,
      on: jest.fn()
    } as unknown as Partial<Response>;

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('should set X-Request-Id header and call next', () => {
    jest.useFakeTimers();

    requestTimeout(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-Id', 'test-uuid-1234');
    expect(mockNext).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should attach requestId to request', () => {
    jest.useFakeTimers();

    const req = {} as Request;
    const res = { 
      setHeader: jest.fn(), 
      headersSent: false,
      on: jest.fn()
    } as unknown as Response;

    requestTimeout(req, res, mockNext);

    expect(req.requestId).toBe('test-uuid-1234');

    jest.useRealTimers();
  });
});

describe('requestLogger middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    mockReq = {
      requestId: 'test-uuid-1234',
      method: 'GET',
      originalUrl: '/api/projects',
      ip: '127.0.0.1'
    } as Partial<Request>;

    mockRes = {
      statusCode: 200,
      on: jest.fn((event: string, callback: Function) => {
        if (event === 'finish') {
          callback();
        }
        return mockRes;
      })
    } as unknown as Partial<Response>;

    mockNext = jest.fn();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should call next and setup finish listener', () => {
    requestLogger(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });
});