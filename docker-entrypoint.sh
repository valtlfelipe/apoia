#!/bin/sh
set -e

DB_DIR="$(dirname "${DATABASE_PATH:-/data/apoia.db}")"

# A mounted volume replaces the ownership the image gave this directory. Named
# Docker volumes inherit it from the image, so this used to be invisible — but
# a bind mount (what Railway, Fly and most platforms actually attach) arrives
# owned by root, and the unprivileged `apoia` user then can't create the SQLite
# file: "SqliteError: unable to open database file", SQLITE_CANTOPEN, on every
# boot.
#
# So the container starts as root, fixes the mounted directory, and immediately
# drops back to `apoia` for the migrations and the server itself — root exists
# only for the length of this chown. `exec` keeps the re-run as PID 1 so signals
# still reach the app.
#
# Running with an explicit `--user` skips all of this: you've opted out, and
# making the directory writable is then yours to handle.
if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DB_DIR"
  chown -R apoia:apoia "$DB_DIR"
  exec setpriv --reuid=apoia --regid=apoia --init-groups "$0" "$@"
fi

echo "Running database migrations..."
node migrate.cjs

echo "Starting apoia..."
exec "$@"
