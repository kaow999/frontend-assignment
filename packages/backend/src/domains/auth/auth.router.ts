import { Elysia } from "elysia";

import { errorResponseSchema } from "../../common/schemas";
import { readSessionCookie, SESSION_COOKIE } from "../../common/session";
import {
  authenticatedSchema,
  loginSchema,
  logoutSchema,
  registerSchema,
  sessionSchema,
} from "./auth.schema";
import { authService } from "./auth.service";

/**
 * Route layer: public HTTP surface, with zod schemas on input and output.
 *
 * The session travels in an httpOnly cookie, so there is no token in any
 * response body for a script to read or mislay.
 */
export const authRouter = new Elysia({ prefix: "/auth", tags: ["auth"] })
  .post(
    "/register",
    ({ body, cookie }) => authService.register(body, cookie[SESSION_COOKIE]!),
    {
      body: registerSchema,
      response: { 201: authenticatedSchema, 409: errorResponseSchema },
    },
  )
  .post(
    "/login",
    ({ body, cookie }) => authService.login(body, cookie[SESSION_COOKIE]!),
    {
      body: loginSchema,
      response: { 200: authenticatedSchema, 401: errorResponseSchema },
    },
  )
  .post(
    "/logout",
    ({ cookie }) =>
      authService.logout(readSessionCookie(cookie), cookie[SESSION_COOKIE]!),
    { response: { 200: logoutSchema } },
  )
  .get("/me", ({ cookie }) => authService.me(readSessionCookie(cookie)), {
    response: { 200: sessionSchema },
  });
