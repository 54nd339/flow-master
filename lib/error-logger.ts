/**
 * Centralized error logging utility
 * In development, logs to console. In production, can be extended to send to error tracking service.
 */

interface ErrorContext {
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Logs an error with optional context
 * @param error - The error to log
 * @param context - Optional context information
 */
export const logError = (error: Error | unknown, context?: ErrorContext): void => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  if (process.env.NODE_ENV === 'development') {
    console.error(
      `[Error${context?.component ? ` in ${context.component}` : ''}${context?.action ? ` during ${context.action}` : ''}]`,
      errorMessage,
      errorStack,
      context?.metadata
    );
  }

  // In production, send to error tracking service
  // Example: Sentry.captureException(error, { tags: context });
};
