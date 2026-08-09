import { status } from "elysia";

import { toHttpError } from "../../common/http";
import { writeSessionCookie, type SessionCookie } from "../../common/session";
import { authBiz } from "./auth.biz";
import type { LoginInput, RegisterInput } from "./auth.schema";

/**
 * Controller layer: turns business results and domain errors into HTTP.
 *
 * The session cookie is written here rather than in the business layer — a
 * `Set-Cookie` header is transport, and `authBiz` should stay unaware that it
 * is being called over HTTP at all.
 */
export const authService = {
  async register(input: RegisterInput, cookie: SessionCookie) {
    try {
      const { user, session } = await authBiz.register(input);
      writeSessionCookie(cookie, session.id, session.expiresAt);

      return status(201, { user });
    } catch (error) {
      return toHttpError(error, "CONFLICT");
    }
  },

  async login(input: LoginInput, cookie: SessionCookie) {
    try {
      const { user, session } = await authBiz.login(input);
      writeSessionCookie(cookie, session.id, session.expiresAt);

      return { user };
    } catch (error) {
      return toHttpError(error, "UNAUTHORIZED");
    }
  },

  async logout(sessionId: string | undefined, cookie: SessionCookie) {
    const result = await authBiz.logout(sessionId);
    // Clear it either way: a cookie pointing at a session row that is already
    // gone is still worth removing from the browser.
    cookie.remove();

    return result;
  },

  async me(sessionId: string | undefined) {
    return { user: await authBiz.userForSession(sessionId) };
  },
};
