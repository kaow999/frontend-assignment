import { treaty, type Treaty } from "@elysiajs/eden";
import type { App } from "@repo/backend";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// The explicit annotation keeps the inferred client type portable across
// packages (avoids TS2742 when web references types from @repo/backend).
export const api: Treaty.Create<App> = treaty<App>(API_URL, {
  // The session lives in an httpOnly cookie, and the storefront and API are
  // different origins (:3000 and :4000). Without this the browser silently
  // omits the cookie and every request looks signed out.
  fetch: { credentials: "include" },
});
