type LogContext = Record<string, unknown>;

function serializeError(error: unknown) {
  if (!(error instanceof Error)) return { error: String(error) };
  return {
    errorName: error.name,
    errorMessage: error.message,
    ...(process.env.NODE_ENV !== "production" ? { stack: error.stack } : {}),
  };
}

export function logError(event: string, error: unknown, context: LogContext = {}) {
  console.error(
    JSON.stringify({
      level: "error",
      event,
      timestamp: new Date().toISOString(),
      ...context,
      ...serializeError(error),
    }),
  );
}
