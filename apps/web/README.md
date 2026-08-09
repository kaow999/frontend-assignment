# Storefront

The category page, cart and checkout from the Figma design, built on the
Next.js + Tailwind starter in this workspace.

## Running

From the repo root:

```sh
bun dev
```

Storefront on <http://localhost:3000>, API on <http://localhost:4000>. That is
the whole setup — every environment variable has a working default.

To change one, copy the template next to the package that reads it. Next.js
loads env files from `apps/web` and Bun loads them from `packages/backend`; a
`.env` at the repo root is not read by either.

```sh
cp apps/web/.env.example apps/web/.env.local          # NEXT_PUBLIC_API_URL
cp packages/backend/.env.example packages/backend/.env # PORT, WEB_ORIGIN, DATABASE_URL
```

`NEXT_PUBLIC_API_URL` must point at the backend's `PORT`, and the storefront's
origin must match the backend's `WEB_ORIGIN` or CORS will block every request.

Node 20.9+ is required — Next.js 16 declares `engines.node >= 20.9`, so the
repo root carries an `.nvmrc`. (The top-level README's "Node 18+" predates the
Next 16 upgrade.)

## Stack, and why

| Choice                      | Reason                                                                                                                                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TanStack Query**          | Every piece of state here is server state. `useInfiniteQuery` maps onto the API's `offset`/`hasMore` contract directly, and cache invalidation is the whole cart story. |
| **URL search params**       | Filters belong in the URL: a filtered view is shareable, the back button steps through changes, and a reload lands where you were.                                      |
| **Eden Treaty**             | Already wired up in `lib/eden.ts`. Types are read back off the client, so they follow the backend's zod schemas without being re-declared.                              |
| **Radix slider + dialog**   | A two-thumb range slider and a modal drawer are exactly the components worth not hand-rolling — focus management and keyboard behaviour are the hard parts.             |
| **lucide-react**            | Icon set matching the design's weight.                                                                                                                                  |
| **No global state library** | The cart lives on the server and the filters live in the URL. There is nothing left for Zustand or Redux to hold.                                                       |

## Layout

```text
app/                     routes and providers
components/
  category/              the category page shell
  products/              grid, card, add-to-cart control
  filters/               panel, drawer, and one component per facet
  cart/                  line rows and the order summary
  layout/                header, search, announcement bar
  ui/                    button, stars, price, stepper, spinner
features/
  products/              product queries, filter state, infinite scroll
  cart/                  cart queries and mutations, summary arithmetic
  facets/                colour and size queries
lib/
  api/                   typed wrappers over the Treaty client
```

`components/` is presentation, `features/` is the data and behaviour behind it,
`lib/` is shared plumbing. A component reaches for a hook in `features/`; a hook
never imports a component.

## Accounts

Added after the four requirements, on request — the API's cart was one global
row set shared by every visitor. See the root README for the backend side.

The session is an httpOnly cookie, so there is no token for the frontend to
store or leak; the Eden client just sends `credentials: "include"` and the API
decides whose cart to answer with.

There is no guest cart. `/cart` answers 401 without a session, so the cart query
does not run at all when signed out — it is not fired off to fail. The add
button on a card becomes a sign-in link that carries the current filters in
`?next=`, so signing in returns the shopper to the exact list they were looking
at. The cart page shows a sign-in panel rather than an empty basket.

The cart query is keyed by owner (`["cart", userId]`) rather than a single
`["cart"]`. Two things fall out of that: signing in swaps to a different cache
entry instead of re-rendering the previous occupant's basket, and the query is
held back until `GET /auth/me` resolves — otherwise one shopper's cart could
land in the cache under the wrong key. Signing in or out drops every cached
cart outright.

## Decisions worth flagging

**Filters apply live.** The design has an "Apply Filter" button, but the brief
asks that changing a filter reset the list to the first page, which reads as
live filtering. The button is kept and does the job the panel otherwise has no
control for: clearing everything. On mobile the drawer's footer button just
dismisses the sheet, and shows how many products are behind it.

**The price facet filters list price, not the discounted price.** That is the
backend's behaviour, and it means a product shown at $120 can sit outside a
slider capped at $150 if its list price is $150. Worth confirming which one the
shopper is meant to be filtering on.

**Sizes are reordered for display.** `GET /sizes` sorts alphabetically, which
puts 3X-Large ahead of Small. The pills are still whatever the API returns —
only the order is imposed, and unknown sizes fall through to the end.

**Checkout stays enabled on an empty cart.** The brief asks that checking out an
empty cart fails and surfaces the error; disabling the button would make that
path unreachable. The 409's own message is what gets shown.

**Quantity changes are optimistic, adds are not.** A shopper watching the number
they just clicked should not wait a round trip. A new cart line has no id until
the server mints one, so faking it would only make the row flicker.

## Bugs found while verifying

**A missing price bound read as $0.** `Number(null)` and `Number("")` are both
`0`, and `0` passes `Number.isFinite`, so the fallback for an absent `max` never
ran. A first load sent `maxPrice=0` and filtered the whole catalogue away —
every product gone, no error anywhere. Absence is now ruled out before parsing.

**Alphabetical sizes.** Covered above: the API's order put 3X-Large ahead of
Small.

## Verified

`bun run lint`, `check-types` and `build` pass across the monorepo, and the
backend's 169 tests pass. Each requirement was also driven in a browser against
the running API, with counts cross-checked against the API directly:

| Check                | Result                                                             |
| -------------------- | ------------------------------------------------------------------ |
| Infinite scroll      | 12 at a time, stopping at "Showing 111 of 111" with an end message |
| Multi-select widens  | green + red = 200 (100 each)                                       |
| Facets narrow        | green AND size small = 11                                          |
| Price                | $50–$100 = 193                                                     |
| Search combines      | "Jumpsuit" + $50–$100 = 18                                         |
| Filter change resets | 111 loaded, change a facet, back to 12                             |
| Cart summary         | 3 items, $456 subtotal, −$182, $274 — matches `GET /cart` exactly  |
| Checkout             | Redirects with an order id; empty cart shows the 409 and stays put |
| Cart isolation       | Two accounts, two carts; signed out is a 401                       |

## With more time

- A product detail page — the cards are presentational today, since the brief
  scopes the work to the category page.
- Frontend tests. The backend has 169; the frontend has none, and the
  filter-state hook and the cart summary arithmetic are the two places worth
  covering first.
- Virtualised grid. A thousand cards in the DOM is fine; ten thousand would not
  be.
- On the accounts side: password reset, email verification, and rate limiting on
  login.
