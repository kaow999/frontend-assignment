import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../../common/errors";
import { newId } from "../../common/id";
import type { CartItem } from "../../db/schema";
import { productsRepo } from "../products/products.repo";
import { cartRepo, type CartItemWithProduct, type CartOwner } from "./cart.repo";
import type { AddToCartInput } from "./cart.schema";

export type CartSummary = {
  items: CartItemWithProduct[];
  totalItems: number;
  subtotal: number;
  total: number;
  totalDiscount: number;
};

const MAX_QUANTITY = 99;

const assertQuantity = (quantity: number) => {
  if (!Number.isInteger(quantity)) {
    throw new BadRequestError("quantity must be a whole number");
  }
  if (quantity < 1) throw new BadRequestError("quantity must be at least 1");
  if (quantity > MAX_QUANTITY) {
    throw new BadRequestError(`quantity cannot exceed ${MAX_QUANTITY}`);
  }
};

/**
 * Totals are derived from the joined product, never stored. `subtotal` is at
 * list price, `total` is what the shopper actually pays.
 */
const summarize = (items: CartItemWithProduct[]): CartSummary => {
  let totalItems = 0;
  let subtotal = 0;
  let total = 0;

  for (const item of items) {
    totalItems += item.quantity;
    if (!item.product) continue;

    subtotal += item.product.price * item.quantity;
    total += item.product.discountedPrice * item.quantity;
  }

  return {
    items,
    totalItems,
    subtotal,
    total,
    totalDiscount: subtotal - total,
  };
};

/**
 * Business layer: rules, invariants and cross-domain orchestration.
 *
 * Every entry point takes the cart's owner — a user id, or null for the guest
 * cart — and passes it to the repository, so a missing scope is a type error
 * rather than a silent leak between shoppers.
 */
export const cartBiz = {
  async get(owner: CartOwner): Promise<CartSummary> {
    return summarize(await cartRepo.findAll(owner));
  },

  async getItem(id: string, owner: CartOwner): Promise<CartItemWithProduct> {
    const item = await cartRepo.findById(id, owner);
    // Someone else's line is reported as missing rather than forbidden —
    // a 403 would confirm the id exists.
    if (!item) throw new NotFoundError(`Cart item '${id}' not found`);

    return item;
  },

  async addItem(input: AddToCartInput, owner: CartOwner): Promise<CartItem> {
    const quantity = input.quantity ?? 1;
    assertQuantity(quantity);

    if (!(await productsRepo.exists(input.productId))) {
      throw new BadRequestError(`Product '${input.productId}' does not exist`);
    }

    // Adding a product already in the cart tops up the existing row rather
    // than creating a duplicate line.
    const existing = await cartRepo.findByProductId(input.productId, owner);
    if (existing) {
      const merged = Math.min(existing.quantity + quantity, MAX_QUANTITY);
      const updated = await cartRepo.updateQuantity(existing.id, merged, owner);
      if (!updated) {
        throw new NotFoundError(`Cart item '${existing.id}' not found`);
      }

      return updated;
    }

    return cartRepo.create({
      id: newId(),
      productId: input.productId,
      userId: owner,
      quantity,
    });
  },

  async updateQuantity(
    id: string,
    quantity: number,
    owner: CartOwner,
  ): Promise<CartItem> {
    assertQuantity(quantity);
    await cartBiz.getItem(id, owner);

    const updated = await cartRepo.updateQuantity(id, quantity, owner);
    if (!updated) throw new NotFoundError(`Cart item '${id}' not found`);

    return updated;
  },

  async removeItem(id: string, owner: CartOwner): Promise<CartItem> {
    await cartBiz.getItem(id, owner);

    const removed = await cartRepo.remove(id, owner);
    if (!removed) throw new NotFoundError(`Cart item '${id}' not found`);

    return removed;
  },

  async clear(owner: CartOwner): Promise<{ removed: number }> {
    const removed = await cartRepo.clear(owner);

    return { removed: removed.length };
  },

  /**
   * Mock checkout. There is no order table and no payment step — a non-empty
   * cart mints an order id and is then emptied, so the shopper lands back on a
   * clean cart the way a real checkout would leave them.
   */
  async checkout(owner: CartOwner): Promise<{ orderId: string }> {
    const items = await cartRepo.findAll(owner);
    if (items.length === 0) throw new ConflictError("Cart is empty");

    await cartRepo.clear(owner);

    return { orderId: newId() };
  },
};
