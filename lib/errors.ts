export class AppError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "VALIDATION"
      | "UNAUTHORIZED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "CONFLICT"
      | "RATE_LIMITED"
      | "CONFIG"
      | "INTERNAL",
    public readonly status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function logError(scope: string, error: unknown) {
  const detail = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[${scope}] ${detail}`);
}
