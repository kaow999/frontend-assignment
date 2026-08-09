/**
 * The session cookie is the one thing the auth and cart routers have to agree
 * on, so its name and its flags live here rather than being spelled out twice.
 */
export const SESSION_COOKIE = "session";

/** Cookies are untrusted input, so Elysia types their values as `unknown`. */
type CookieJar = Record<string, { value?: unknown } | undefined>;

/**
 * Narrows the raw cookie to a usable token. A non-string or empty value is
 * treated as absent — it cannot match a session row anyway, and letting it
 * through would only push the problem into the query layer.
 */
export const readSessionCookie = (cookie: CookieJar): string | undefined => {
  const value = cookie[SESSION_COOKIE]?.value;

  return typeof value === "string" && value.length > 0 ? value : undefined;
};

/** The write side of an Elysia cookie entry, kept free of Elysia's generics. */
export type SessionCookie = {
  set(options: {
    value: string;
    httpOnly: boolean;
    sameSite: "lax";
    path: string;
    expires: Date;
    secure: boolean;
  }): unknown;
  remove(): unknown;
};

/**
 * `httpOnly` keeps the token out of reach of any script on the page, so an XSS
 * bug cannot walk off with a session. `sameSite: lax` is enough here because
 * the storefront and the API differ only by port, which still counts as the
 * same site. `secure` is off in development because localhost is plain HTTP.
 */
export const writeSessionCookie = (
  cookie: SessionCookie,
  value: string,
  expires: Date,
) =>
  cookie.set({
    value,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
    secure: process.env.NODE_ENV === "production",
  });
