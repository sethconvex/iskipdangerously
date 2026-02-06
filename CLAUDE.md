# Ship Dangerously

Community site for AI wins ("Skips") and fails ("Sins"). Users post images, vote, and buy t-shirts.

## Tech Stack
- Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui
- Convex (real-time backend, database, file storage)
- WorkOS AuthKit (authentication)
- Stripe (payments)
- Printful (print-on-demand t-shirt fulfillment)
- fal.ai (AI image generation for t-shirt designs)

## Development
```bash
npm run dev          # Runs Next.js + Convex dev server in parallel
npm run dev:next     # Just Next.js
npm run dev:convex   # Just Convex
```

## Key Architecture
- All backend logic is in `convex/` — queries, mutations, actions
- Stripe/Printful webhooks go through `convex/http.ts` (Convex HTTP actions)
- fal.ai calls happen client-side through `/api/fal/proxy` (keeps API key server-side)
- Auth: WorkOS AuthKit tokens bridged to Convex via `src/app/providers.tsx`
- Image uploads go to Convex file storage, not S3

## API Keys Required
- CONVEX_DEPLOYMENT, NEXT_PUBLIC_CONVEX_URL (from `npx convex init`)
- WORKOS_CLIENT_ID, WORKOS_API_KEY, WORKOS_COOKIE_PASSWORD
- STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
- PRINTFUL_API_KEY
- FAL_KEY

## Database
7 Convex tables: users, posts, votes, products, cartItems, orders, designs
Schema is in `convex/schema.ts`.
