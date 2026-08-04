"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { ApiError } from "../lib/api/http";

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // The catalogue is seeded and static, so refetching on every window
        // focus is pure noise. The cart opts out of this per-query.
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // A 4xx is the server telling us the request was wrong; repeating it
          // will not change the answer.
          if (error instanceof ApiError && error.status < 500) return false;

          return failureCount < 2;
        },
      },
    },
  });

export const Providers = ({ children }: { children: React.ReactNode }) => {
  // Created in state so React's strict-mode double render — and any future
  // re-render of this provider — reuses one client instead of dropping the cache.
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
