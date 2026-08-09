"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CircleUserRound, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLogout, useSession } from "../../features/auth/use-session";

const TRIGGER =
  "shrink-0 rounded-full p-1 text-ink transition-opacity hover:opacity-70";

export const AccountMenu = () => {
  const { data, isPending } = useSession();
  const logout = useLogout();
  const pathname = usePathname();

  if (isPending) {
    return (
      <span className={TRIGGER} aria-hidden>
        <CircleUserRound className="size-6 opacity-40" />
      </span>
    );
  }

  const user = data?.user ?? null;

  if (!user) {
    // Coming back to where they were is the least surprising thing to do,
    // except from the auth pages themselves.
    const next =
      pathname === "/login" || pathname === "/register" ? "/" : pathname;

    return (
      <Link
        href={`/login?next=${encodeURIComponent(next)}`}
        aria-label="Sign in"
        className={TRIGGER}
      >
        <CircleUserRound className="size-6" aria-hidden />
      </Link>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`Account: ${user.email}`}
        className={TRIGGER}
      >
        <CircleUserRound className="size-6" aria-hidden />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-56 rounded-2xl border border-line bg-white p-2 shadow-lg"
        >
          <DropdownMenu.Label className="px-3 py-2">
            <span className="block text-xs text-ink-muted">Signed in as</span>
            <span className="block truncate text-sm font-medium">
              {user.email}
            </span>
          </DropdownMenu.Label>

          <DropdownMenu.Separator className="my-1 h-px bg-line" />

          <DropdownMenu.Item
            onSelect={() => logout.mutate()}
            disabled={logout.isPending}
            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none data-[highlighted]:bg-surface"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
