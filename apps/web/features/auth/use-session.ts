"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchSession,
  login,
  logout,
  register,
  type Credentials,
} from "../../lib/api/auth";
import { queryKeys } from "../../lib/query-keys";

/** The cache label for a signed-out shopper's cart. */
export const GUEST = "guest";

/**
 * `GET /auth/me` answers for signed-out callers too, so this is never an error
 * state — `user` is simply null when nobody is signed in.
 */
export const useSession = () =>
  useQuery({
    queryKey: queryKeys.session,
    queryFn: ({ signal }) => fetchSession(signal),
    staleTime: 0,
  });

/**
 * Which cart the current visitor owns, if any.
 *
 * `isReady` matters: until the session resolves we do not know whose cart the
 * server will return, and caching it under the wrong key would leave one
 * shopper's basket sitting in another's cache entry.
 */
export const useCartOwner = () => {
  const { data, isPending } = useSession();
  const user = data?.user ?? null;

  return {
    owner: user?.id ?? GUEST,
    isSignedIn: Boolean(user),
    isReady: !isPending,
  };
};

/**
 * Signing in or out changes which cart the API will answer with, so every
 * cached cart is dropped rather than invalidated — invalidation would refetch
 * and briefly re-render the old one.
 */
const useSessionChange = () => {
  const queryClient = useQueryClient();

  return async () => {
    queryClient.removeQueries({ queryKey: queryKeys.cart.all });
    await queryClient.invalidateQueries({ queryKey: queryKeys.session });
  };
};

export const useLogin = () => {
  const onSessionChange = useSessionChange();

  return useMutation({
    mutationFn: (credentials: Credentials) => login(credentials),
    onSuccess: onSessionChange,
  });
};

export const useRegister = () => {
  const onSessionChange = useSessionChange();

  return useMutation({
    mutationFn: (credentials: Credentials) => register(credentials),
    onSuccess: onSessionChange,
  });
};

export const useLogout = () => {
  const onSessionChange = useSessionChange();

  return useMutation({
    mutationFn: logout,
    onSuccess: onSessionChange,
  });
};
