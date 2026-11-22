export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_SERVER_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 400,
    code: ErrorCode = 'BAD_REQUEST',
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, details: Record<string, unknown> = {}): AppError {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Authentication required'): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'You do not have permission to perform this action'): AppError {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static conflict(message: string, details: Record<string, unknown> = {}): AppError {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  static internal(message = 'An unexpected internal error occurred'): AppError {
    return new AppError(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}
