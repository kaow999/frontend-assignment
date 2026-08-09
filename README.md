# Frontend Assignment

A Turborepo monorepo containing a Next.js storefront and an Elysia + SQLite API
for a clothing e-commerce site, built against the
![design](./design.jpg)
[Figma design](https://www.figma.com/design/oeo29zOYPzlmffBrqugYBD/Frontend-Assignment?node-id=0-1).

The backend is complete and seeded with 1000 products. The storefront is the
work to be done.

---

## The assignment

Build the category page from the design. It must satisfy the following.

### 1. Product listing with infinite-scroll pagination

Products load a page at a time, and the next page is fetched as the user
scrolls — no numbered pagination, and no "load more" button as the primary
mechanism. Fetching stops once the catalogue is exhausted.

Each card renders the product name, image, rating out of 5, and current price.
Discounted products also show the original price struck through, alongside the
discount percentage.

### 2. Filtering and search

Every facet in the design's filter panel, applied together:

- **Price** — a range slider from **$0 to $300**
- **Colors** — multi-select swatches
- **Size** — multi-select pills
- **Search** — find products by name

Colors and sizes are multi-select: picking more than one **widens** the results,
while different facets **narrow** them. Load the available colors and sizes from
the API rather than hardcoding them.

Changing a filter resets the list back to the first page.

### 3. Cart CRUD with a correct price summary

Add items to the cart, view it, change quantities, and remove items — with the
price summary staying consistent with the contents at all times.

The summary covers the number of items, the subtotal at list price, the total
discount, and the final total to pay.

### 4. Checkout

Checking out a non-empty cart returns an order id. On success, redirect the user
to a success page showing that id.

Checking out an empty cart fails — surface the error rather than navigating.

> Checkout is a mock: there is no payment step and no order is stored.

---

## Frontend stack — bring your own

**We give you an empty Next.js + Tailwind project. Everything else is your
call.**

What is already in `apps/web`:

- Next.js 16 (App Router) and React 19
- Tailwind CSS v4, wired up and ready
- TypeScript and ESLint, hooked into the monorepo config
- One page that says _"Show your potential to the world"_

That is the whole starting point. Keep Next.js and Tailwind as the base — beyond
that, bring whatever you would actually reach for:

- **Data fetching** — how you talk to the API, cache, and handle loading and
  error states
- **State management** — where filter, cart, and UI state lives
- **Components** — roll your own or reach for a library
- **Architecture** — how you split features, where logic lives, how you name
  things
- **Anything else** — routing patterns, forms, animation, icons, tests, tooling

We are deliberately not suggesting libraries. Choosing them is part of the
exercise.

Add dependencies with `bun add` from inside `apps/web`.

We are not looking for one right answer. We are looking at the decisions you
make and whether you can stand behind them — so pick the stack and structure you
would defend in a code review, and tell us why in your submission email.

The backend is finished; you should not need to change it. If you do, say what
and why.

Let's dance. 🕺

---

## Submission

1. **Fork this repository** to your own GitHub account.
2. Build the storefront on your fork, committing as you go — we like seeing how
   the work progressed.
3. Push your work and make sure the repository is accessible to us (public, or
   private with access granted).
4. **Reply back to HR's email**

In your email, feel free to add anything you would like us to know: trade-offs
you made, what you would do with more time, or extra setup steps if your
solution needs more than `bun install` and `bun dev`.

---

## Accounts and sessions — a change to the backend

> The brief says the backend is finished and to say what changed if it is not.
> This is that note. Accounts are **not** part of the four requirements; they
> were added afterwards, on request, because the cart was a single global row
> set that every visitor shared.

**Schema.** Two new tables, `users` and `sessions`, and one new nullable column,
`cart_items.user_id` (migration `0001`). Nullable is the important part: a
request with no session still reads and writes `user_id IS NULL`, which is
exactly the cart this API had before, so the original 130 tests pass unchanged.

**Routes.** `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` and
`GET /auth/me`. Passwords are hashed with argon2id via `Bun.password` — no new
dependency. The session is an opaque row id in an httpOnly, `SameSite=Lax`
cookie, so no script on the page can read it, and signing out revokes it
server-side the way a stateless JWT could not.

**Cart.** Every cart query is now scoped by owner. Reaching another shopper's
line by id answers 404 rather than 403 — a 403 would confirm the id exists.

**What this does not do.** Guests still share one cart, because guest sessions
were out of scope; signing in is what makes a cart private. There is no merge on
login for the same reason — pulling a shared basket into someone's account would
be worse than leaving it. Also no password reset, email verification, or rate
limiting on login.

CORS now sends `credentials: true`, which is why `WEB_ORIGIN` must stay an exact
origin and can never become a wildcard.

---

## Tech stack

What ships in the repo. The storefront row is a starting point, not a
constraint — see [Frontend stack](#frontend-stack--bring-your-own).

|            |                                               |
| ---------- | --------------------------------------------- |
| Monorepo   | Turborepo + Bun workspaces                    |
| Storefront | Next.js 16, React 19, Tailwind CSS v4         |
| API        | Elysia on Bun                                 |
| Database   | SQLite via Drizzle ORM (`bun:sqlite`)         |
| Validation | Zod v4 on both request and response           |
| Tests      | `bun test` — 160, covering the API and seeder |

---

## Prerequisites

- **Bun 1.3.13+** — the package manager and runtime ([install](https://bun.sh))
- **Node.js 18+** — required by Next.js

No database server to install; SQLite is a file.

---

## Setup

```sh
git clone <repo-url>
cd frontend-assignment
bun install
```

That is the whole setup. The database file, its migrations, and the 1000-product
seed are all created automatically the first time the API boots.

Optionally, copy the backend env template — every value has a working default,
so this is only needed to change one:

```sh
cp packages/backend/.env.example packages/backend/.env
```

---

## Running

Start everything from the repo root:

```sh
bun dev
```

| Service    | URL                     |
| ---------- | ----------------------- |
| Storefront | <http://localhost:3000> |
| API        | <http://localhost:4000> |

On first run the API prints:

```text
Fresh database at ./sqlite.db — seeding...
Seeded 1000 products, 10 colors, 9 sizes
Backend is running at http://localhost:4000
```

Subsequent runs reuse the existing database and skip seeding.

To run just one side:

```sh
cd apps/web        && bun dev   # storefront only
cd packages/backend && bun dev  # API only (watch mode)
```

Verify the API is up:

```sh
curl localhost:4000/health
```

---

## Seed data

Generated deterministically, so every machine gets the same catalogue.

- **1000 products** — names built from the design's vocabulary ("Gradient
  Graphic", "Skinny Fit", "Loose Fit … Bermuda Shorts")
- **Prices $50–$300**, discounts of 0/10/20/30/40%, ratings 2.5–5.0
- **10 colors** — the exact swatch palette from the design
- **9 sizes** — XX-Small through 4X-Large, matching the filter pills
- **Images** from [Unsplash](https://unsplash.com/s/photos/product-clothes?orientation=portrait),
  served at the cards' 3:4 crop (600×800)

Colors are spread 100 products each and sizes ~111 each, so every swatch and
pill returns results.

> The price filter spans $0–$300 as specified, but no seeded product is priced
> below $50 — the design's own cards start at $80. Narrowing the slider's upper
> bound below $50 legitimately returns an empty list.

---

## Database tasks

Run from `packages/backend`:

| Command               |                                                        |
| --------------------- | ------------------------------------------------------ |
| `bun run db:studio`   | Browse and edit data at <https://local.drizzle.studio> |
| `bun run db:seed`     | Migrate and seed if empty (no-op otherwise)            |
| `bun run db:reset`    | Delete the database and rebuild it from scratch        |
| `bun run db:generate` | Generate a migration after editing `src/db/schema.ts`  |
| `bun run db:migrate`  | Apply pending migrations                               |

---

## Tests

```sh
bun test                      # from the repo root, via turbo
cd packages/backend && bun test
```

160 tests covering every endpoint, all filter combinations, cart arithmetic,
checkout, accounts and cart isolation, and the seeder. They drive the real
Elysia app in-process against an in-memory database, so the full stack —
routing, validation, handlers — runs exactly as it would over the network. No
server or port needed.

---

## Other commands

Run from the repo root:

| Command               |                                |
| --------------------- | ------------------------------ |
| `bun dev`             | Start storefront and API       |
| `bun run build`       | Production build               |
| `bun run lint`        | ESLint across all packages     |
| `bun run check-types` | TypeScript across all packages |
| `bun run format`      | Prettier                       |

---

## Project structure

```text
apps/
  web/                     Next.js storefront (port 3000)
    app/                   App Router pages
    components/            presentation, grouped by feature
    features/              queries, mutations and behaviour
    lib/                   typed API client and shared plumbing
packages/
  backend/                 Elysia API (port 4000)
    src/
      app.ts               route graph (no port binding — used by tests)
      index.ts             bootstrap: migrate, seed, listen
      common/              errors, HTTP mapping, id generation, session cookie
      db/                  drizzle schema, migrations, seeder
      domains/             one folder per domain
        products/          products.repo · .biz · .service · .router · .schema
        colors/
        sizes/
        cart/
        auth/
    test/                  bun test suites
    drizzle/               generated SQL migrations
  eslint-config/
  typescript-config/
```

Each domain is layered:

| Layer      | File           | Responsibility                                |
| ---------- | -------------- | --------------------------------------------- |
| Repository | `*.repo.ts`    | Database queries only, no rules               |
| Business   | `*.biz.ts`     | Rules, invariants, cross-domain orchestration |
| Controller | `*.service.ts` | Maps results and domain errors to HTTP        |
| Route      | `*.router.ts`  | HTTP surface, request and response schemas    |

---

## Environment variables

Defined in `packages/backend/.env.example`; all optional.

| Variable              | Default                 |                                             |
| --------------------- | ----------------------- | ------------------------------------------- |
| `PORT`                | `4000`                  | API port                                    |
| `WEB_ORIGIN`          | `http://localhost:3000` | CORS allow-origin                           |
| `DATABASE_URL`        | `./sqlite.db`           | SQLite file; `:memory:` for throwaway       |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Set in `apps/web` — where the client points |
