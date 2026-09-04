#!/bin/sh
set -e

DB_DIR="$(dirname "${DATABASE_PATH:-/data/apoia.db}")"

# A mounted volume replaces the ownership the image gave this directory. Named
# Docker volumes inherit it from the image, so this stays invisible locally —
# but a bind mount (what Railway, Fly and most platforms actually attach)
# arrives owned by root, and the unprivileged `apoia` user then can't create
# the SQLite file: "SqliteError: unable to open database file",
# SQLITE_CANTOPEN, on every boot.
#
# Ownership of a volume isn't knowable at build time, so it has to be fixed at
# mount time, which needs root. The container therefore starts as root, fixes
# the directory, and immediately drops back to `apoia` for the migrations and
# the server — root exists only for the length of that fix, and nothing of ours
# ever serves a request as root. This is the same shape as the official
# postgres and redis entrypoints (redis drops with setpriv exactly like this).
#
# `find ... \! -user` rather than `chown -R`: a boot with an already-correct
# volume then costs a stat walk instead of rewriting ownership on every file.
#
# Running with an explicit `--user` skips all of this — you've opted out, and
# making the directory writable is then yours to handle.
if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DB_DIR"
  find "$DB_DIR" \! -user apoia -exec chown apoia:apoia '{}' +
  exec setpriv --reuid=apoia --regid=apoia --clear-groups "$0" "$@"
fi

echo "Running database migrations..."
node migrate.cjs

echo "Starting apoia..."
exec "$@"
