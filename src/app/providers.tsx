"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import {
  useAuth,
  useAccessToken,
  AuthKitProvider,
} from "@workos-inc/authkit-nextjs/components";
import { ReactNode, useCallback, useMemo } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function useConvexAuth() {
  const { user, loading } = useAuth();
  const { accessToken, loading: tokenLoading, refresh } = useAccessToken();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (forceRefreshToken) {
        await refresh();
      }
      return accessToken ?? null;
    },
    [accessToken, refresh]
  );

  return useMemo(
    () => ({
      isLoading: loading || tokenLoading,
      isAuthenticated: !!user,
      fetchAccessToken,
    }),
    [loading, tokenLoading, user, fetchAccessToken]
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthKitProvider>
      <ConvexProviderWithAuth client={convex} useAuth={useConvexAuth}>
        {children}
      </ConvexProviderWithAuth>
    </AuthKitProvider>
  );
}

export { Authenticated, Unauthenticated, AuthLoading };
