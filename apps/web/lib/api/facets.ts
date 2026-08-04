import { api } from "../eden";
import { unwrap } from "./http";

export type Color = NonNullable<
  Awaited<ReturnType<typeof api.colors.get>>["data"]
>[number];

export type Size = NonNullable<
  Awaited<ReturnType<typeof api.sizes.get>>["data"]
>[number];

export const fetchColors = async (signal?: AbortSignal): Promise<Color[]> =>
  unwrap(await api.colors.get({ fetch: { signal } }));

export const fetchSizes = async (signal?: AbortSignal): Promise<Size[]> =>
  unwrap(await api.sizes.get({ fetch: { signal } }));
