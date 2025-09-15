/**
 * Professional error handling utilities for Jemea Bot
 * Provides custom error classes and error handling helpers
 */

import { logger } from './logger';

export class JemeaBotError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'JemeaBotError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context || {};

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends JemeaBotError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, true, context);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends JemeaBotError {
  constructor(message: string = 'Authentication required', context?: Record<string, unknown>) {
    super(message, 'AUTHENTICATION_ERROR', 401, true, context);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends JemeaBotError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, unknown>) {
    super(message, 'AUTHORIZATION_ERROR', 403, true, context);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends JemeaBotError {
  constructor(resource: string, context?: Record<string, unknown>) {
    super(`${resource} not found`, 'NOT_FOUND_ERROR', 404, true, context);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends JemeaBotError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFLICT_ERROR', 409, true, context);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends JemeaBotError {
  constructor(message: string = 'Rate limit exceeded', context?: Record<string, unknown>) {
    super(message, 'RATE_LIMIT_ERROR', 429, true, context);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends JemeaBotError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', 500, true, context);
    this.name = 'DatabaseError';
  }
}

export class TelegramError extends JemeaBotError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'TELEGRAM_ERROR', 502, true, context);
    this.name = 'TelegramError';
  }
}

export class ExternalServiceError extends JemeaBotError {
  constructor(service: string, message: string, context?: Record<string, unknown>) {
    super(`${service} error: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, true, context);
    this.name = 'ExternalServiceError';
  }
}

/**
 * Error handling utilities
 */
export class ErrorHandler {
  /**
   * Handle and log errors with appropriate context
   */
  static handle(error: unknown, context?: Record<string, unknown>): JemeaBotError {
    if (error instanceof JemeaBotError) {
      logger.error(`Operational error: ${error.message}`, {
        error,
        context: { ...context, ...error.context },
        code: error.code,
        statusCode: error.statusCode,
      });
      return error;
    }

    if (error instanceof Error) {
      logger.error(`Unexpected error: ${error.message}`, {
        error,
        context,
        stack: error.stack,
      });
      return new JemeaBotError(
        error.message,
        'UNEXPECTED_ERROR',
        500,
        false,
        { ...context, originalError: error.name }
      );
    }

    const unknownError = new JemeaBotError(
      'An unknown error occurred',
      'UNKNOWN_ERROR',
      500,
      false,
      { ...context, originalError: String(error) }
    );

    logger.error('Unknown error type', {
      error: unknownError,
      context,
      originalError: error,
    });

    return unknownError;
  }

  /**
   * Convert Prisma errors to JemeaBotError
   */
  static handlePrismaError(error: unknown, context?: Record<string, unknown>): JemeaBotError {
    if (error instanceof Error) {
      // Prisma unique constraint error
      if (error.message.includes('Unique constraint failed')) {
        return new ConflictError('Resource already exists', context);
      }

      // Prisma record not found error
      if (error.message.includes('Record to update not found')) {
        return new NotFoundError('Record', context);
      }

      // Prisma connection error
      if (error.message.includes('Connection')) {
        return new DatabaseError('Database connection failed', context);
      }

      // Generic Prisma error
      return new DatabaseError(`Database operation failed: ${error.message}`, context);
    }

    return this.handle(error, context);
  }

  /**
   * Convert Telegram API errors to JemeaBotError
   */
  static handleTelegramError(error: unknown, context?: Record<string, unknown>): JemeaBotError {
    if (error && typeof error === 'object' && 'description' in error) {
      const telegramError = error as { description: string; error_code?: number };
      
      // Handle specific Telegram error codes
      if (telegramError.error_code === 400) {
        return new ValidationError(`Telegram API error: ${telegramError.description}`, context);
      }
      
      if (telegramError.error_code === 403) {
        return new AuthorizationError(`Telegram API error: ${telegramError.description}`, context);
      }
      
      if (telegramError.error_code === 404) {
        return new NotFoundError('Chat or user', context);
      }
      
      return new TelegramError(`Telegram API error: ${telegramError.description}`, context);
    }

    return this.handle(error, context);
  }

  /**
   * Create a safe error response for API endpoints
   */
  static createErrorResponse(error: JemeaBotError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
          context: error.context,
        }),
      },
    };
  }

  /**
   * Check if error is operational (expected) or programming error
   */
  static isOperationalError(error: unknown): boolean {
    if (error instanceof JemeaBotError) {
      return error.isOperational;
    }
    return false;
  }
}

/**
 * Async error wrapper for route handlers
 */
export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      const jemeaError = ErrorHandler.handle(error);
      throw jemeaError;
    }
  };
}

/**
 * Express-style error handler for Next.js API routes
 */
export function apiErrorHandler(error: unknown, req: Request, res: Response) {
  const jemeaError = ErrorHandler.handle(error);
  const response = ErrorHandler.createErrorResponse(jemeaError);
  
  logger.error('API Error', {
    error: jemeaError,
    url: req.url,
    method: req.method,
  });

  return new Response(JSON.stringify(response), {
    status: jemeaError.statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}
