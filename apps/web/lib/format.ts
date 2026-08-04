/**
 * Every money value in the API is a whole number of dollars — the schema types
 * price, discountedPrice and all the cart totals as integers — so there are no
 * cents to render.
 */
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const formatPrice = (value: number) => currency.format(value);

/** Ratings are stored to one decimal place, and the design shows "4.5/5". */
export const formatRating = (value: number) => value.toFixed(1);
