import { and, eq, gt, lt } from "drizzle-orm";

import { db } from "../../db";
import {
  sessions,
  users,
  type NewSession,
  type NewUser,
  type Session,
  type User,
} from "../../db/schema";

/** Repository layer: data access only, no business rules. */
export const authRepo = {
  async findUserByEmail(email: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.email, email)).get();
  },

  async findUserById(id: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).get();
  },

  async createUser(value: NewUser): Promise<User> {
    return db.insert(users).values(value).returning().get();
  },

  async createSession(value: NewSession): Promise<Session> {
    return db.insert(sessions).values(value).returning().get();
  },

  /**
   * Resolves a session token straight to its user, rejecting expired rows in
   * the same query so a stale cookie can never authenticate anyone.
   */
  async findUserBySession(
    sessionId: string,
    now: Date,
  ): Promise<User | undefined> {
    const row = await db
      .select({ user: users })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
      .get();

    return row?.user;
  },

  async removeSession(sessionId: string): Promise<Session | undefined> {
    return db
      .delete(sessions)
      .where(eq(sessions.id, sessionId))
      .returning()
      .get();
  },

  /** Housekeeping: expired rows are dead weight once they cannot authenticate. */
  async removeExpiredSessions(now: Date): Promise<number> {
    return (await db.delete(sessions).where(lt(sessions.expiresAt, now)).returning().all())
      .length;
  },
};
