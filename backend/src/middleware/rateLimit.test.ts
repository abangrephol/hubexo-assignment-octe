import { Request, Response, NextFunction } from 'express';
import { rateLimiter } from '../middleware/rateLimit';

describe('rateLimiter middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let setHeaderMock: jest.Mock;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    setHeaderMock = jest.fn();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      ip: '127.0.0.1'
    } as Partial<Request>;

    mockRes = {
      setHeader: setHeaderMock,
      status: statusMock,
      json: jsonMock
    } as Partial<Response>;

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow request when under rate limit', () => {
    rateLimiter(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
    expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Remaining', 99);
  });

  it('should block request when rate limit exceeded', () => {
    // Simulate multiple requests from same IP
    for (let i = 0; i < 101; i++) {
      rateLimiter(mockReq as Request, mockRes as Response, mockNext);
    }

    expect(statusMock).toHaveBeenCalledWith(429);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded. Try again later.'
    });
  });

  it('should set X-RateLimit headers on response', () => {
    rateLimiter(mockReq as Request, mockRes as Response, mockNext);

    expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
    expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
    expect(setHeaderMock).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
  });

  it('should use default IP when req.ip is undefined', () => {
    Object.defineProperty(mockReq, 'ip', {
      value: undefined,
      writable: true
    });

    rateLimiter(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});