# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # dev server on http://localhost:3000
pnpm build        # production build
pnpm typecheck    # tsc --noEmit (no test suite exists)
pnpm lint         # eslint
pnpm seed         # import business Excel into Supabase (requires .env.local)
pnpm seed -- --dry     # parse only, no DB writes
pnpm seed -- --reset   # delete existing products first, then import
pnpm seed -- --file "path.xlsx"
pnpm db:types     # regenerate src/types/database.types.ts from linked Supabase project
```

No test suite. Type-checking is the primary static verification tool.

## Architecture

**Feature-based modular structure.** Each feature under `src/features/<name>/` has:
- `api.ts` — client-side Supabase queries (used by TanStack Query hooks)
- `hooks.ts` — TanStack Query hooks wrapping the api
- `actions.ts` — Next.js Server Actions for all mutations (validated with Zod schemas in `schemas.ts`)
- `components/` — UI components scoped to the feature

**Data flow:**
- **Reads:** `api.ts` → `hooks.ts` → component. TanStack Query handles caching and Realtime revalidation.
- **Writes:** Server Actions → Supabase RPC (for complex operations) or direct table mutations. Always call `revalidatePath()` after mutations.
- **Ephemeral UI state:** Zustand (`src/stores/`). The POS cart (`cart-store.ts`) is persisted to localStorage.

**Backend: Supabase as the source of truth.**
- All tables have RLS enabled. Security is enforced at two levels: middleware (`src/lib/supabase/middleware.ts`) for route protection, and RLS + `SECURITY DEFINER` functions for data.
- Complex mutations use atomic PostgreSQL RPC functions to avoid partial writes. Never split an atomic operation across multiple Supabase calls from the app layer.

## Key RPCs (supabase/migrations/0005 & 0009)

| RPC | Who | What |
|-----|-----|-------|
| `create_sale(p_items, p_payment_method, p_discount, p_note)` | any user | Inserts sale + items, decrements stock, writes kardex, registers cash movement — all atomic |
| `cancel_sale(p_sale_id uuid)` | admin | Marks sale cancelled, restores stock (+kardex `'in'`), inserts reversal `'expense'` cash movement — all atomic |
| `adjust_stock(p_product_id, p_new_stock, p_reason)` | admin | Updates stock + kardex entry |
| `bulk_update_products(p_items jsonb)` | admin | Mass update price/stock/name from Excel reimport, writes kardex |
| `open_cash_register` / `close_cash_register` / `add_cash_movement` | admin | Cash session lifecycle |
| `dashboard_metrics`, `sales_daily_series`, `top_products`, `top_sellers` | any | Read-only aggregations |

## RBAC

Two roles: `admin` and `seller`. Checked via helpers in `src/lib/rbac/permissions.ts` and SQL helpers (`is_admin()`, `is_active_user()`, `current_branch_id()`).

- `requireAdmin()` / `requireUser()` in `src/lib/auth/session.ts` — use these at the top of every Server Action.
- Sellers can create sales and view their own sales. Admins get full access.

## Database schema highlights

- `products.code` is **not unique** (the business catalog has collisions). Never assume uniqueness on code.
- `sales.status` ∈ `('completed', 'cancelled')`. The cancel flow must restore stock atomically via RPC.
- `stock_movements` is the kardex — every stock change must produce a row here with `previous_stock` / `new_stock`.
- `cash_movements.type` ∈ `('income', 'expense', 'sale')`. Sales create a `'sale'` movement; cancellations must reverse it.
- All tables have `branch_id` for future multi-branch support.

## Excel import/export

- **Export** (`src/features/products/export.ts`): generates `productos_YYYY-MM-DD.xlsx` with an `ID` column (UUID).
- **Reimport via UI** (`src/features/import/`): products with an `ID` column → update via `bulk_update_products`; products without ID → insert as new. Always use the exported file (not the original business Excel) for updates.
- **Seed script** (`scripts/import-excel.ts`): reads the original business Excel (no IDs). Use `--reset` flag if reimporting to avoid duplicates.

## Supabase clients

- `src/lib/supabase/client.ts` — browser client (for hooks/api)
- `src/lib/supabase/server.ts` — server client for Server Actions and RSC
- `src/lib/supabase/admin.ts` — service role client (bypasses RLS; only for admin scripts)

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY          # server-only (seed script, user creation)
NEXT_PUBLIC_DEFAULT_BRANCH_ID      # optional, defaults to seed UUID
```
