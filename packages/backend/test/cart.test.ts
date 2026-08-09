import { beforeEach, describe, expect, test } from "bun:test";

import {
  createClient,
  givenColor,
  givenProduct,
  givenSize,
  resetDatabase,
  type ApiClient,
} from "./helpers";

const UUID_V7 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * The cart is behind a session, so every case here runs as one signed-in
 * shopper. Shadowing `api` with that client keeps the call sites reading the
 * same as they did before accounts existed.
 */
let api: ApiClient;

beforeEach(async () => {
  resetDatabase();

  api = createClient();
  await api("POST", "/auth/register", {
    email: "shopper@example.com",
    password: "correct-horse-battery",
  });

  await givenColor("blue");
  await givenSize("large");
  // tee: lists at 200, sells at 160 (-20%). hat: lists and sells at 50.
  await givenProduct({
    id: "tee",
    name: "Tee",
    price: 200,
    percentageDiscount: 20,
    colorId: "blue",
    sizeId: "large",
  });
  await givenProduct({ id: "hat", name: "Hat", price: 50 });
});

describe("GET /cart", () => {
  test("an empty cart still returns a full summary", async () => {
    const res = await api("GET", "/cart");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      items: [],
      totalItems: 0,
      subtotal: 0,
      total: 0,
      totalDiscount: 0,
    });
  });

  test("joins the product onto each line", async () => {
    await api("POST", "/cart/items", { productId: "tee" });
    const res = await api("GET", "/cart");

    expect(res.body.items[0].product.name).toBe("Tee");
  });
});

describe("POST /cart/items", () => {
  test("adds a line and returns 201", async () => {
    const res = await api("POST", "/cart/items", {
      productId: "tee",
      quantity: 2,
    });

    expect(res.status).toBe(201);
    expect(res.body.productId).toBe("tee");
    expect(res.body.quantity).toBe(2);
    expect(res.body.id).toMatch(UUID_V7);
  });

  test("defaults the quantity to 1", async () => {
    const res = await api("POST", "/cart/items", { productId: "tee" });
    expect(res.body.quantity).toBe(1);
  });

  test("adding the same product tops up the existing line", async () => {
    await api("POST", "/cart/items", { productId: "tee", quantity: 2 });
    const res = await api("POST", "/cart/items", {
      productId: "tee",
      quantity: 3,
    });

    expect(res.body.quantity).toBe(5);
    expect((await api("GET", "/cart")).body.items).toHaveLength(1);
  });

  test("topping up clamps at the per-line maximum", async () => {
    await api("POST", "/cart/items", { productId: "tee", quantity: 90 });
    const res = await api("POST", "/cart/items", {
      productId: "tee",
      quantity: 50,
    });

    expect(res.body.quantity).toBe(99);
  });

  test("different products get their own lines", async () => {
    await api("POST", "/cart/items", { productId: "tee" });
    await api("POST", "/cart/items", { productId: "hat" });

    expect((await api("GET", "/cart")).body.items).toHaveLength(2);
  });

  test("an unknown product is a 400", async () => {
    const res = await api("POST", "/cart/items", { productId: "ghost" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Product 'ghost' does not exist");
  });

  test("quantity 0 is rejected with 422", async () => {
    expect(
      (await api("POST", "/cart/items", { productId: "tee", quantity: 0 }))
        .status,
    ).toBe(422);
  });

  test("quantity above the maximum is rejected with 422", async () => {
    expect(
      (await api("POST", "/cart/items", { productId: "tee", quantity: 100 }))
        .status,
    ).toBe(422);
  });

  test("a fractional quantity is rejected with 422", async () => {
    expect(
      (await api("POST", "/cart/items", { productId: "tee", quantity: 1.5 }))
        .status,
    ).toBe(422);
  });

  test("a missing productId is rejected with 422", async () => {
    expect((await api("POST", "/cart/items", {})).status).toBe(422);
  });
});

describe("cart totals", () => {
  test("subtotal is list price, total is what is actually paid", async () => {
    await api("POST", "/cart/items", { productId: "tee", quantity: 2 });
    await api("POST", "/cart/items", { productId: "hat", quantity: 1 });

    const res = await api("GET", "/cart");

    expect(res.body.totalItems).toBe(3);
    expect(res.body.subtotal).toBe(450); // 200*2 + 50
    expect(res.body.total).toBe(370); // 160*2 + 50
    expect(res.body.totalDiscount).toBe(80);
  });

  test("an undiscounted cart has no discount", async () => {
    await api("POST", "/cart/items", { productId: "hat", quantity: 3 });
    const res = await api("GET", "/cart");

    expect(res.body.subtotal).toBe(150);
    expect(res.body.total).toBe(150);
    expect(res.body.totalDiscount).toBe(0);
  });

  test("totals follow a quantity change", async () => {
    const added = await api("POST", "/cart/items", {
      productId: "tee",
      quantity: 1,
    });
    await api("PATCH", `/cart/items/${added.body.id}`, { quantity: 3 });

    expect((await api("GET", "/cart")).body.total).toBe(480);
  });
});

describe("PATCH /cart/items/:id", () => {
  test("sets an absolute quantity rather than adding", async () => {
    const added = await api("POST", "/cart/items", {
      productId: "tee",
      quantity: 5,
    });
    const res = await api("PATCH", `/cart/items/${added.body.id}`, {
      quantity: 2,
    });

    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(2);
  });

  test("an unknown line is a 404", async () => {
    const res = await api("PATCH", "/cart/items/ghost", { quantity: 1 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Cart item 'ghost' not found");
  });

  test("quantity 0 is rejected with 422", async () => {
    const added = await api("POST", "/cart/items", { productId: "tee" });
    expect(
      (await api("PATCH", `/cart/items/${added.body.id}`, { quantity: 0 }))
        .status,
    ).toBe(422);
  });
});

describe("DELETE /cart/items/:id and DELETE /cart", () => {
  test("removes a single line", async () => {
    const added = await api("POST", "/cart/items", { productId: "tee" });
    await api("POST", "/cart/items", { productId: "hat" });

    const res = await api("DELETE", `/cart/items/${added.body.id}`);

    expect(res.status).toBe(200);
    expect((await api("GET", "/cart")).body.items).toHaveLength(1);
  });

  test("removing an unknown line is a 404", async () => {
    expect((await api("DELETE", "/cart/items/ghost")).status).toBe(404);
  });

  test("clearing reports how many lines went", async () => {
    await api("POST", "/cart/items", { productId: "tee" });
    await api("POST", "/cart/items", { productId: "hat" });

    const res = await api("DELETE", "/cart");

    expect(res.body).toEqual({ removed: 2 });
    expect((await api("GET", "/cart")).body.totalItems).toBe(0);
  });

  test("clearing an already-empty cart removes nothing", async () => {
    expect((await api("DELETE", "/cart")).body).toEqual({ removed: 0 });
  });
});

describe("POST /cart/checkout", () => {
  test("an empty cart is a 409", async () => {
    const res = await api("POST", "/cart/checkout");

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Cart is empty");
  });

  test("a non-empty cart returns 200 with a uuid v7 order id", async () => {
    await api("POST", "/cart/items", { productId: "tee" });
    const res = await api("POST", "/cart/checkout");

    expect(res.status).toBe(200);
    expect(res.body.orderId).toMatch(UUID_V7);
  });

  test("each checkout mints a fresh order id", async () => {
    await api("POST", "/cart/items", { productId: "tee" });
    const first = await api("POST", "/cart/checkout");

    // Checkout empties the cart, so it has to be refilled to check out again.
    await api("POST", "/cart/items", { productId: "tee" });
    const second = await api("POST", "/cart/checkout");

    expect(first.body.orderId).toMatch(UUID_V7);
    expect(second.body.orderId).toMatch(UUID_V7);
    expect(first.body.orderId).not.toBe(second.body.orderId);
  });

  test("checkout empties the cart", async () => {
    await api("POST", "/cart/items", { productId: "tee", quantity: 2 });
    await api("POST", "/cart/checkout");

    const cart = await api("GET", "/cart");
    expect(cart.body.totalItems).toBe(0);
    expect(cart.body.items).toEqual([]);
    expect(cart.body.total).toBe(0);
  });

  test("a second checkout straight after is a 409", async () => {
    await api("POST", "/cart/items", { productId: "tee" });
    await api("POST", "/cart/checkout");

    expect((await api("POST", "/cart/checkout")).status).toBe(409);
  });

  test("checkout fails again once the cart is cleared", async () => {
    await api("POST", "/cart/items", { productId: "tee" });
    await api("DELETE", "/cart");

    expect((await api("POST", "/cart/checkout")).status).toBe(409);
  });
});
