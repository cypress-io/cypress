#!/usr/bin/env bash
# Test building better-sqlite3 inside the the provided Docker image (same steps as CI).
# Run from repo root after `yarn` so node_modules/better-sqlite3 exists.
#
# Usage:
#   ./scripts/test-better-sqlite3-build.sh <docker-image>
# Example:
#   ./scripts/test-better-sqlite3-build.sh cypress/base-internal:24.14.0-glibc-2.31

set -e

if [[ -z "${1:-}" ]]; then
  echo "usage: $0 <docker-image>" >&2
  echo "  Test building better-sqlite3 inside the image (same steps as CI)." >&2
  exit 1
fi

IMAGE="$1"
CYPRESS_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTAINER_NAME="better-sqlite3-test-$$"

cd "$CYPRESS_ROOT"

if [[ ! -d node_modules/better-sqlite3 ]]; then
  echo "error: node_modules/better-sqlite3 not found. Run 'yarn' from repo root first."
  exit 1
fi

echo "Using image: $IMAGE"
echo "Starting container $CONTAINER_NAME ..."
docker run -d --name "$CONTAINER_NAME" "$IMAGE" /bin/bash -c "sleep 1000000000"

cleanup() {
  docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
}
trap cleanup EXIT

echo "Copying better-sqlite3 into container ..."
docker cp "$CYPRESS_ROOT/node_modules/better-sqlite3" "$CONTAINER_NAME:/better-sqlite3"

echo "Building better_sqlite3.node ..."
docker exec "$CONTAINER_NAME" /bin/bash -c "cd /better-sqlite3 && source /root/.bashrc && chown -R root:root . && npm install --ignore-scripts && npx --no-install prebuild -r electron -t 41.0.3 --include-regex 'better_sqlite3.node$'"

BUILT_NODE_PATH='/better-sqlite3/build/Release/better_sqlite3.node'

if docker exec "$CONTAINER_NAME" test -f "$BUILT_NODE_PATH"; then
  echo "SUCCESS: better_sqlite3.node successfully built"
else
  echo "FAIL: better_sqlite3.node was not produced."
  exit 1
fi
