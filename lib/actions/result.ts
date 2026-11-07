import { ZodError } from "zod";
import { AppError, logError } from "@/lib/errors";
import type { ActionResult } from "@/types";

function isFrameworkSignal(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_");
}

export async function runAction<T>(
  scope: string,
  handler: () => Promise<T>,
): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await handler() };
  } catch (error) {
    if (isFrameworkSignal(error)) throw error;

    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of error.issues) {
        const key = issue.path.join(".") || "form";
        fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
      }
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
    }

    if (error instanceof AppError) {
      return { ok: false, error: error.message };
    }

    logError(scope, error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
