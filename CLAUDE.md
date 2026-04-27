# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PGOwns (package name: `pgnest`) is a Mumbai-focused PG (paying guest) accommodation platform built with Next.js 14, Supabase, and Razorpay. It supports three user roles — tenant, owner, and admin — each with a separate dashboard and enforced via middleware + Supabase RLS.

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

- `src/middleware.ts` protects `/owner/*`, `/tenant/*`, `/admin/*` routes. Unauthenticated users are redirected to `/login`. Admin routes additionally check `profiles.role` — non-admins are redirected to `/`.
- `src/hooks/useUser.ts` — client-side hook subscribing to Supabase auth state changes and fetching the user's profile. Returns `{ profile, loading, isOwner, isTenant, isAdmin, email }`. The `supabase` client inside must be memoized with `useMemo(() => createClient(), [])`.
- Signup is a **custom two-step OTP flow** (not Supabase's built-in email):
  1. Step 1: collects name/email/password/role, calls `supabase.auth.signUp()` (email confirm disabled in Supabase dashboard, `emailRedirectTo: undefined`), then POSTs to `/api/send-otp`.
  2. Step 2: user enters 6-digit code, POSTs to `/api/verify-otp`, then calls `supabase.auth.signInWithPassword()` to establish the session.
- Role is passed as `options.data.role` at signup and picked up by the DB trigger that auto-creates the profile.

### Custom OTP System

- `src/app/api/send-otp/route.ts` — generates a 6-digit OTP, stores it in `email_otps` table (10-minute expiry) via `createAdminClient()`, and sends a branded email via Resend from `"PG Owns <noreply@pgowns.in>"`.
- `src/app/api/verify-otp/route.ts` — validates the OTP (unused + non-expired), marks it as used, returns `{ success: true/false }`. Uses `createAdminClient()` because the `email_otps` table has `USING (false)` RLS (service role only).
- The `email_otps` table must be created manually in Supabase SQL Editor (not in the migration file). Schema: `id uuid`, `email text`, `otp text`, `expires_at timestamptz`, `used boolean default false`.

### Supabase Clients

Two clients in `src/lib/supabase/`:
- `client.ts` — browser client for `"use client"` components. Always memoize: `const supabase = useMemo(() => createClient(), [])`.
- `server.ts` — async server client (respects RLS) + `createAdminClient()` (bypasses RLS via service role key, server-side only).

### React Hooks Pattern

All client components that fetch data must follow this pattern to satisfy `react-hooks/exhaustive-deps`:
```ts
const supabase = useMemo(() => createClient(), []);

const fetchData = useCallback(async () => {
  // fetch using supabase
}, [supabase, /* other deps */]);

useEffect(() => {
  fetchData();
}, [fetchData]);
```
Never define async functions directly inside `useEffect`. Never use `as any` — define proper TypeScript interfaces instead.

### Route Structure

```
src/app/
  page.tsx                  # Landing page (client component, carousel + search)
  login/ signup/            # Auth pages
  auth/callback/            # OAuth callback
  admin/                    # Admin dashboard (listings overview)
  owner/                    # Owner dashboard (listings, bookings, deposits)
  tenant/                   # Tenant dashboard (search, bookings, deposit)
    listing/[id]/           # Dynamic listing detail
  api/
    send-otp/               # Custom OTP email sender (Resend)
    verify-otp/             # OTP validator
    visit/                  # Analytics endpoint
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
| `email_otps` | Custom OTP records (created manually, not in migration) |

Key DB behaviors driven by triggers:
- Profile auto-created on `auth.users` insert
- Deposit auto-created when `booking.status` changes to `active`
- Listing availability toggled when booking status changes
- Deposit balance auto-updated when deductions are approved

### Types

All shared TypeScript types are in `src/types/index.ts` — enums for status values, database entity interfaces, form interfaces, and Razorpay types. Use these types and the `Gender`, `Listing["furnishing"]`, `Listing["room_type"]` patterns instead of `as any`.

### Utilities (`src/lib/utils/index.ts`)

- `cn()` — Tailwind class merger (clsx + tailwind-merge)
- `formatCurrency()` / `formatCurrencyCompact()` — Indian Rupee formatting
- `AMENITY_LABELS` — display names for amenity keys
- `AREAS_MUMBAI` — 28 Mumbai area names for filters
- `BOOKING_STATUS_CONFIG` / `DEDUCTION_STATUS_CONFIG` — color configs for status badges
- `getInitials()` — initials from full name string

### UI Libraries

- **Radix UI** — unstyled primitives (Avatar, Dialog, DropdownMenu, Select, Switch, Tabs, etc.)
- **react-hook-form + zod** — forms and validation
- **sonner** — toast notifications (`toast.success()`, `toast.error()`)
- **lucide-react** — icons
- **date-fns** — date formatting

### Brand & Styling

**Logo**: `public/logo.svg` — pigeon/PG mark SVG. ViewBox is cropped to content (`330 325 365 375`). Always use `next/image` `<Image>` component, not `<img>`. On dark backgrounds add `className="brightness-0 invert"`. Standard sizes: 44px (main nav), 36px (sidebar), 40px (auth pages).

**Fonts**: Outfit (display/headings, `font-display` class) + Inter (body). Loaded via `next/font/google` in `layout.tsx`.

**Color system** (Tailwind theme):
- `forest-*` — green scale centered on `#1a3d2b` (primary brand, buttons, active states)
- `amber-*` — amber/gold scale for accents
- `surface-*` — cool gray scale for UI backgrounds
- Custom animations: `fade-up`, `fade-in`, `shimmer`

**Email sender**: Always use `"PG Owns <noreply@pgowns.in>"` (note the space between PG and Owns).

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
