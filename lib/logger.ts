/**
 * Professional logging utility for Jemea Bot
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogContext {
  userId?: string | undefined;
  chatId?: string | undefined;
  messageId?: string | undefined;
  action?: string | undefined;
  duration?: number | undefined;
  error?: Error | undefined;
  metadata?: Record<string, unknown> | undefined;
  [key: string]: unknown;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    return `[${timestamp}] ${levelUpper} ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context);
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        if (context?.error && this.isDevelopment) {
          console.error('Stack trace:', context.error.stack);
        }
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
    }
  }

  error(message: string, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  // Specialized logging methods for common use cases
  botAction(action: string, context?: Omit<LogContext, 'action'>): void {
    this.info(`Bot action: ${action}`, { ...context, action });
  }

  userAction(userId: string, action: string, context?: Omit<LogContext, 'userId' | 'action'>): void {
    this.info(`User action: ${action}`, { ...context, userId, action });
  }

  messageSent(messageId: string, chatId: string, context?: Omit<LogContext, 'messageId' | 'chatId'>): void {
    this.info('Message sent successfully', { ...context, messageId, chatId });
  }

  messageFailed(messageId: string, error: Error, context?: Omit<LogContext, 'messageId' | 'error'>): void {
    this.error('Message failed to send', { ...context, messageId, error });
  }

  databaseOperation(operation: string, table: string, context?: Omit<LogContext, 'action'>): void {
    this.debug(`Database operation: ${operation} on ${table}`, { ...context, action: operation, metadata: { table } });
  }

  performance(operation: string, duration: number, context?: Omit<LogContext, 'action' | 'duration'>): void {
    this.info(`Performance: ${operation} completed in ${duration}ms`, { ...context, action: operation, duration });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logError = (message: string, context?: LogContext) => logger.error(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
