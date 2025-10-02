#!/bin/bash

# Script to sync cloud validations for the server package
# This ensures we have up-to-date TypeScript definitions for API operations

set -e

INTERNAL_CLOUD_ENV=${CYPRESS_INTERNAL_ENV:-production}

case $INTERNAL_CLOUD_ENV in
  test) VALIDATION_BASE="https://api.cypress.io" ;;
  production) VALIDATION_BASE="https://api.cypress.io" ;;
  staging) VALIDATION_BASE="https://api-staging.cypress.io" ;;
  development) VALIDATION_BASE="http://localhost:1234" ;;
  *) VALIDATION_BASE="https://api.cypress.io" ;;
esac

# Output to packages/server/lib/validations
OUTPUT_FOLDER="$(dirname "$0")/../lib/validations"
JS_FILE="$OUTPUT_FOLDER/cloudValidations.js"
DTS_FILE="$OUTPUT_FOLDER/cloudValidations.d.ts"


sync_cloud_validations() {
  echo "Syncing cloud validations from $VALIDATION_BASE..."
  
  # Create output directory if it doesn't exist
  mkdir -p "$OUTPUT_FOLDER"
  
  # Download validations with headers
  echo "Downloading validations..."
  curl -s -D /tmp/validations_headers "$VALIDATION_BASE/cypress-app/validations" > "$JS_FILE"
  
  echo "Downloading types..."
  curl -s -D /tmp/types_headers "$VALIDATION_BASE/cypress-app/validations/types" > "$DTS_FILE"
  
  # Extract ETag headers
  VALIDATIONS_ETAG=$(grep -i "etag:" /tmp/validations_headers | cut -d' ' -f2 | tr -d '\r\n')
  TYPES_ETAG=$(grep -i "etag:" /tmp/types_headers | cut -d' ' -f2 | tr -d '\r\n')
  
  # Add ETag as comment to the files
  {
    echo "// ETag: $VALIDATIONS_ETAG"
    echo "// Last-Synced: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo ""
    cat "$JS_FILE"
  } > "$JS_FILE.tmp" && mv "$JS_FILE.tmp" "$JS_FILE"
  
  {
    echo "// ETag: $TYPES_ETAG"
    echo "// Last-Synced: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo ""
    cat "$DTS_FILE"
  } > "$DTS_FILE.tmp" && mv "$DTS_FILE.tmp" "$DTS_FILE"
  
  # Clean up temp files
  rm -f /tmp/validations_headers /tmp/types_headers
  
  echo "✅ Cloud validations synced successfully"
}

ensure_cloud_validations() {
  if [[ ! -f "$JS_FILE" || ! -f "$DTS_FILE" ]]; then
    echo "Cloud validation files missing, syncing..."
    if ! sync_cloud_validations; then
      echo "❌ Failed to sync cloud validations. Build may fail without these files."
      exit 1
    fi
    return
  fi
  
  # Extract stored ETags from the files
  STORED_JS_ETAG=$(head -n 1 "$JS_FILE" | sed 's|// ETag: ||' | tr -d '\r\n')
  STORED_DTS_ETAG=$(head -n 1 "$DTS_FILE" | sed 's|// ETag: ||' | tr -d '\r\n')
  
  echo "Checking if cloud validations are up to date..."
  
  # Get current ETags without downloading the full content
  # If we can't fetch ETags (offline), just use existing files
  CURRENT_JS_ETAG=$(curl -s -I "$VALIDATION_BASE/cypress-app/validations" 2>/dev/null | grep -i "etag:" | cut -d' ' -f2 | tr -d '\r\n')
  CURRENT_DTS_ETAG=$(curl -s -I "$VALIDATION_BASE/cypress-app/validations/types" 2>/dev/null | grep -i "etag:" | cut -d' ' -f2 | tr -d '\r\n')
  
  # If we couldn't fetch ETags (offline), use existing files
  if [[ -z "$CURRENT_JS_ETAG" || -z "$CURRENT_DTS_ETAG" ]]; then
    echo "⚠️  Could not check ETags (offline?), using existing files"
    return
  fi
  
  # Compare ETags
  if [[ "$STORED_JS_ETAG" != "$CURRENT_JS_ETAG" || "$STORED_DTS_ETAG" != "$CURRENT_DTS_ETAG" ]]; then
    echo "Cloud validation files are outdated (ETags changed), syncing..."
    if ! sync_cloud_validations; then
      echo "⚠️  Failed to sync, but existing files will be used"
    fi
  else
    echo "✅ Cloud validation files are up to date (ETags match)"
  fi
}

# Run the appropriate function based on command line arguments
case "${1:-}" in
  sync)
    sync_cloud_validations
    ;;
  *)
    ensure_cloud_validations
    ;;
esac
