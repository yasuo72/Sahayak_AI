#!/bin/sh
set -eu

if [ -n "${DATABASE_URL:-}" ]; then
  export DATABASE_URL
elif [ -n "${POSTGRES_URL:-}" ]; then
  export DATABASE_URL="$POSTGRES_URL"
elif [ -n "${POSTGRES_PRISMA_URL:-}" ]; then
  export DATABASE_URL="$POSTGRES_PRISMA_URL"
elif [ -n "${PRIVATE_DATABASE_URL:-}" ]; then
  export DATABASE_URL="$PRIVATE_DATABASE_URL"
elif [ -n "${RAILWAY_DATABASE_URL:-}" ]; then
  export DATABASE_URL="$RAILWAY_DATABASE_URL"
elif [ -n "${PGHOST:-}" ] && [ -n "${PGUSER:-}" ] && [ -n "${PGPASSWORD:-}" ] && [ -n "${PGDATABASE:-}" ]; then
  PGPORT="${PGPORT:-5432}"
  export DATABASE_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}?schema=public"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set. Link PostgreSQL to this service or add DATABASE_URL in Railway variables." >&2
  exit 1
fi

echo "Applying database schema..."
exec npx prisma db push --accept-data-loss
