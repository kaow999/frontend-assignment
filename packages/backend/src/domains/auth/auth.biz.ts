import { ConflictError, UnauthorizedError } from "../../common/errors";
import { newId } from "../../common/id";
import type { Session, User } from "../../db/schema";
import { authRepo } from "./auth.repo";
import type { LoginInput, PublicUser, RegisterInput } from "./auth.schema";

/** How long a session stays valid without being refreshed. */
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * A precomputed argon2id hash of a value nothing will ever match.
 *
 * Login verifies against this when the email is unknown, so a request for a
 * non-existent account costs the same time as one for a real account with the
 * wrong password. Without it, response latency tells an attacker which emails
 * are registered.
 */
const DUMMY_HASH_SOURCE = "no-such-user-timing-equaliser";
let dummyHash: string | null = null;

const getDummyHash = async () => {
  dummyHash ??= await Bun.password.hash(DUMMY_HASH_SOURCE);

  return dummyHash;
};

/** Strips the password hash. Nothing outside this module sees a `User`. */
export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  email: user.email,
  createdAt: user.createdAt,
});

export type AuthResult = {
  user: PublicUser;
  session: Session;
};

/** Business layer: rules, invariants and cross-domain orchestration. */
export const authBiz = {
  async register(input: RegisterInput): Promise<AuthResult> {
    if (await authRepo.findUserByEmail(input.email)) {
      throw new ConflictError("An account with that email already exists");
    }

    const user = await authRepo.createUser({
      id: newId(),
      email: input.email,
      passwordHash: await Bun.password.hash(input.password),
    });

    return { user: toPublicUser(user), session: await authBiz.startSession(user.id) };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await authRepo.findUserByEmail(input.email);

    // Always verify something, so the two failure modes take the same time.
    const matches = await Bun.password.verify(
      input.password,
      user?.passwordHash ?? (await getDummyHash()),
    );

    // One message for both cases — saying which half was wrong hands an
    // attacker a way to enumerate registered addresses.
    if (!user || !matches) {
      throw new UnauthorizedError("Email or password is incorrect");
    }

    return { user: toPublicUser(user), session: await authBiz.startSession(user.id) };
  },

  async startSession(userId: string): Promise<Session> {
    return authRepo.createSession({
      id: newId(),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });
  },

  async logout(sessionId: string | undefined): Promise<{ signedOut: boolean }> {
    if (!sessionId) return { signedOut: false };

    return { signedOut: Boolean(await authRepo.removeSession(sessionId)) };
  },

  /**
   * Resolves the cookie to a user, or null. Returning null rather than throwing
   * keeps this usable for routes that work both signed in and signed out.
   */
  async userForSession(
    sessionId: string | undefined,
  ): Promise<PublicUser | null> {
    if (!sessionId) return null;

    const user = await authRepo.findUserBySession(sessionId, new Date());

    return user ? toPublicUser(user) : null;
  },
};
