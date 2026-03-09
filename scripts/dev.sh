#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# MAIN dev port
PORT=${PORT:-3000}

npm run dev -- -p "$PORT"
