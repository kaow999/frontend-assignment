import { CircleUserRound } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { CartButton } from "./cart-button";
import { HeaderSearch } from "./header-search";

export const SiteHeader = () => (
  <header className="border-b border-line">
    <div className="container-page flex items-center gap-4 py-5 sm:gap-8">
      <Link
        href="/"
        className="shrink-0 text-2xl font-extrabold tracking-tight sm:text-[32px]"
      >
        SHOP.CO
      </Link>

      {/* HeaderSearch reads the URL, so it needs a boundary to prerender behind. */}
      <Suspense
        fallback={<div className="h-12 min-w-0 flex-1 rounded-full bg-surface" />}
      >
        <HeaderSearch />
      </Suspense>

      <div className="flex shrink-0 items-center gap-3">
        <CartButton />
        <button
          aria-label="Account"
          className="rounded-full p-1 text-ink transition-opacity hover:opacity-70"
        >
          <CircleUserRound className="size-6" aria-hidden />
        </button>
      </div>
    </div>
  </header>
);
