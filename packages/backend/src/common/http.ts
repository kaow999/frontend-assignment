import { status } from "elysia";

import { AppError, type ErrorCode } from "./errors";

const statusByCode = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
} as const;

/**
 * Maps a domain error to an HTTP response, narrowed to the codes the caller
 * says it can raise — so the returned type matches the route's declared
 * `response` map exactly. Anything unexpected is rethrown and surfaces as a
 * real 500 instead of being silently swallowed.
 */
export const toHttpError = <const C extends ErrorCode>(
  error: unknown,
  ...expected: C[]
) => {
  if (error instanceof AppError) {
    const code = error.code as C;
    if ((expected as readonly ErrorCode[]).includes(code)) {
      return status(statusByCode[code], { message: error.message });
    }
  }

  throw error;
};
