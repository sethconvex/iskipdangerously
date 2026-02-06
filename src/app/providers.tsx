"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import {
  useAuth,
  AuthKitProvider,
} from "@workos-inc/authkit-nextjs/components";
import { ReactNode, useCallback, useMemo } from "react";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
);

function useConvexAuth() {
  const { user, isLoading, getAccessToken } = useAuth();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        const token = await getAccessToken();
        return token ?? null;
      } catch {
        return null;
      }
    },
    [getAccessToken]
  );

  return useMemo(
    () => ({
      isLoading,
      isAuthenticated: !!user,
      fetchAccessToken,
    }),
    [isLoading, user, fetchAccessToken]
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
