"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { useLogin, useRegister } from "../../features/auth/use-session";
import { ApiError } from "../../lib/api/http";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

const MIN_PASSWORD_LENGTH = 8;

type Mode = "login" | "register";

const COPY = {
  login: {
    title: "Sign in",
    action: "Sign in",
    switchPrompt: "New here?",
    switchLabel: "Create an account",
    switchHref: "/register",
  },
  register: {
    title: "Create an account",
    action: "Create account",
    switchPrompt: "Already have an account?",
    switchLabel: "Sign in",
    switchHref: "/login",
  },
} as const satisfies Record<Mode, unknown>;

const Field = ({
  label,
  hint,
  ...props
}: React.ComponentProps<"input"> & { label: string; hint?: string }) => (
  <label className="block">
    <span className="text-sm font-medium">{label}</span>
    <input
      {...props}
      className="mt-2 w-full rounded-full bg-surface px-5 py-3 text-sm outline-none placeholder:text-ink-faint"
    />
    {hint && <span className="mt-1.5 block text-xs text-ink-muted">{hint}</span>}
  </label>
);

export const AuthForm = ({ mode }: { mode: Mode }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copy = COPY[mode];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useLogin();
  const registerUser = useRegister();
  const mutation = mode === "login" ? login : registerUser;

  // Only ever a path on this site — an open redirect would let a phishing link
  // bounce someone off the real sign-in page to anywhere.
  const raw = searchParams.get("next") ?? "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    mutation.mutate({ email, password }, { onSuccess: () => router.push(next) });
  };

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md rounded-card border border-line px-8 py-8">
        <h1 className="text-2xl font-bold">{copy.title}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Your cart is kept with your account, so it follows you between devices.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />

          <Field
            label="Password"
            type="password"
            name="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            minLength={mode === "register" ? MIN_PASSWORD_LENGTH : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            hint={
              mode === "register"
                ? `At least ${MIN_PASSWORD_LENGTH} characters.`
                : undefined
            }
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Spinner className="size-4" />
                {copy.action}
              </>
            ) : (
              copy.action
            )}
          </Button>
        </form>

        {mutation.isError && (
          <p
            role="alert"
            className="mt-4 rounded-2xl bg-sale-soft px-4 py-3 text-sm text-sale"
          >
            {mutation.error instanceof ApiError
              ? mutation.error.message
              : "Something went wrong. Please try again."}
          </p>
        )}

        <p className="mt-6 text-sm text-ink-muted">
          {copy.switchPrompt}{" "}
          <Link
            href={copy.switchHref}
            className="font-medium text-ink underline underline-offset-2"
          >
            {copy.switchLabel}
          </Link>
        </p>
      </div>
    </div>
  );
};
