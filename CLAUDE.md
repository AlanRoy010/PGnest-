# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PGNest is a Mumbai-focused PG (paying guest) accommodation platform built with Next.js 14, Supabase, and Razorpay. It supports three user roles — tenant, owner, and admin — each with a separate dashboard and enforced via middleware + Supabase RLS.

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run start     # Run production build
npm run lint      # ESLint
```

No test suite is currently configured.

## Architecture

### Auth & Role Enforcement

- `src/middleware.ts` protects `/owner/*`, `/tenant/*`, `/admin/*` routes. Unauthenticated users are redirected to `/login`. Admin routes check the `profiles.role` column.
- `src/hooks/useUser.ts` — client-side hook that subscribes to Supabase auth state changes and fetches the user's profile. Returns `{ profile, loading, isOwner, isTenant, isAdmin }`.

### Supabase Clients

Two clients in `src/lib/supabase/`:
- `client.ts` — browser client for "use client" components
- `server.ts` — async server client (respects RLS) + `createAdminClient()` (bypasses RLS via service role key, server-side only)

### Route Structure

```
src/app/
  page.tsx                  # Landing page
  login/ signup/            # Auth pages
  auth/callback/            # OAuth callback
  admin/                    # Admin dashboard (listings overview)
  owner/                    # Owner dashboard (listings, bookings, deposits)
  tenant/                   # Tenant dashboard (search, bookings, deposit)
    listing/[id]/           # Dynamic listing detail
  api/visit/                # Analytics endpoint
```

Each role group has its own `layout.tsx` with a sidebar navigation.

### Database (Supabase)

Schema is in `supabase/migrations/001_initial_schema.sql`. All tables have RLS enabled. Key tables:

| Table | Purpose |
|---|---|
| `profiles` | Users with `role` (tenant/owner/admin), auto-created on signup |
| `listings` | PG properties with amenities, photos, rent, deposit |
| `bookings` | Booking records (pending → approved → active → completed/cancelled) |
| `payments` | Razorpay payment tracking |
| `deposits` | Security deposit per booking (auto-created when booking goes active) |
| `deposit_deductions` | Deduction claims with evidence photos |
| `notifications` | User notifications |

Key DB behaviors driven by triggers:
- Profile auto-created on `auth.users` insert
- Deposit auto-created when `booking.status` changes to `active`
- Listing availability toggled when booking status changes
- Deposit balance auto-updated when deductions are approved

### Types

All shared TypeScript types are in `src/types/index.ts` — enums for status values, database entity interfaces, form interfaces, and Razorpay types.

### Utilities (`src/lib/utils/index.ts`)

- `cn()` — Tailwind class merger (clsx + tailwind-merge)
- `formatCurrency()` / `formatCurrencyCompact()` — Indian Rupee formatting
- `AMENITY_LABELS` — display names for amenity keys
- `AREAS_MUMBAI` — 28 Mumbai area names for filters
- `BOOKING_STATUS_CONFIG` / `DEDUCTION_STATUS_CONFIG` — color configs for status badges

### Styling

Custom Tailwind theme with:
- `brand-*` colors (orange scale, primary actions)
- `surface-*` colors (neutral gray scale, UI backgrounds)
- Custom animations: `fade-up`, `fade-in`, `shimmer`

### Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_RAZORPAY_KEY_ID
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
NEXT_PUBLIC_APP_URL
RESEND_API_KEY
```
