#!/bin/bash

set -e

# `yarn install --frozen-lockfile` only validates that top-level dependency
# patterns are present, not the whole transitive closure. A yarn.lock missing a
# nested entry therefore installs cleanly in CI while every unfrozen install
# silently re-adds it, and until then that package is resolved live from the
# registry with no locked version or integrity hash. Only a real resolution pass
# detects it.

before="$(mktemp)"
trap 'rm -f "$before"' EXIT

cp yarn.lock "$before"

yarn install --ignore-scripts

# yarn rewrites yarn.lock on every install and reports "Saved lockfile" even
# when nothing changed, so compare contents rather than trusting the output.
if diff -u "$before" yarn.lock; then
  exit 0
fi

cat >&2 <<'EOF'

yarn.lock does not match what `yarn install` resolves (diff above).

An entry is missing, stale, or was hand-edited — commonly from bumping a version
in package.json and editing yarn.lock to match instead of installing. Affected
packages resolve from the registry on every install with no locked integrity
hash, and `--frozen-lockfile` does not catch it.

Run `yarn install` and commit the resulting yarn.lock.
EOF

exit 1
