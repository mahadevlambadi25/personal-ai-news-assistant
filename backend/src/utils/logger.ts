type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const SENSITIVE_KEYS = ['password', 'passwordHash', 'token', 'jwt', 'secret', 'authorization', 'apiKey', 'accessToken'];

function sanitize(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitize);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export class Logger {
  private service: string;

  constructor(service: string) {
    this.service = service;
  }

  private formatMessage(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | meta: ${JSON.stringify(sanitize(meta))}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${this.service}]: ${message}${metaStr}`;
  }

  info(message: string, meta?: unknown): void {
    console.log(this.formatMessage('info', message, meta));
  }

  warn(message: string, meta?: unknown): void {
    console.warn(this.formatMessage('warn', message, meta));
  }

  error(message: string, meta?: unknown): void {
    console.error(this.formatMessage('error', message, meta));
  }

  debug(message: string, meta?: unknown): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }
}

export const appLogger = new Logger('App');
