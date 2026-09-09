#!/usr/bin/env bash
set -u
D="$(cd "$(dirname "$0")" && pwd)"
BASE='https://apex.lankdev.my.id'
curl -s "$BASE/login" -o "$D/live2.html"
grep -hoE '/_next/static/chunks/[^"]+\.js' "$D/live2.html" | sort -u | while read -r f; do
  curl -s "$BASE$f" | grep -hoE 'sb_publishable_[A-Za-z0-9_-]+|https://[a-z0-9]{20}\.supabase\.co'
done | sort -u | tee "$D/bundle_env.txt"
PUB=$(grep -oE 'sb_publishable_[A-Za-z0-9_-]+' "$D/bundle_env.txt" | head -1)
echo "--- auth probe (expect 400 invalid credentials):"
curl -s -o "$D/authres2.json" -w '%{http_code}\n' -X POST 'https://okbryysoxihmamujoipb.supabase.co/auth/v1/token?grant_type=password' \
  -H "apikey: $PUB" -H 'Content-Type: application/json' \
  -d '{"email":"probe@example.com","password":"wrong"}'
head -c 250 "$D/authres2.json"; echo
echo "--- page codes:"
for p in '' pricing register login; do
  printf '/%s -> %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/$p")"
done
echo "--- tenant slug gate:"
curl -s -i "$BASE/somecompany/shifts" | grep -iE '^HTTP|^location' | head -2
