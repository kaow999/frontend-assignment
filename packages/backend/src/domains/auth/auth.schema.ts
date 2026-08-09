import { z } from "zod";

/* ---------------------------------- output --------------------------------- */

/**
 * Built by hand rather than with `createSelectSchema`, so that adding a column
 * to `users` can never leak it. The password hash must not cross this boundary.
 */
export const publicUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  createdAt: z.date(),
});

/** Register and login: there is always a user by the time these return. */
export const authenticatedSchema = z.object({
  user: publicUserSchema,
});

/** `GET /me` answers for signed-out callers too, so the user may be null. */
export const sessionSchema = z.object({
  user: publicUserSchema.nullable(),
});

export const logoutSchema = z.object({
  signedOut: z.boolean(),
});

/* ---------------------------------- input ---------------------------------- */

const email = z
  .string()
  .trim()
  .min(1)
  .max(320)
  .pipe(z.email("must be a valid email address"))
  // Addresses are matched case-insensitively, so they are stored folded.
  .transform((value) => value.toLowerCase());

/**
 * Eight characters is the floor NIST recommends. No composition rules — they
 * push people towards predictable substitutions without adding entropy.
 */
const password = z.string().min(8, "must be at least 8 characters").max(200);

export const registerSchema = z.object({ email, password });

/**
 * Login deliberately does not reuse the register rules. Tightening the minimum
 * length later would otherwise lock out everyone whose password was accepted
 * under the old floor.
 */
export const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
