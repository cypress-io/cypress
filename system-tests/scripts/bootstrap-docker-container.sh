#!/bin/bash
set -e # exit on error

echo "$0 running as $(whoami)"
echo "Node version: $(node -v)"

if [ ! -d "$TEST_PROJECT_DIR" ]; then
  echo "Missing TEST_PROJECT_DIR=$TEST_PROJECT_DIR. Check Docker Bind+Env config"
  exit 1
fi

if [ ! -d "$REPO_DIR" ]; then
  echo "Missing REPO_DIR=$REPO_DIR. Check Docker Bind+Env config"
  exit 1
fi

ZIP_PATH=$REPO_DIR/cypress.zip
TARBALL_PATH=$REPO_DIR/cypress.tgz
CLI_PATH=$REPO_DIR/cli/build

if [ ! -f "$ZIP_PATH" ]; then
  echo "Missing $ZIP_PATH. Check Docker Bind config"
  exit 1
fi

if [ ! -d "$CLI_PATH" ]; then
  echo "Missing $CLI_PATH. Check Docker Bind config"
  exit 1
fi

set -x # log commands

cd $TEST_PROJECT_DIR

export CYPRESS_INSTALL_BINARY=$ZIP_PATH
export CYPRESS_CACHE_FOLDER=/tmp/CYPRESS_CACHE_FOLDER/

if [ "$USE_YARN_TO_INSTALL_CYPRESS_BINARY" = true ]; then
  # if using yarn to install the built cypress binary, we can just install the tarball that is in the monorepo root directory
  yarn add cypress@file:$TARBALL_PATH
else
  export npm_config_cache=/tmp/npm_config_cache/
  export npm_config_package_lock=false

  mkdir $npm_config_cache
  chown -R 1000:1000 $npm_config_cache

  npx npm@8 install --unsafe-perm --allow-root --force file:$CLI_PATH

  PATH=$PATH:./node_modules/.bin

  cypress install
fi

# run command passed in argv and store exit code
set +e
$@
EXIT_CODE=$?
set -e

# delete tmp to avoid permissions issues on the host
cd -
rm -rf $TEST_PROJECT_DIR

exit $EXIT_CODE
