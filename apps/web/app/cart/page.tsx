import type { Metadata } from "next";

import { CartView } from "../../components/cart/cart-view";

export const metadata: Metadata = {
  title: "Your cart — SHOP.CO",
};

const CartPage = () => (
  <div className="container-page py-6">
    <h1 className="mb-6 text-2xl font-bold sm:text-[32px]">Your cart</h1>
    <CartView />
  </div>
);

export default CartPage;
