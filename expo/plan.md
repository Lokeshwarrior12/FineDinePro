# plan.md -- SoloPro / FineDine -- Technical Blueprint
Last updated: 2026-05-05 by CTO Agent

## Project Overview
SoloPro / FineDine is an Expo React Native mobile app for diners and restaurant owners. Diners discover restaurants, browse deals, place orders, book tables/services, and manage favorites/profile. Restaurant owners manage operations through dashboards covering orders, bookings, inventory, staff/schedules, deals, and analytics. The immediate product objective is a reliable demo-first mobile app that can fall back to mock data cleanly while backend/auth hardening continues.

## HLD -- High Level Design
```
[Expo React Native App]
  -> [Expo Router route groups: customer, restaurant, shared auth]
  -> [React Query + local context state]
  -> [API client / Supabase client when available]
  -> [Mock data fallback for demo reliability]
  -> [Backend services: Hono/tRPC/Go/Supabase artifacts currently present]
```

System boundaries:
- Mobile app owns navigation, UI state, demo fallback, and user flows.
- Supabase currently supports auth/session and typed database access where configured.
- Mock data supports resilient previews when remote data or RLS fails.
- Production backend/database rules require separate hardening before launch.

Third-party integrations:
- Expo SDK modules for mobile runtime.
- Supabase for auth/database where configured.
- React Query for server-state caching.
- Lucide React Native for iconography.
- Google Maps public key available for future location workflows.

## LLD -- Low Level Design
Core components and modules:
- `app/_layout.tsx`: root providers, router stack, splash/loading handling, React Query defaults.
- `contexts/AuthContext.tsx`: auth/session/profile facade, currently builds profile from auth metadata and local cache in mock-friendly mode.
- `contexts/ThemeContext.tsx`: app theme provider.
- `lib/api.ts`: typed API client and domain interfaces.
- `lib/supabase.ts`: Supabase client and database schema typings.
- `mocks/data.ts`: canonical demo data for restaurants, deals, services, categories, analytics, and related flows.
- `app/(customer)/*`: customer-facing browsing, booking, ordering, deals, profile flows.
- `app/(restaurant)/*`: owner dashboard and operational screens.

Important method contracts:
- `AuthProvider.signIn(credentials)` signs in or surfaces user-friendly error.
- `AuthProvider.signup(credentials)` creates auth user and avoids direct public-client writes that violate RLS.
- `AuthProvider.updateProfile(data)` updates local profile/cache in demo mode.
- `AuthProvider.toggleFavorite(restaurantId)` updates local favorites/cache in demo mode.
- API client methods should return typed domain objects or throw sanitized errors.

## Technology Decisions
Language: TypeScript -- Reason: strict typing for mobile app reliability.
Framework: Expo + React Native + Expo Router -- Reason: fast native iOS/Android development with file-based routing and Rork preview support.
State: React Query + typed context hooks/local state -- Reason: cache server data and keep local UI state predictable.
Database/Auth: Supabase currently configured -- Reason: managed auth and Postgres-style backend, but RLS policies must be fixed before production reliance.
Mock Strategy: local mock data fallback -- Reason: previews and demos must keep working even when remote data fails.
Backend: existing Hono/tRPC/Go artifacts are present -- Reason: current repo has mixed backend attempts; production architecture must be consolidated before launch.

## Architecture Pattern
Decision: Mobile-first app with backend service boundary and demo/mock fallback.
Reason: The current priority is reliable app experience while backend contracts mature.
Tradeoff accepted: Some data paths are mock/local-first until production backend and RLS policies are finalized.

## API Contracts
Current intended internal contracts:
- Auth: sign in, sign up, sign out, refresh session, get token.
- Restaurants: list, detail, owner-owned restaurants, create/update.
- Menu items: list by restaurant, create/update availability/items.
- Orders: list by user/restaurant, create order, update status.
- Bookings: list by user/restaurant, create table/service booking, update status.
- Deals/coupons: list active deals, claim coupon, owner deal management.
- Inventory: list/update stock, low-stock queries.
- Analytics: restaurant metrics, revenue trends, top items.

All production endpoints must use authenticated requests where appropriate, validate input at API boundary, and return sanitized errors.

## Database Design
Current typed entities include users, restaurants, menu_items, orders, bookings, favorites, inventory, notifications, deals, coupons, services, booking_slots, schedules, employees, and analytics-like records.

Required production hardening:
- Confirm exact Supabase table names and snake_case/camelCase mapping.
- Add/verify RLS policies for user profile creation and owner/customer scoped access.
- Add indexes for foreign keys: `user_id`, `restaurant_id`, `owner_id`, status/date fields.
- Keep migrations separate from runtime code.

## Environment Strategy
Development/demo:
- Uses Expo public env vars and mock fallback.
- Can show verbose sanitized logs.
- Should not repeatedly retry failed real-data fetches in preview.

Production:
- Secrets remain server-side only; client only receives public keys.
- No production deploy without explicit human approval.
- Production logs must avoid sensitive data.
- Live database migrations require approval.

## Component Inventory
- CEO / Product: `me.md` owns product intent and non-negotiables.
- CTO / Architecture: `plan.md` owns technical blueprint and decisions.
- PM / Audit Trail: `work.md` owns action history.
- Frontend: `app/**`, `components` if added, styles/constants.
- Auth/Data: `contexts/AuthContext.tsx`, `lib/supabase.ts`, `lib/api.ts`.
- Mock/Data: `mocks/data.ts`.
- Backend: `backend/**`, `hono.ts`, `db/**`, `handlers/**`.

## Dependency Map
- `app/_layout.tsx` wraps `QueryClientProvider`, `ThemeProvider`, `AuthProvider`, then route stack.
- Screens call hooks/context/API helpers and read mock data as needed.
- `AuthContext` depends on Supabase auth, AsyncStorage, and API token setter.
- `lib/api.ts` depends on Expo Constants for API URL and fetch for requests.
- `lib/supabase.ts` depends on public Supabase env/config and AsyncStorage.
- Mock-driven screens depend on `mocks/data.ts` and `types`.

## Security Boundaries
- Never hardcode private keys or log secrets.
- Public Expo env vars are client-visible and cannot be treated as secrets.
- Auth/profile writes must respect RLS; public client should not perform privileged database inserts.
- Password handling must remain delegated to Supabase or a hardened backend.
- Production CORS/rate limiting/input validation must be verified before launch.

## Performance Targets
- Initial preview load should avoid repeated failed network retries.
- Customer browsing screens should render from cached/mock data in under 1 second in demo mode.
- React Query should avoid refetch loops: no focus/reconnect/mount refetch in current demo stabilization.
- Lists should remain lightweight and image-heavy screens should use optimized remote image sizing.

## Decision Log
| Date | Decision | Options Rejected | Reason |
| ---- | -------- | ---------------- | ------ |
| 2026-05-05 | Adopt SoloPro AI OS living files in repo root (`expo/plan.md`, `expo/me.md`, `expo/work.md`) | Continuing without durable project memory | User authorized applying `SoloPro_AI_OS.docx`; future work needs traceable plan/vision/history. |
| 2026-05-05 | Treat current app as demo/mock-first until backend/RLS is hardened | Forcing live Supabase data on every preview | User explicitly asked to show mock data and avoid repeated failed fetches after one failure. |
| 2026-05-05 | Keep production deployment gated by explicit approval | Automated production deploy | SoloPro AI OS and security non-negotiables require human approval for production actions. |
