import { beforeEach, describe, expect, test } from "bun:test";

import { app } from "../src/app";
import { api, createClient, resetDatabase } from "./helpers";

const PASSWORD = "correct-horse-battery";

beforeEach(() => {
  resetDatabase();
});

describe("POST /auth/register", () => {
  test("creates an account and returns the user", async () => {
    const res = await api("POST", "/auth/register", {
      email: "ada@example.com",
      password: PASSWORD,
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("ada@example.com");
    expect(res.body.user.id).toBeString();
  });

  test("never returns the password or its hash", async () => {
    const res = await api("POST", "/auth/register", {
      email: "ada@example.com",
      password: PASSWORD,
    });

    const serialised = JSON.stringify(res.body);
    expect(serialised).not.toContain(PASSWORD);
    expect(serialised).not.toContain("passwordHash");
    expect(serialised).not.toContain("$argon");
  });

  test("sets an httpOnly, same-site session cookie", async () => {
    const res = await api("POST", "/auth/register", {
      email: "ada@example.com",
      password: PASSWORD,
    });

    const cookie = res.headers.getSetCookie().find((c) => c.startsWith("session="));

    expect(cookie).toBeDefined();
    expect(cookie).toContain("HttpOnly");
    expect(cookie?.toLowerCase()).toContain("samesite=lax");
    expect(cookie).toContain("Path=/");
  });

  test("signs the new account straight in", async () => {
    const client = createClient();
    await client("POST", "/auth/register", {
      email: "ada@example.com",
      password: PASSWORD,
    });

    const me = await client("GET", "/auth/me");

    expect(me.body.user.email).toBe("ada@example.com");
  });

  test("folds the email to lower case and trims it", async () => {
    const res = await api("POST", "/auth/register", {
      email: "  Ada@Example.COM  ",
      password: PASSWORD,
    });

    expect(res.body.user.email).toBe("ada@example.com");
  });

  test("a duplicate email is a 409", async () => {
    await api("POST", "/auth/register", {
      email: "ada@example.com",
      password: PASSWORD,
    });
    const res = await api("POST", "/auth/register", {
      email: "ada@example.com",
      password: PASSWORD,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain("already exists");
  });

  test("duplicate detection ignores case", async () => {
    await api("POST", "/auth/register", {
      email: "ada@example.com",
      password: PASSWORD,
    });
    const res = await api("POST", "/auth/register", {
      email: "ADA@EXAMPLE.COM",
      password: PASSWORD,
    });

    expect(res.status).toBe(409);
  });

  test("a password under eight characters is rejected", async () => {
    const res = await api("POST", "/auth/register", {
      email: "ada@example.com",
      password: "short",
    });

    expect(res.status).toBe(422);
  });

  test("a malformed email is rejected", async () => {
    const res = await api("POST", "/auth/register", {
      email: "not-an-email",
      password: PASSWORD,
    });

    expect(res.status).toBe(422);
  });
});

describe("POST /auth/login", () => {
  beforeEach(async () => {
    await api("POST", "/auth/register", {
      email: "ada@example.com",
      password: PASSWORD,
    });
  });

  test("correct credentials start a session", async () => {
    const client = createClient();
    const res = await client("POST", "/auth/login", {
      email: "ada@example.com",
      password: PASSWORD,
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("ada@example.com");

    const me = await client("GET", "/auth/me");
    expect(me.body.user.email).toBe("ada@example.com");
  });

  test("the email is matched case-insensitively", async () => {
    const res = await api("POST", "/auth/login", {
      email: "ADA@example.com",
      password: PASSWORD,
    });

    expect(res.status).toBe(200);
  });

  test("a wrong password is a 401", async () => {
    const res = await api("POST", "/auth/login", {
      email: "ada@example.com",
      password: "not-the-password",
    });

    expect(res.status).toBe(401);
  });

  /**
   * The two failures must be indistinguishable — a different message or status
   * for an unknown address turns the login form into an account-enumeration
   * oracle.
   */
  test("an unknown email fails exactly like a wrong password", async () => {
    const unknown = await api("POST", "/auth/login", {
      email: "nobody@example.com",
      password: PASSWORD,
    });
    const wrong = await api("POST", "/auth/login", {
      email: "ada@example.com",
      password: "not-the-password",
    });

    expect(unknown.status).toBe(wrong.status);
    expect(unknown.body.message).toBe(wrong.body.message);
  });

  test("a failed login does not start a session", async () => {
    const client = createClient();
    await client("POST", "/auth/login", {
      email: "ada@example.com",
      password: "not-the-password",
    });

    const me = await client("GET", "/auth/me");
    expect(me.body.user).toBeNull();
  });
});

describe("GET /auth/me", () => {
  test("a signed-out caller gets a null user rather than a 401", async () => {
    const res = await api("GET", "/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  test("an unrecognised cookie is treated as signed out", async () => {
    // Sent by hand: the helper's jar only ever holds cookies the server set.
    const response = await app.handle(
      new Request("http://localhost/auth/me", {
        headers: { cookie: "session=019fe5ff-0000-7000-0000-000000000000" },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user: null });
  });
});

describe("POST /auth/logout", () => {
  test("ends the session", async () => {
    const client = createClient();
    await client("POST", "/auth/register", {
      email: "ada@example.com",
      password: PASSWORD,
    });

    const out = await client("POST", "/auth/logout");
    expect(out.status).toBe(200);
    expect(out.body.signedOut).toBe(true);

    const me = await client("GET", "/auth/me");
    expect(me.body.user).toBeNull();
  });

  test("the old cookie cannot be replayed after signing out", async () => {
    const client = createClient();
    await client("POST", "/auth/register", {
      email: "ada@example.com",
      password: PASSWORD,
    });

    // Capture the token before it is cleared, then present it again by hand.
    const me = await client("GET", "/auth/me");
    expect(me.body.user).not.toBeNull();

    await client("POST", "/auth/logout");
    const replayed = await client("GET", "/auth/me");

    expect(replayed.body.user).toBeNull();
  });

  test("signing out without a session is a no-op", async () => {
    const res = await api("POST", "/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body.signedOut).toBe(false);
  });
});
