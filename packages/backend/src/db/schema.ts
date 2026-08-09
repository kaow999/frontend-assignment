import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// colors options
export const colors = sqliteTable("colors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  hex: text("hex").notNull(),
});

export const sizes = sqliteTable("sizes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  value: text("value").notNull(),
});

// clothes products
export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  discountedPrice: integer("discounted_price").notNull(),
  percentageDiscount: integer("percentage_discount").notNull().default(0),
  colorId: text("color_id").references(() => colors.id),
  sizeId: text("size_id").references(() => sizes.id),
  imageUrl: text("image_url").notNull(),
  rating: real("rating").notNull().default(0.0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// shoppers who have registered an account
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  // Stored lower-cased so uniqueness is not case-sensitive.
  email: text("email").notNull().unique(),
  // Argon2id via Bun.password — never the password itself.
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Server-side sessions rather than JWTs: logging out has to revoke access
 * immediately, and a stateless token cannot be withdrawn before it expires.
 * The row id is the opaque value carried in the cookie.
 */
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// cart items
export const cartItems = sqliteTable("cart_items", {
  id: text("id").primaryKey(),
  productId: text("product_id").references(() => products.id),
  /**
   * Null means the guest cart — the single shared cart this API had before
   * accounts existed. A signed-in shopper gets their own rows instead, so the
   * two never mix.
   */
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Color = typeof colors.$inferSelect;
export type Size = typeof sizes.$inferSelect;
export type Product = typeof products.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;

export type NewColor = typeof colors.$inferInsert;
export type NewSize = typeof sizes.$inferInsert;
export type NewProduct = typeof products.$inferInsert;
export type NewCartItem = typeof cartItems.$inferInsert;
export type NewUser = typeof users.$inferInsert;
export type NewSession = typeof sessions.$inferInsert;
