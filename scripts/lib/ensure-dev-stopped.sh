#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-3000}"

if lsof -ti "tcp:${PORT}" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Stop dev first: port ${PORT} is in use."
  exit 1
fi
