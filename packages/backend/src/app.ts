import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { authRouter } from "./domains/auth/auth.router";
import { cartRouter } from "./domains/cart/cart.router";
import { colorsRouter } from "./domains/colors/colors.router";
import { productsRouter } from "./domains/products/products.router";
import { sizesRouter } from "./domains/sizes/sizes.router";

/**
 * The app graph with no side effects — it does not bind a port, so tests can
 * drive it through `app.handle(new Request(...))`. `src/index.ts` is the
 * bootstrap that prepares the database and listens.
 */
export const app = new Elysia()
  .use(
    cors({
      origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
      // The session travels in a cookie, so the browser needs permission to
      // send it cross-origin. This is why the origin above must stay an exact
      // origin and never become a wildcard.
      credentials: true,
    }),
  )
  .get("/", () => ({ message: "Hello from Elysia" }))
  .get("/health", () => ({ status: "ok" as const }))
  .use(authRouter)
  .use(colorsRouter)
  .use(sizesRouter)
  .use(productsRouter)
  .use(cartRouter);

export type App = typeof app;
