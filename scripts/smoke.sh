#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

ENDPOINTS=(
  "/"
  "/projects"
  "/tasks"
  "/kanban"
  "/calendar"
  "/api/projects"
  "/api/tasks"
  "/api/risks"
)

FAILED=0

for endpoint in "${ENDPOINTS[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${endpoint}" || true)
  if [[ "${STATUS}" == "200" ]]; then
    echo "OK   ${endpoint}"
  else
    echo "FAIL ${endpoint} (${STATUS})"
    FAILED=1
  fi
done

if [[ "${FAILED}" -eq 0 ]]; then
  echo "OK"
  exit 0
fi

echo "FAIL"
exit 1
