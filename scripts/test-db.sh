#!/usr/bin/env bash
# يشغّل الهجرات واختبارات الخصوصية على Postgres مؤقت.
# في CI: يستخدم DATABASE_URL لو موجود. محليًا: ينشئ قاعدة مؤقتة.
set -euo pipefail
cd "$(dirname "$0")/.."

run() {
  local url="$1"
  psql "$url" -v ON_ERROR_STOP=1 -q -f tests/db/00_supabase_stub.sql
  psql "$url" -v ON_ERROR_STOP=1 -q -f supabase/migrations/20261114000001_schema.sql
  psql "$url" -v ON_ERROR_STOP=1 -f tests/db/10_privacy.test.sql 2>&1 | grep -E 'تمام|فشل|ERROR|نجحت|error' 
  test "${PIPESTATUS[0]}" -eq 0
}

if [ -n "${DATABASE_URL:-}" ]; then
  run "$DATABASE_URL"
  exit 0
fi

PGBIN=$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)
DIR=$(mktemp -d)
chown postgres "$DIR" 2>/dev/null || true
as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -c "$*"; else bash -c "$*"; fi; }
as_pg "$PGBIN/initdb -D $DIR/data -U postgres --auth=trust -E UTF8 --locale=C.UTF-8" >/dev/null
as_pg "$PGBIN/pg_ctl -D $DIR/data -o '-p 54329 -k $DIR' -l $DIR/log -w start" >/dev/null
trap 'as_pg "$PGBIN/pg_ctl -D $DIR/data -m fast stop" >/dev/null; rm -rf "$DIR"' EXIT
run "postgresql://postgres@localhost:54329/postgres?host=$DIR"
