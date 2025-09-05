#!/bin/sh
set -e

# Optional: Replace placeholders in static files with env vars if needed
# For now, we just exec nginx
exec "$@"
