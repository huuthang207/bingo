type LogLevel = "info" | "warn" | "error";

type LogMetadata = Record<string, unknown>;

const sensitiveKeyPattern = /(^authorization$|token|tokenhash|password|secret)/i;

function sanitizeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: process.env.NODE_ENV === "production" ? undefined : value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    return sanitizeMetadata(value as LogMetadata);
  }

  return value;
}

function sanitizeMetadata(metadata: LogMetadata): LogMetadata {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      sensitiveKeyPattern.test(key) ? "[REDACTED]" : sanitizeValue(value),
    ]),
  );
}

function writeLog(level: LogLevel, message: string, metadata: LogMetadata = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...sanitizeMetadata(metadata),
  };
  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  info: (message: string, metadata?: LogMetadata) => writeLog("info", message, metadata),
  warn: (message: string, metadata?: LogMetadata) => writeLog("warn", message, metadata),
  error: (message: string, metadata?: LogMetadata) => writeLog("error", message, metadata),
};
