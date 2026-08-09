import { beforeEach, describe, expect, test } from "bun:test";

import {
  api,
  createClient,
  givenProduct,
  resetDatabase,
  type ApiClient,
} from "./helpers";

const PASSWORD = "correct-horse-battery";

/** A fresh browser, signed in as its own account. */
const signedInAs = async (email: string): Promise<ApiClient> => {
  const client = createClient();
  const res = await client("POST", "/auth/register", {
    email,
    password: PASSWORD,
  });
  expect(res.status).toBe(201);

  return client;
};

let ada: ApiClient;
let grace: ApiClient;

beforeEach(async () => {
  resetDatabase();
  // tee: lists at 200, sells at 160 (-20%). hat: lists and sells at 50.
  await givenProduct({ id: "tee", name: "Tee", price: 200, percentageDiscount: 20 });
  await givenProduct({ id: "hat", name: "Hat", price: 50 });

  ada = await signedInAs("ada@example.com");
  grace = await signedInAs("grace@example.com");
});

describe("cart ownership", () => {
  test("two shoppers keep separate carts", async () => {
    await ada("POST", "/cart/items", { productId: "tee", quantity: 2 });
    await grace("POST", "/cart/items", { productId: "hat" });

    const adaCart = await ada("GET", "/cart");
    const graceCart = await grace("GET", "/cart");

    expect(adaCart.body.items).toHaveLength(1);
    expect(adaCart.body.items[0].productId).toBe("tee");
    expect(adaCart.body.totalItems).toBe(2);

    expect(graceCart.body.items).toHaveLength(1);
    expect(graceCart.body.items[0].productId).toBe("hat");
    expect(graceCart.body.totalItems).toBe(1);
  });

  test("the same product in two carts is two independent lines", async () => {
    await ada("POST", "/cart/items", { productId: "tee", quantity: 3 });
    await grace("POST", "/cart/items", { productId: "tee", quantity: 1 });

    const adaCart = await ada("GET", "/cart");
    const graceCart = await grace("GET", "/cart");

    expect(adaCart.body.items[0].id).not.toBe(graceCart.body.items[0].id);
    expect(adaCart.body.items[0].quantity).toBe(3);
    expect(graceCart.body.items[0].quantity).toBe(1);
  });

  test("a guest cart is separate from a signed-in one", async () => {
    await api("POST", "/cart/items", { productId: "hat" });
    await ada("POST", "/cart/items", { productId: "tee" });

    const guest = await api("GET", "/cart");
    const signedIn = await ada("GET", "/cart");

    expect(guest.body.items).toHaveLength(1);
    expect(guest.body.items[0].productId).toBe("hat");
    expect(signedIn.body.items).toHaveLength(1);
    expect(signedIn.body.items[0].productId).toBe("tee");
  });

  test("signing out returns the caller to the guest cart", async () => {
    await api("POST", "/cart/items", { productId: "hat" });

    const client = await signedInAs("hopper@example.com");
    await client("POST", "/cart/items", { productId: "tee" });
    await client("POST", "/auth/logout");

    const afterLogout = await client("GET", "/cart");
    expect(afterLogout.body.items[0].productId).toBe("hat");
  });

  test("totals are computed per cart", async () => {
    await ada("POST", "/cart/items", { productId: "tee", quantity: 2 });
    await grace("POST", "/cart/items", { productId: "hat", quantity: 1 });

    const adaCart = await ada("GET", "/cart");
    const graceCart = await grace("GET", "/cart");

    // tee: 200 list, 160 paid, twice over.
    expect(adaCart.body.subtotal).toBe(400);
    expect(adaCart.body.total).toBe(320);
    expect(adaCart.body.totalDiscount).toBe(80);

    // hat: no discount.
    expect(graceCart.body.subtotal).toBe(50);
    expect(graceCart.body.total).toBe(50);
    expect(graceCart.body.totalDiscount).toBe(0);
  });
});

/**
 * Knowing another shopper's line id must not be enough to touch it. Each of
 * these answers 404 rather than 403 — confirming the id exists would itself
 * leak something.
 */
describe("another shopper's cart item", () => {
  let graceItemId: string;

  beforeEach(async () => {
    const created = await grace("POST", "/cart/items", { productId: "hat" });
    graceItemId = created.body.id;
  });

  test("cannot be read", async () => {
    const res = await ada("GET", `/cart/items/${graceItemId}`);

    expect(res.status).toBe(404);
  });

  test("cannot be updated", async () => {
    const res = await ada("PATCH", `/cart/items/${graceItemId}`, {
      quantity: 9,
    });

    expect(res.status).toBe(404);

    const untouched = await grace("GET", "/cart");
    expect(untouched.body.items[0].quantity).toBe(1);
  });

  test("cannot be deleted", async () => {
    const res = await ada("DELETE", `/cart/items/${graceItemId}`);

    expect(res.status).toBe(404);

    const untouched = await grace("GET", "/cart");
    expect(untouched.body.items).toHaveLength(1);
  });

  test("survives another shopper clearing their own cart", async () => {
    await ada("POST", "/cart/items", { productId: "tee" });
    const cleared = await ada("DELETE", "/cart");

    expect(cleared.body.removed).toBe(1);

    const untouched = await grace("GET", "/cart");
    expect(untouched.body.items).toHaveLength(1);
  });

  test("survives another shopper checking out", async () => {
    await ada("POST", "/cart/items", { productId: "tee" });
    const res = await ada("POST", "/cart/checkout");

    expect(res.status).toBe(200);
    expect(res.body.orderId).toBeString();

    const emptied = await ada("GET", "/cart");
    expect(emptied.body.items).toHaveLength(0);

    const untouched = await grace("GET", "/cart");
    expect(untouched.body.items).toHaveLength(1);
  });
});

describe("checkout is scoped too", () => {
  test("an empty cart is a 409 even when another shopper's cart has items", async () => {
    await grace("POST", "/cart/items", { productId: "hat" });

    const res = await ada("POST", "/cart/checkout");

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Cart is empty");
  });
});
