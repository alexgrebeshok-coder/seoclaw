#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

./scripts/lib/ensure-dev-stopped.sh 3000

npm run lint
npm run build
