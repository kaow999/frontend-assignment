/* eslint-disable @typescript-eslint/no-explicit-any -- test helpers return
   loosely-typed JSON on purpose; assertions do the narrowing. */
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { app } from "../src/app";
import { db } from "../src/db";
import { migrationsFolder } from "../src/db/paths";
import {
  cartItems,
  colors,
  products,
  sessions,
  sizes,
  users,
} from "../src/db/schema";

if (process.env.DATABASE_URL !== ":memory:") {
  throw new Error(
    "Tests must run against an in-memory database — check test/preload.ts is loaded.",
  );
}

let migrated = false;

/** Truncates every table, migrating first on the very first call. */
export const resetDatabase = () => {
  if (!migrated) {
    migrate(db, { migrationsFolder });
    migrated = true;
  }

  // Child rows first — the foreign keys are enforced.
  db.delete(cartItems).run();
  db.delete(sessions).run();
  db.delete(users).run();
  db.delete(products).run();
  db.delete(colors).run();
  db.delete(sizes).run();
};

export type ApiResponse<T = any> = {
  status: number;
  body: T;
  /** Exposed so cookie flags can be asserted, not just the parsed body. */
  headers: Headers;
};

export type ApiClient = <T = any>(
  method: string,
  path: string,
  body?: unknown,
) => Promise<ApiResponse<T>>;

/**
 * Drives the real Elysia app in-process. No port is bound, so the full stack
 * — routing, zod input validation, handlers, zod response validation — is
 * exercised exactly as it would be over the network.
 *
 * `jar` makes the caller behave like a browser: it returns cookies the server
 * set on earlier responses. Passing none means every request arrives without
 * a session, which is what the pre-auth tests assume.
 */
const request = (jar?: Map<string, string>): ApiClient =>
  async <T = any>(method: string, path: string, body?: unknown) => {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["content-type"] = "application/json";
    if (jar?.size) {
      headers.cookie = [...jar]
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");
    }

    const response = await app.handle(
      new Request(`http://localhost${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );

    if (jar) {
      for (const header of response.headers.getSetCookie()) {
        const [pair = ""] = header.split(";");
        const separator = pair.indexOf("=");
        if (separator === -1) continue;

        const name = pair.slice(0, separator).trim();
        const value = pair.slice(separator + 1).trim();
        // Clearing a cookie is sent as an empty value, so drop it rather than
        // storing "" and sending a meaningless header forever after.
        if (value) jar.set(name, value);
        else jar.delete(name);
      }
    }

    const text = await response.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* non-JSON body, keep the raw text */
    }

    return {
      status: response.status,
      body: parsed as T,
      headers: response.headers,
    };
  };

export const api: ApiClient = request();

/**
 * A caller with its own cookie jar. Two clients are two independent browsers,
 * which is what makes "one shopper cannot see another's cart" testable.
 */
export const createClient = (): ApiClient => request(new Map());

/* ------------------------------- fixtures -------------------------------- */

export const givenColor = (id = "blue", name = "Blue", hex = "#063af5") =>
  api("POST", "/colors", { id, name, hex });

export const givenSize = (id = "large", name = "Large", value = "L") =>
  api("POST", "/sizes", { id, name, value });

export type ProductOverrides = Partial<{
  id: string;
  name: string;
  description: string;
  price: number;
  discountedPrice: number;
  percentageDiscount: number;
  colorId: string | null;
  sizeId: string | null;
  imageUrl: string;
  rating: number;
  createdAt: Date;
}>;

let productSeq = 0;

/**
 * Products have no write API, so fixtures go in through the repository —
 * the same path the seeder uses.
 */
export const givenProduct = async (overrides: ProductOverrides = {}) => {
  const { productsRepo } =
    await import("../src/domains/products/products.repo");
  productSeq += 1;
  const price = overrides.price ?? 100;
  const percentageDiscount = overrides.percentageDiscount ?? 0;

  return productsRepo.create({
    id: overrides.id ?? `product-${productSeq}`,
    name: overrides.name ?? `Product ${productSeq}`,
    description: overrides.description ?? "A test garment",
    price,
    discountedPrice:
      overrides.discountedPrice ??
      Math.round(price * (1 - percentageDiscount / 100)),
    percentageDiscount,
    colorId: overrides.colorId ?? null,
    sizeId: overrides.sizeId ?? null,
    imageUrl: overrides.imageUrl ?? "https://images.unsplash.com/photo-test",
    rating: overrides.rating ?? 4,
    ...(overrides.createdAt ? { createdAt: overrides.createdAt } : {}),
  });
};
