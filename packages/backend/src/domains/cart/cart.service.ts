import { status } from "elysia";

import { toHttpError } from "../../common/http";
import { cartBiz } from "./cart.biz";
import type { CartOwner } from "./cart.repo";
import type { AddToCartInput } from "./cart.schema";

/** Controller layer: turns business results and domain errors into HTTP. */
export const cartService = {
  async get(owner: CartOwner) {
    return cartBiz.get(owner);
  },

  async getItem(id: string, owner: CartOwner) {
    try {
      return await cartBiz.getItem(id, owner);
    } catch (error) {
      return toHttpError(error, "NOT_FOUND");
    }
  },

  async addItem(input: AddToCartInput, owner: CartOwner) {
    try {
      return status(201, await cartBiz.addItem(input, owner));
    } catch (error) {
      return toHttpError(error, "BAD_REQUEST", "NOT_FOUND");
    }
  },

  async updateQuantity(id: string, quantity: number, owner: CartOwner) {
    try {
      return await cartBiz.updateQuantity(id, quantity, owner);
    } catch (error) {
      return toHttpError(error, "BAD_REQUEST", "NOT_FOUND");
    }
  },

  async removeItem(id: string, owner: CartOwner) {
    try {
      return await cartBiz.removeItem(id, owner);
    } catch (error) {
      return toHttpError(error, "NOT_FOUND");
    }
  },

  async clear(owner: CartOwner) {
    return cartBiz.clear(owner);
  },

  async checkout(owner: CartOwner) {
    try {
      return await cartBiz.checkout(owner);
    } catch (error) {
      return toHttpError(error, "CONFLICT");
    }
  },
};
