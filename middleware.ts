import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

export default authkitMiddleware({
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
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
