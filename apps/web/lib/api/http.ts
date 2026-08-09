/**
 * Eden Treaty hands back `{ data, error }` rather than throwing, but TanStack
 * Query decides success or failure from whether the query function throws. This
 * is the seam between the two conventions.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Structural shape of a Treaty result. Declared loosely on purpose — every
 * endpoint has its own literal union of error statuses, and narrowing them here
 * would mean one overload per route for no gain.
 */
type TreatyResult<T> = {
  data: T | null;
  error: { status: unknown; value: unknown } | null;
};

/** Every non-2xx the API produces is `{ message: string }`. */
const readMessage = (value: unknown): string | null => {
  if (typeof value === "string") return value;

  if (value && typeof value === "object" && "message" in value) {
    const { message } = value as { message: unknown };
    if (typeof message === "string") return message;
  }

  return null;
};

export const unwrap = <T>(result: TreatyResult<T>): T => {
  if (result.error) {
    const status =
      typeof result.error.status === "number" ? result.error.status : 500;

    throw new ApiError(
      readMessage(result.error.value) ??
        "Something went wrong. Please try again.",
      status,
    );
  }

  if (result.data === null) {
    throw new ApiError("The server returned an empty response.", 500);
  }

  return result.data;
};
