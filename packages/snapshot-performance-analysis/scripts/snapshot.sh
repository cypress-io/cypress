#!/usr/bin/env bash

set -o pipefail;
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

ROOT=$DIR/../../..
ELECTRON=$ROOT/node_modules/.bin/electron
APP=$ROOT/packages/snapshot-performance-analysis/app/index.js

export RUN='react'
export USE_SNAPSHOT=1
export RUN_AGAINST_EXPERIMENT_DIRECTORY=1
export PROJECT_BASE_DIR=`pwd`

function run {
  CLEAR_DATA=1 $ELECTRON $APP
  for i in {1..8}; do $ELECTRON $APP; done
  DUMP_RESULTS=1 $ELECTRON $APP
}

# Vanilla
export ASSET_TYPE='vanilla'
rm -rf $ROOT/packages/snapshot-performance-analysis/cache/*
node $ROOT/packages/snapshot/scripts/setup-dev
run

## Bundle minified
# export ASSET_TYPE='bundle_minify'
# rm -rf $ROOT/packages/snapshot-performance-analysis/cache/*
# node $ROOT/packages/snapshot/lib/install-snapshot.js
# run
