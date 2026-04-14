#!/usr/bin/env bash
# Generates a JSON object of CircleCI pipeline parameters based on changed files.
# Used in launch-primary-workflow to enable path-based job filtering on PRs.
#
# Output: JSON written to stdout, consumed by continuation/continue pipeline_parameters.
#
# All run-* params default to true so that develop/release branches and
# API-triggered pipelines run everything without needing to pass explicit params.

set -euo pipefail

# Use individual variables instead of associative arrays (bash 3.x compatible)
p_run_driver_tests=false
p_run_server_tests=false
p_run_app_ui_tests=false
p_run_launchpad_tests=false
p_run_reporter_tests=false
p_run_frontend_shared_tests=false
p_run_system_tests=false
p_run_v8_tests=false
p_run_cli_tests=false
p_run_unit_tests=false
p_run_npm_webpack_dev_server_tests=false
p_run_npm_vite_dev_server_tests=false
p_run_npm_webpack_preprocessor_tests=false
p_run_npm_webpack_batteries_tests=false
p_run_npm_vue_tests=false
p_run_npm_react_tests=false
p_run_npm_angular_tests=false
p_run_npm_puppeteer_tests=false
p_run_npm_vite_plugin_esm_tests=false
p_run_npm_mount_utils_tests=false
p_run_npm_grep_tests=false
p_run_npm_eslint_plugin_tests=false
p_run_npm_schematic_tests=false

emit_json() {
  local pb="${PUBLISH_BINARY_BRANCH:-main}"
  local fpa="${FORCE_PERSIST_ARTIFACTS:-false}"
  cat <<EOF
{"publish-binary-branch": "$pb", "force-persist-artifacts": $fpa, "run-driver-tests": $p_run_driver_tests, "run-server-tests": $p_run_server_tests, "run-app-ui-tests": $p_run_app_ui_tests, "run-launchpad-tests": $p_run_launchpad_tests, "run-reporter-tests": $p_run_reporter_tests, "run-frontend-shared-tests": $p_run_frontend_shared_tests, "run-system-tests": $p_run_system_tests, "run-v8-tests": $p_run_v8_tests, "run-cli-tests": $p_run_cli_tests, "run-unit-tests": $p_run_unit_tests, "run-npm-webpack-dev-server-tests": $p_run_npm_webpack_dev_server_tests, "run-npm-vite-dev-server-tests": $p_run_npm_vite_dev_server_tests, "run-npm-webpack-preprocessor-tests": $p_run_npm_webpack_preprocessor_tests, "run-npm-webpack-batteries-tests": $p_run_npm_webpack_batteries_tests, "run-npm-vue-tests": $p_run_npm_vue_tests, "run-npm-react-tests": $p_run_npm_react_tests, "run-npm-angular-tests": $p_run_npm_angular_tests, "run-npm-puppeteer-tests": $p_run_npm_puppeteer_tests, "run-npm-vite-plugin-esm-tests": $p_run_npm_vite_plugin_esm_tests, "run-npm-mount-utils-tests": $p_run_npm_mount_utils_tests, "run-npm-grep-tests": $p_run_npm_grep_tests, "run-npm-eslint-plugin-tests": $p_run_npm_eslint_plugin_tests, "run-npm-schematic-tests": $p_run_npm_schematic_tests}
EOF
}

emit_all_true() {
  local pb="${PUBLISH_BINARY_BRANCH:-main}"
  local fpa="${FORCE_PERSIST_ARTIFACTS:-false}"
  cat <<EOF
{"publish-binary-branch": "$pb", "force-persist-artifacts": $fpa, "run-driver-tests": true, "run-server-tests": true, "run-app-ui-tests": true, "run-launchpad-tests": true, "run-reporter-tests": true, "run-frontend-shared-tests": true, "run-system-tests": true, "run-v8-tests": true, "run-cli-tests": true, "run-unit-tests": true, "run-npm-webpack-dev-server-tests": true, "run-npm-vite-dev-server-tests": true, "run-npm-webpack-preprocessor-tests": true, "run-npm-webpack-batteries-tests": true, "run-npm-vue-tests": true, "run-npm-react-tests": true, "run-npm-angular-tests": true, "run-npm-puppeteer-tests": true, "run-npm-vite-plugin-esm-tests": true, "run-npm-mount-utils-tests": true, "run-npm-grep-tests": true, "run-npm-eslint-plugin-tests": true, "run-npm-schematic-tests": true}
EOF
}

# ----- branch override --------------------------------------------------------
# On develop/release branches all jobs must run.
BRANCH="${CIRCLE_BRANCH:-}"
if [[ "$BRANCH" == "develop" ]] || \
   [[ "$BRANCH" =~ ^release/ ]] || \
   [[ "$BRANCH" == "update-v8-snapshot-cache-on-develop" ]]; then
  echo "Branch '$BRANCH' — running all tests" >&2
  emit_all_true
  exit 0
fi

# ----- compute changed files --------------------------------------------------
git fetch origin develop --depth=1 2>/dev/null || true
MERGE_BASE=$(git merge-base HEAD origin/develop 2>/dev/null || echo "")

if [[ -n "$MERGE_BASE" ]]; then
  CHANGED=$(git diff --name-only "$MERGE_BASE" HEAD)
else
  echo "Could not find merge base with origin/develop, falling back to HEAD~1" >&2
  CHANGED=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "")
fi

if [[ -z "$CHANGED" ]]; then
  echo "No changed files detected — running all tests as a safety fallback" >&2
  emit_all_true
  exit 0
fi

echo "Changed files:" >&2
echo "$CHANGED" >&2

# ----- global triggers --------------------------------------------------------
# Any change to these paths means every job must run.
while IFS= read -r file; do
  case "$file" in
    .circleci/*|yarn.lock|package.json|packages/types/*|packages/config/*|\
    packages/errors/*|packages/socket/*|packages/network/*|packages/ts/*|scripts/*)
      echo "Global trigger matched: '$file' — running all tests" >&2
      emit_all_true
      exit 0
      ;;
  esac
done <<< "$CHANGED"

# ----- targeted path mapping --------------------------------------------------
while IFS= read -r file; do
  case "$file" in
    # Documentation and repo-metadata — must be first so that e.g.
    # packages/driver/README.md doesn't match packages/driver/* below
    *.md|*.mdx|*.txt|LICENSE|.github/*|.gitignore|.gitattributes|.editorconfig)
      ;;
    packages/driver/*)
      p_run_driver_tests=true
      ;;
    packages/server/*)
      p_run_server_tests=true
      p_run_system_tests=true
      ;;
    packages/proxy/*)
      p_run_server_tests=true
      p_run_system_tests=true
      ;;
    packages/net-stubbing/*)
      p_run_server_tests=true
      p_run_driver_tests=true
      p_run_system_tests=true
      ;;
    packages/rewriter/*)
      p_run_server_tests=true
      p_run_system_tests=true
      ;;
    packages/https-proxy/*)
      p_run_server_tests=true
      ;;
    packages/app/*)
      p_run_app_ui_tests=true
      p_run_system_tests=true
      ;;
    packages/launchpad/*)
      p_run_launchpad_tests=true
      p_run_system_tests=true
      ;;
    packages/reporter/*)
      p_run_reporter_tests=true
      p_run_app_ui_tests=true
      ;;
    packages/frontend-shared/*)
      p_run_frontend_shared_tests=true
      p_run_app_ui_tests=true
      p_run_launchpad_tests=true
      p_run_reporter_tests=true
      ;;
    packages/data-context/*)
      p_run_app_ui_tests=true
      p_run_launchpad_tests=true
      p_run_server_tests=true
      p_run_system_tests=true
      ;;
    packages/runner/*)
      p_run_driver_tests=true
      p_run_app_ui_tests=true
      ;;
    packages/web-config/*)
      p_run_driver_tests=true
      p_run_app_ui_tests=true
      ;;
    packages/electron/*)
      p_run_driver_tests=true
      p_run_system_tests=true
      ;;
    packages/extension/*)
      p_run_driver_tests=true
      ;;
    packages/launcher/*)
      p_run_system_tests=true
      ;;
    packages/scaffold-config/*)
      p_run_launchpad_tests=true
      p_run_system_tests=true
      ;;
    packages/resolve-dist/*)
      p_run_app_ui_tests=true
      p_run_launchpad_tests=true
      ;;
    packages/telemetry/*)
      # Used by driver, server, app, data-context, net-stubbing, proxy
      p_run_driver_tests=true
      p_run_server_tests=true
      p_run_app_ui_tests=true
      p_run_system_tests=true
      ;;
    packages/network-tools/*)
      # Used by driver, proxy, server (and transitively by packages/network which is a global trigger)
      p_run_driver_tests=true
      p_run_server_tests=true
      p_run_system_tests=true
      ;;
    packages/packherd-require/*)
      # Consumed by v8-snapshot-require; tested via v8 integration tests
      p_run_v8_tests=true
      ;;
    packages/v8-snapshot-require/*)
      p_run_v8_tests=true
      ;;
    packages/stderr-filtering/*)
      # Used by data-context, electron, server
      p_run_server_tests=true
      p_run_app_ui_tests=true
      p_run_launchpad_tests=true
      p_run_system_tests=true
      ;;
    packages/icons/*)
      # Used by electron, extension, runner, server
      p_run_driver_tests=true
      p_run_server_tests=true
      p_run_app_ui_tests=true
      p_run_system_tests=true
      ;;
    cli/*)
      p_run_cli_tests=true
      p_run_unit_tests=true
      ;;
    system-tests/*)
      p_run_system_tests=true
      ;;
    tooling/*)
      p_run_v8_tests=true
      ;;
    npm/webpack-dev-server/*)
      p_run_npm_webpack_dev_server_tests=true
      ;;
    npm/vite-dev-server/*)
      p_run_npm_vite_dev_server_tests=true
      ;;
    npm/webpack-preprocessor/*)
      p_run_npm_webpack_preprocessor_tests=true
      ;;
    npm/webpack-batteries-included-preprocessor/*)
      p_run_npm_webpack_batteries_tests=true
      ;;
    npm/vue/*)
      p_run_npm_vue_tests=true
      ;;
    npm/react/*)
      p_run_npm_react_tests=true
      ;;
    npm/angular/*)
      p_run_npm_angular_tests=true
      ;;
    npm/angular-zoneless/*)
      p_run_npm_angular_tests=true
      ;;
    npm/svelte/*)
      p_run_system_tests=true
      ;;
    npm/puppeteer/*)
      p_run_npm_puppeteer_tests=true
      ;;
    npm/vite-plugin-cypress-esm/*)
      p_run_npm_vite_plugin_esm_tests=true
      ;;
    npm/mount-utils/*)
      p_run_npm_mount_utils_tests=true
      ;;
    npm/grep/*)
      p_run_npm_grep_tests=true
      ;;
    npm/eslint-plugin-dev/*)
      p_run_npm_eslint_plugin_tests=true
      ;;
    npm/cypress-schematic/*)
      p_run_npm_schematic_tests=true
      ;;
    packages/eslint-config/*|packages/example/*|npm/xpath/*)
      # No CI jobs are associated with these packages — no tests to run
      ;;
    *)
      # Unrecognized path — run everything rather than risk missing coverage
      echo "Unrecognized path '$file' — running all tests" >&2
      emit_all_true
      exit 0
      ;;
  esac
done <<< "$CHANGED"

# ----- emit result ------------------------------------------------------------
echo "Emitting pipeline parameters" >&2
emit_json
