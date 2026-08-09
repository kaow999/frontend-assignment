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

| Choice                       | Reason                                                                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TanStack Query**           | Every piece of state here is server state. `useInfiniteQuery` maps onto the API's `offset`/`hasMore` contract directly, and cache invalidation is the whole cart story. |
| **URL search params**        | Filters belong in the URL: a filtered view is shareable, the back button steps through changes, and a reload lands where you were.                                      |
| **Eden Treaty**              | Already wired up in `lib/eden.ts`. Types are read back off the client, so they follow the backend's zod schemas without being re-declared.                              |
| **Radix slider + dialog**    | A two-thumb range slider and a modal drawer are exactly the components worth not hand-rolling — focus management and keyboard behaviour are the hard parts.             |
| **lucide-react**             | Icon set matching the design's weight.                                                                                                                                 |
| **No global state library**  | The cart lives on the server and the filters live in the URL. There is nothing left for Zustand or Redux to hold.                                                       |

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

The cart query is keyed by owner (`["cart", userId | "guest"]`) rather than by a
single `["cart"]`. Two things fall out of that: signing in swaps to a different
cache entry instead of re-rendering the previous occupant's basket, and the
query is held back until `GET /auth/me` resolves — otherwise a signed-in
shopper's cart could land in the cache under `guest` and be shown to the next
person to sign out. Signing in or out drops every cached cart outright.

Guests still share one cart, which the cart page says out loud rather than
letting it be a surprise.

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

## With more time

- A product detail page — the cards are presentational today, since the brief
  scopes the work to the category page.
- Component and integration tests. The backend has 129; the frontend has none,
  and the filter-state hook and cart summary arithmetic are the two places worth
  covering first.
- Virtualised grid. A thousand cards in the DOM is fine; ten thousand would not
  be.
- The cart is a single global cart with no auth, so it is shared by every
  visitor. Real sessions would be the first thing to add.
