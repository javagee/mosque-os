#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo ""
echo "==> Imara · Local DB Setup"
echo ""

# ── 1. supabase init ──────────────────────────────────────────────────────────
if [ ! -d "$ROOT/supabase" ]; then
  echo "[1/6] Initialising Supabase project..."
  supabase init
else
  echo "[1/6] Supabase project already initialised — skipping."
fi

# ── 2. Copy schema into migrations ───────────────────────────────────────────
MIGRATION="$ROOT/supabase/migrations/20241021000000_init.sql"
if [ ! -f "$MIGRATION" ]; then
  echo "[2/6] Copying schema to migrations..."
  mkdir -p "$ROOT/supabase/migrations"
  cp "$ROOT/lib/supabase-schema.sql" "$MIGRATION"
else
  echo "[2/6] Migration file already exists — skipping."
fi

# ── 3. Start local Supabase stack ────────────────────────────────────────────
echo "[3/6] Starting local Supabase stack (this may take a minute on first run)..."
supabase start

# ── 4. Parse keys from supabase status ───────────────────────────────────────
echo "[4/6] Reading local credentials..."
STATUS=$(supabase status)

LOCAL_URL=$(echo "$STATUS"    | grep "API URL"          | awk '{print $NF}')
ANON_KEY=$(echo "$STATUS"     | grep "anon key"         | awk '{print $NF}')
SERVICE_KEY=$(echo "$STATUS"  | grep "service_role key" | awk '{print $NF}')

if [ -z "$LOCAL_URL" ] || [ -z "$ANON_KEY" ] || [ -z "$SERVICE_KEY" ]; then
  echo ""
  echo "ERROR: Could not parse Supabase credentials. Run 'supabase status' and set these in .env.local manually:"
  echo "  NEXT_PUBLIC_SUPABASE_URL"
  echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY"
  echo "  SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

# ── 5. Update .env.local ──────────────────────────────────────────────────────
echo "[5/6] Updating .env.local with local credentials..."
ENV_FILE="$ROOT/.env.local"

update_or_append() {
  local key="$1"
  local val="$2"
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    # replace existing line
    sed -i '' "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
  else
    echo "${key}=${val}" >> "$ENV_FILE"
  fi
}

update_or_append "NEXT_PUBLIC_SUPABASE_URL"    "$LOCAL_URL"
update_or_append "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$ANON_KEY"
update_or_append "SUPABASE_SERVICE_ROLE_KEY"   "$SERVICE_KEY"

echo "    URL:          $LOCAL_URL"
echo "    Anon key:     ${ANON_KEY:0:20}..."
echo "    Service key:  ${SERVICE_KEY:0:20}..."

# ── 6. Apply migrations & seed ───────────────────────────────────────────────
echo "[6/6] Applying schema and seeding test campaign..."
supabase db reset --no-backup

supabase db execute --file - <<'SQL'
insert into campaigns (name, description, merchant_name, coupon_price, currency, total_coupons, redemption_start, redemption_end, terms, active)
values (
  'Arnold''s Meal Coupon',
  'Support the mosque by purchasing a meal coupon redeemable at Arnold''s restaurant.',
  'Arnold''s',
  1800,
  'sgd',
  100,
  now(),
  now() + interval '90 days',
  ARRAY[
    'Valid for one meal at Arnold''s',
    'Cannot be combined with other offers',
    'No cash value'
  ],
  true
)
on conflict do nothing;
SQL

echo ""
echo "✓ Done! Local DB is ready."
echo ""
echo "  Supabase Studio → http://127.0.0.1:54323"
echo "  API             → $LOCAL_URL"
echo ""
echo "Now run:  npm run dev"
echo "Then visit: http://localhost:3000/campaigns"
echo ""
