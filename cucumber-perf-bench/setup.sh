#!/usr/bin/env bash
set -euo pipefail

# Reproducible setup for the cucumber-preprocessor performance benchmark.
# Clones + builds the open-source preprocessor at the package root, symlinks it
# so generated projects can resolve it, and installs the bundlers under test.

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

REPO="https://github.com/badeball/cypress-cucumber-preprocessor.git"
REF="${PREPROCESSOR_REF:-master}"

if [ ! -d preprocessor-src ]; then
  echo "==> Cloning preprocessor ($REF)"
  git clone --depth 1 --branch "$REF" "$REPO" preprocessor-src
fi

echo "==> Building preprocessor"
( cd preprocessor-src && npm install --no-audit --no-fund && npm run build )

echo "==> Installing bundlers (esbuild, webpack)"
npm install --no-audit --no-fund

echo "==> Symlinking preprocessor into node_modules"
mkdir -p node_modules/@badeball
ln -sfn "$HERE/preprocessor-src" node_modules/@badeball/cypress-cucumber-preprocessor

# Optional: build a patched copy for the before/after comparison (compare.js).
if [ "${1:-}" = "--patched" ]; then
  echo "==> Preparing patched build"
  if [ ! -d preprocessor-patched ]; then
    cp -r preprocessor-src preprocessor-patched
    ( cd preprocessor-patched && git apply "$HERE/preprocessor-perf.patch" )
  fi
  ( cd preprocessor-patched && npm run build )
  echo "==> Patched build ready. Run: node compare.js"
fi

echo "==> Done. Run: npm run bench"
