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
 * The whole cart is behind a session. `resolve` turns the cookie into an owner
 * once per request and answers 401 when there is none, so every handler below
 * can take a real user id and no handler can forget to scope its query.
 *
 * The catalogue stays open to anyone; only putting something in a basket
 * requires an account.
 */
export const cartRouter = new Elysia({ prefix: "/cart", tags: ["cart"] })
  .resolve(async ({ cookie, status }) => {
    const user = await authBiz.userForSession(readSessionCookie(cookie));
    if (!user) {
      return status(401, { message: "Sign in to use your cart" });
    }

    return { owner: user.id satisfies CartOwner };
  })
  .get("/", ({ owner }) => cartService.get(owner), {
    response: { 200: cartSummarySchema, 401: errorResponseSchema },
  })
  .delete("/", ({ owner }) => cartService.clear(owner), {
    response: { 200: clearCartSchema, 401: errorResponseSchema },
  })
  .post("/checkout", ({ owner }) => cartService.checkout(owner), {
    response: {
      200: checkoutSchema,
      401: errorResponseSchema,
      409: errorResponseSchema,
    },
  })
  .get(
    "/items/:id",
    ({ params, owner }) => cartService.getItem(params.id, owner),
    {
      params: idParamSchema,
      response: {
        200: cartItemWithProductSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .post("/items", ({ body, owner }) => cartService.addItem(body, owner), {
    body: addToCartSchema,
    response: {
      201: cartItemSchema,
      400: errorResponseSchema,
      401: errorResponseSchema,
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
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  )
  .delete(
    "/items/:id",
    ({ params, owner }) => cartService.removeItem(params.id, owner),
    {
      params: idParamSchema,
      response: {
        200: cartItemSchema,
        401: errorResponseSchema,
        404: errorResponseSchema,
      },
    },
  );
