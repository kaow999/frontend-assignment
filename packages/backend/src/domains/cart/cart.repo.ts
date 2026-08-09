import { and, eq, getTableColumns, isNull, type SQL } from "drizzle-orm";

import { db } from "../../db";
import {
  cartItems,
  products,
  type CartItem,
  type NewCartItem,
  type Product,
} from "../../db/schema";

/** A cart row joined to the product it points at. */
export type CartItemWithProduct = CartItem & {
  product: Product | null;
};

/**
 * Which cart a request is talking about: a user id for a signed-in shopper, or
 * null for the guest cart.
 */
export type CartOwner = string | null;

const withProduct = {
  ...getTableColumns(cartItems),
  product: products,
};

/**
 * Every query goes through this. `user_id IS NULL` and `user_id = ?` are
 * different sets, so one shopper's rows are unreachable from another's session
 * — including by id, which is why the single-row lookups are scoped too rather
 * than trusting the caller to have checked.
 */
const ownedBy = (owner: CartOwner): SQL =>
  owner === null ? isNull(cartItems.userId) : eq(cartItems.userId, owner);

/** Repository layer: data access only, no business rules. */
export const cartRepo = {
  async findAll(owner: CartOwner): Promise<CartItemWithProduct[]> {
    return db
      .select(withProduct)
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(ownedBy(owner))
      .orderBy(cartItems.createdAt)
      .all();
  },

  async findById(
    id: string,
    owner: CartOwner,
  ): Promise<CartItemWithProduct | undefined> {
    return db
      .select(withProduct)
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(and(eq(cartItems.id, id), ownedBy(owner)))
      .get();
  },

  async findByProductId(
    productId: string,
    owner: CartOwner,
  ): Promise<CartItem | undefined> {
    return db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.productId, productId), ownedBy(owner)))
      .get();
  },

  async create(value: NewCartItem): Promise<CartItem> {
    return db.insert(cartItems).values(value).returning().get();
  },

  async updateQuantity(
    id: string,
    quantity: number,
    owner: CartOwner,
  ): Promise<CartItem | undefined> {
    return db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.id, id), ownedBy(owner)))
      .returning()
      .get();
  },

  async remove(id: string, owner: CartOwner): Promise<CartItem | undefined> {
    return db
      .delete(cartItems)
      .where(and(eq(cartItems.id, id), ownedBy(owner)))
      .returning()
      .get();
  },

  async removeByProductId(
    productId: string,
    owner: CartOwner,
  ): Promise<CartItem[]> {
    return db
      .delete(cartItems)
      .where(and(eq(cartItems.productId, productId), ownedBy(owner)))
      .returning()
      .all();
  },

  async clear(owner: CartOwner): Promise<CartItem[]> {
    return db.delete(cartItems).where(ownedBy(owner)).returning().all();
  },
};
