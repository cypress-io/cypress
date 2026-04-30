#!/usr/bin/env bash
# Generates a JSON object of CircleCI pipeline parameters based on changed files.
# Used in launch-primary-workflow to enable path-based job filtering on PRs.
#
# Output: JSON written to stdout, consumed by continuation/continue pipeline_parameters.
#
# All run-* params default to true so that develop/release branches and
# API-triggered pipelines run everything without needing to pass explicit params.

set -euo pipefail

driver_tests=false
server_tests=false
app_ui_tests=false
launchpad_tests=false
reporter_tests=false
frontend_shared_tests=false
system_tests=false
v8_tests=false
cli_tests=false
unit_tests=false
npm_webpack_dev_server_tests=false
npm_vite_dev_server_tests=false
npm_webpack_preprocessor_tests=false
npm_webpack_batteries_tests=false
npm_vue_tests=false
npm_react_tests=false
npm_angular_tests=false
npm_puppeteer_tests=false
npm_vite_plugin_esm_tests=false
npm_mount_utils_tests=false
npm_grep_tests=false
npm_eslint_plugin_tests=false
npm_schematic_tests=false

emit_json() {
  cat <<EOF
{"run-driver-tests": $driver_tests, "run-server-tests": $server_tests, "run-app-ui-tests": $app_ui_tests, "run-launchpad-tests": $launchpad_tests, "run-reporter-tests": $reporter_tests, "run-frontend-shared-tests": $frontend_shared_tests, "run-system-tests": $system_tests, "run-v8-tests": $v8_tests, "run-cli-tests": $cli_tests, "run-unit-tests": $unit_tests, "run-npm-webpack-dev-server-tests": $npm_webpack_dev_server_tests, "run-npm-vite-dev-server-tests": $npm_vite_dev_server_tests, "run-npm-webpack-preprocessor-tests": $npm_webpack_preprocessor_tests, "run-npm-webpack-batteries-tests": $npm_webpack_batteries_tests, "run-npm-vue-tests": $npm_vue_tests, "run-npm-react-tests": $npm_react_tests, "run-npm-angular-tests": $npm_angular_tests, "run-npm-puppeteer-tests": $npm_puppeteer_tests, "run-npm-vite-plugin-esm-tests": $npm_vite_plugin_esm_tests, "run-npm-mount-utils-tests": $npm_mount_utils_tests, "run-npm-grep-tests": $npm_grep_tests, "run-npm-eslint-plugin-tests": $npm_eslint_plugin_tests, "run-npm-schematic-tests": $npm_schematic_tests}
EOF
}

emit_all_true() {
  driver_tests=true
  server_tests=true
  app_ui_tests=true
  launchpad_tests=true
  reporter_tests=true
  frontend_shared_tests=true
  system_tests=true
  v8_tests=true
  cli_tests=true
  unit_tests=true
  npm_webpack_dev_server_tests=true
  npm_vite_dev_server_tests=true
  npm_webpack_preprocessor_tests=true
  npm_webpack_batteries_tests=true
  npm_vue_tests=true
  npm_react_tests=true
  npm_angular_tests=true
  npm_puppeteer_tests=true
  npm_vite_plugin_esm_tests=true
  npm_mount_utils_tests=true
  npm_grep_tests=true
  npm_eslint_plugin_tests=true
  npm_schematic_tests=true
  emit_json
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

# ----- manual trigger override -----------------------------------------------
# When run-all-jobs=true is set in the "Trigger Pipeline" UI, skip path filtering.
RUN_ALL_RAW="${RUN_ALL_JOBS:-false}"
if [[ "$RUN_ALL_RAW" == "true" || "$RUN_ALL_RAW" == "1" ]]; then
  echo "run-all-jobs=true — running all jobs" >&2
  emit_all_true
  exit 0
fi

# ----- compute changed files --------------------------------------------------
# Fetch develop from the upstream project repo using CIRCLE_PROJECT_USERNAME/REPONAME,
# which CircleCI always sets to the canonical upstream (cypress-io/cypress), not the
# contributor's fork. This ensures fork PRs compare against the real develop branch.
UPSTREAM_URL="https://github.com/${CIRCLE_PROJECT_USERNAME:-cypress-io}/${CIRCLE_PROJECT_REPONAME:-cypress}.git"
MERGE_BASE=""
if git fetch "$UPSTREAM_URL" develop 2>/dev/null; then
  MERGE_BASE=$(git merge-base HEAD FETCH_HEAD 2>/dev/null || echo "")
else
  echo "Could not fetch upstream develop" >&2
fi

if [[ -n "$MERGE_BASE" ]]; then
  CHANGED=$(git -c core.quotepath=false diff --name-only "$MERGE_BASE" HEAD)
else
  echo "Could not find merge base with upstream develop, falling back to HEAD~1" >&2
  CHANGED=$(git -c core.quotepath=false diff --name-only HEAD~1 HEAD 2>/dev/null || echo "")
fi

if [[ -z "$CHANGED" ]]; then
  echo "Error: no changed files detected" >&2
  exit 1
fi

echo "Changed files:" >&2
echo "$CHANGED" >&2

# ----- global triggers --------------------------------------------------------
# Any change to these paths means every job must run.
while IFS= read -r file; do
  case "$file" in
    .circleci/*|yarn.lock|package.json|packages/types/*|packages/config/*|\
    packages/errors/*|packages/socket/*|packages/network/*|packages/ts/*|scripts/*|\
    patches/*|packages/root/*|vitest.config.ts|gulpfile.js)
      echo "Global trigger matched: '$file' — running all tests" >&2
      emit_all_true
      exit 0
      ;;
  esac
done <<< "$CHANGED"

# ----- targeted path mapping --------------------------------------------------
while IFS= read -r file; do
  case "$file" in
    # Documentation, assets, and repo-metadata — must be first so that e.g.
    # packages/driver/README.md doesn't match packages/driver/* below
    *.md|*.mdx|*.txt|*.png|*.jpg|*.gif|*.svg|*.ico|\
    LICENSE|.github/*|.gitignore|.gitattributes|.editorconfig|\
    guides/*|assets/*|\
    .eslintrc.js|.prettierignore|.nvmrc|.node-version|.npmrc|.yarnclean|\
    .percy.yml|.releaserc.js|renovate.json|docker-compose.yml|lerna.json|\
    electron-builder.json|knip.json|nx.json|jsconfig.json|autobarrel.json|\
    mocha-reporter-config.json|apollo.config.js|\
    .husky/*|.vscode/*|__snapshots__/*)
      ;;
    packages/driver/*)
      driver_tests=true
      system_tests=true
      ;;
    packages/server/*)
      server_tests=true
      system_tests=true
      ;;
    packages/proxy/*)
      server_tests=true
      system_tests=true
      ;;
    packages/net-stubbing/*)
      server_tests=true
      driver_tests=true
      system_tests=true
      ;;
    packages/rewriter/*)
      server_tests=true
      system_tests=true
      ;;
    packages/https-proxy/*)
      server_tests=true
      system_tests=true
      ;;
    packages/app/*)
      app_ui_tests=true
      system_tests=true
      ;;
    packages/launchpad/*)
      launchpad_tests=true
      system_tests=true
      ;;
    packages/reporter/*)
      reporter_tests=true
      app_ui_tests=true
      system_tests=true
      ;;
    packages/frontend-shared/*)
      frontend_shared_tests=true
      app_ui_tests=true
      launchpad_tests=true
      reporter_tests=true
      system_tests=true
      ;;
    packages/data-context/*)
      app_ui_tests=true
      launchpad_tests=true
      server_tests=true
      system_tests=true
      ;;
    packages/runner/*)
      driver_tests=true
      app_ui_tests=true
      system_tests=true
      ;;
    packages/web-config/*)
      driver_tests=true
      app_ui_tests=true
      system_tests=true
      ;;
    packages/electron/*)
      driver_tests=true
      system_tests=true
      ;;
    packages/extension/*)
      # Extension is a browser WebExtension; driver tests only need to run in Firefox.
      # TODO: introduce a run-firefox-driver-tests parameter to avoid running all browser variants.
      driver_tests=true
      system_tests=true
      ;;
    packages/launcher/*)
      system_tests=true
      ;;
    packages/scaffold-config/*)
      launchpad_tests=true
      system_tests=true
      ;;
    packages/resolve-dist/*)
      app_ui_tests=true
      launchpad_tests=true
      ;;
    packages/telemetry/*)
      driver_tests=true
      server_tests=true
      app_ui_tests=true
      system_tests=true
      ;;
    packages/network-tools/*)
      driver_tests=true
      server_tests=true
      system_tests=true
      ;;
    packages/packherd-require/*)
      v8_tests=true
      ;;
    packages/v8-snapshot-require/*)
      v8_tests=true
      ;;
    packages/stderr-filtering/*)
      server_tests=true
      app_ui_tests=true
      launchpad_tests=true
      system_tests=true
      ;;
    packages/icons/*)
      driver_tests=true
      server_tests=true
      app_ui_tests=true
      system_tests=true
      ;;
    cli/*)
      cli_tests=true
      unit_tests=true
      ;;
    system-tests/*)
      system_tests=true
      ;;
    tooling/*)
      v8_tests=true
      ;;
    npm/webpack-dev-server/*)
      npm_webpack_dev_server_tests=true
      system_tests=true
      ;;
    npm/vite-dev-server/*)
      npm_vite_dev_server_tests=true
      system_tests=true
      ;;
    npm/webpack-preprocessor/*)
      npm_webpack_preprocessor_tests=true
      system_tests=true
      ;;
    npm/webpack-batteries-included-preprocessor/*)
      npm_webpack_batteries_tests=true
      system_tests=true
      ;;
    npm/vue/*)
      npm_vue_tests=true
      system_tests=true
      ;;
    npm/react/*)
      npm_react_tests=true
      system_tests=true
      ;;
    npm/angular/*)
      npm_angular_tests=true
      system_tests=true
      ;;
    npm/angular-zoneless/*)
      npm_angular_tests=true
      system_tests=true
      ;;
    npm/svelte/*)
      system_tests=true
      ;;
    npm/puppeteer/*)
      npm_puppeteer_tests=true
      system_tests=true
      ;;
    npm/vite-plugin-cypress-esm/*)
      npm_vite_plugin_esm_tests=true
      system_tests=true
      ;;
    npm/mount-utils/*)
      npm_mount_utils_tests=true
      system_tests=true
      ;;
    npm/grep/*)
      npm_grep_tests=true
      system_tests=true
      ;;
    npm/eslint-plugin-dev/*)
      npm_eslint_plugin_tests=true
      system_tests=true
      ;;
    npm/cypress-schematic/*)
      npm_schematic_tests=true
      system_tests=true
      ;;
    packages/eslint-config/*|packages/example/*|npm/xpath/*)
      # No CI jobs are associated with these packages — no tests to run
      ;;
    *)
      # Unrecognized path — fail loudly so the mapping is kept up to date.
      # Add the new path to one of the cases above rather than silently skipping tests.
      echo "Error: unrecognized path '$file' has no mapping in generate-pipeline-parameters.sh" >&2
      echo "Add it to the targeted path mapping section before merging." >&2
      exit 1
      ;;
  esac
done <<< "$CHANGED"

# ----- emit result ------------------------------------------------------------
echo "Emitting pipeline parameters" >&2
emit_json
