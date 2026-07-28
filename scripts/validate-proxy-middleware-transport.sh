#!/usr/bin/env bash
set -euo pipefail

# Validate proxy middleware behavior across browser HTTP transports.
#
# Usage:
#   scripts/validate-proxy-middleware-transport.sh [mitm|cdp|both]
#
# Modes:
#   mitm  - default MITM proxy path
#   cdp   - CDP Fetch path with CYPRESS_INTERNAL_DISABLE_PROXY=1
#   both  - run mitm, then cdp
#
# Prerequisites:
#   - Install dependencies with `yarn --ignore-scripts` for a fast worktree setup.
#   - If committing after using --ignore-scripts, run `npx husky install`.
#   - Driver e2e tests need compiled packages. If they fail with MODULE_NOT_FOUND,
#     run the focused build below, or run the full `yarn build`.
#       yarn lerna run build --scope @packages/proxy --scope @packages/network-interception --scope @packages/net-stubbing --scope @packages/server --scope @packages/driver
#   - Chrome must be available unless BROWSER is set to another installed browser.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="${1:-both}"
BROWSER="${BROWSER:-chrome}"

run_unit_suite() {
  yarn workspace @packages/proxy test -- \
    test/unit/http/index.spec.ts \
    test/unit/adapters/http-codec.spec.ts \
    test/integration/net-stubbing.spec.ts \
    test/unit/http/request-middleware.spec.ts \
    test/unit/http/util/prerequests.spec.ts \
    test/unit/adapters/proxy-request-interception.spec.ts \
    test/unit/adapters/proxy-response-interception.spec.ts

  yarn workspace @packages/proxy test -- \
    test/unit/http/response-middleware.spec.ts -t "experimentalCspAllowList"

  yarn workspace @packages/network-interception test -- \
    test/unit/http-intercept.spec.ts

  yarn workspace @packages/net-stubbing test -- \
    test/unit/adapters/driver-intercept-registration.spec.ts
}

run_driver_suite() {
  local specs="cypress/e2e/e2e/encoding.cy.ts,cypress/e2e/e2e/csp_headers.cy.js,cypress/e2e/cypress/proxy-logging.cy.ts,cypress/e2e/cypress/downloads.cy.ts,cypress/e2e/issues/3890.cy.js,cypress/e2e/cy/snapshot.cy.js"

  yarn workspace @packages/driver cypress:run -- \
    --browser "$BROWSER" --headless --spec "$specs"
}

run_mode() {
  local transport="$1"

  echo "=== proxy middleware smoke ($transport) ==="

  if [[ "$transport" == "cdp" ]]; then
    export CYPRESS_INTERNAL_DISABLE_PROXY=1
  else
    unset CYPRESS_INTERNAL_DISABLE_PROXY
  fi

  # Unit tests validate the onion composition and proxy middleware wiring.
  run_unit_suite

  # Driver e2e tests exercise the selected middleware through a real browser.
  run_driver_suite
}

case "$MODE" in
  mitm)
    run_mode mitm
    ;;
  cdp)
    run_mode cdp
    ;;
  both)
    run_mode mitm
    run_mode cdp
    ;;
  *)
    echo "Usage: $0 [mitm|cdp|both]"
    exit 1
    ;;
esac

echo "proxy middleware transport validation passed ($MODE)"
