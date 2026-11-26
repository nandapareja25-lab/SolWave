#!/usr/bin/env bash
# Pruebas SQL en un PostgreSQL local desechable (sin Docker). Uso: bash scripts/test-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
BIN=${PG_BIN:-/usr/lib/postgresql/16/bin}
DIR=${PG_DIR:-/tmp/pgdorata}
PORT=${PG_PORT:-54329}
RUN_AS=""; [ "$(id -u)" = "0" ] && RUN_AS="su postgres -c"
pg() { if [ -n "$RUN_AS" ]; then $RUN_AS "$*"; else bash -c "$*"; fi; }
if ! "$BIN/pg_isready" -h "$DIR" -p "$PORT" >/dev/null 2>&1; then
  if [ ! -d "$DIR/data" ]; then
    rm -rf "$DIR" && mkdir -p "$DIR" && { [ -z "$RUN_AS" ] || chown postgres "$DIR"; }
    pg "$BIN/initdb -D $DIR/data -A trust >/dev/null"
  fi
  rm -f "$DIR/.s.PGSQL.$PORT" "$DIR/.s.PGSQL.$PORT.lock" "$DIR/data/postmaster.pid"
  pg "$BIN/pg_ctl -D $DIR/data -o '-p $PORT -k $DIR' -l $DIR/log -w start >/dev/null"
fi
P="psql -h $DIR -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"
$P -d postgres -c "drop database if exists dorata" -c "create database dorata" >/dev/null
$P -d dorata -f supabase/tests/local-stubs.sql >/dev/null
for f in supabase/migrations/*.sql supabase/seed.sql; do $P -d dorata -f "$f" >/dev/null; done
total=0
for t in supabase/tests/*_test.sql; do
  out=$($P -d dorata -f "$t" 2>&1) || { echo "$out" | tail -5; echo "FALLÓ: $t"; exit 1; }
  n=$(echo "$out" | grep -c "NOTICE:  OK" || true); total=$((total + n))
  echo "$out" | grep "NOTICE:  OK" | sed 's/.*NOTICE:  /  /'
done
echo "Pruebas SQL OK: $total"
