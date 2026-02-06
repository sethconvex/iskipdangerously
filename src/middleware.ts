import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

export const middleware = authkitMiddleware({
  eagerAuth: true,
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: [
      "/",
      "/signin",
      "/feed",
      "/feed/(.*)",
      "/post/(.*)",
      "/shop",
      "/shop/(.*)",
      "/auth/(.*)",
      "/api/(.*)",
    ],
  },
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
