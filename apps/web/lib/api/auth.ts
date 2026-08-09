import { api } from "../eden";
import { unwrap } from "./http";

export type Session = NonNullable<
  Awaited<ReturnType<typeof api.auth.me.get>>["data"]
>;

export type User = NonNullable<Session["user"]>;

export type Credentials = {
  email: string;
  password: string;
};

export const fetchSession = async (signal?: AbortSignal): Promise<Session> =>
  unwrap(await api.auth.me.get({ fetch: { signal } }));

export const register = async (input: Credentials): Promise<User> =>
  (await unwrap(await api.auth.register.post(input))).user;

export const login = async (input: Credentials): Promise<User> =>
  (await unwrap(await api.auth.login.post(input))).user;

export const logout = async () => unwrap(await api.auth.logout.post());
