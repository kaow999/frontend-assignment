import { Elysia } from "elysia";

import { errorResponseSchema, idParamSchema } from "../../common/schemas";
import { readSessionCookie } from "../../common/session";
import { authBiz } from "../auth/auth.biz";
import {
  addToCartSchema,
  cartItemSchema,
  cartItemWithProductSchema,
  cartSummarySchema,
  checkoutSchema,
  clearCartSchema,
  updateCartItemSchema,
} from "./cart.schema";
import { cartService } from "./cart.service";
import type { CartOwner } from "./cart.repo";

/**
 * Route layer: public HTTP surface, with zod schemas on input and output.
 *
 * Every handler is scoped to one cart. `derive` resolves the session cookie
 * once per request and hands down the owner, so no handler can forget to.
 *
 * A request with no valid session gets the guest cart (`owner: null`) rather
 * than a 401. The catalogue is browsable signed-out, and being able to fill a
 * basket before creating an account is the behaviour shoppers expect.
 */
export const cartRouter = new Elysia({ prefix: "/cart", tags: ["cart"] })
  .derive(async ({ cookie }): Promise<{ owner: CartOwner }> => {
    const user = await authBiz.userForSession(readSessionCookie(cookie));

    return { owner: user?.id ?? null };
  })
  .get("/", ({ owner }) => cartService.get(owner), {
    response: { 200: cartSummarySchema },
  })
  .delete("/", ({ owner }) => cartService.clear(owner), {
    response: { 200: clearCartSchema },
  })
  .post("/checkout", ({ owner }) => cartService.checkout(owner), {
    response: { 200: checkoutSchema, 409: errorResponseSchema },
  })
  .get("/items/:id", ({ params, owner }) => cartService.getItem(params.id, owner), {
    params: idParamSchema,
    response: { 200: cartItemWithProductSchema, 404: errorResponseSchema },
  })
  .post("/items", ({ body, owner }) => cartService.addItem(body, owner), {
    body: addToCartSchema,
    response: {
      201: cartItemSchema,
      400: errorResponseSchema,
      404: errorResponseSchema,
    },
  })
  .patch(
    "/items/:id",
    ({ params, body, owner }) =>
      cartService.updateQuantity(params.id, body.quantity, owner),
    {
      params: idParamSchema,
      body: updateCartItemSchema,
      response: {
        200: cartItemSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .delete(
    "/items/:id",
    ({ params, owner }) => cartService.removeItem(params.id, owner),
    {
      params: idParamSchema,
      response: { 200: cartItemSchema, 404: errorResponseSchema },
    },
  );
