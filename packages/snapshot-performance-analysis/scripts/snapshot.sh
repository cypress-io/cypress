#!/usr/bin/env bash

set -o pipefail;
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# Vanilla
export ASSET_TYPE='vanilla'
export RUN_AGAINST_EXPERIMENT_DIRECTORY=1
ROOT=$DIR/../../..

rm -rf $ROOT/packages/snapshot-performance-analysis/cache/*
node $ROOT/packages/snapshot/scripts/setup-prod

SLOW_EXECUTION=1 $DIR/snapshot-base.sh 8

HEALTHY=1 $DIR/snapshot-base.sh 8

DEFERRED=1 $DIR/snapshot-base.sh 8

PROFILE=1 SLOW_EXECUTION=1 $DIR/snapshot-base.sh 1

PROFILE=1 HEALTHY=1 $DIR/snapshot-base.sh 1

PROFILE=1 DEFERRED=1 $DIR/snapshot-base.sh 1

export SNAPSHOT_DEV=1

node $ROOT/packages/snapshot/scripts/setup-dev

SLOW_EXECUTION=1 $DIR/snapshot-base.sh 8

HEALTHY=1 $DIR/snapshot-base.sh 8

DEFERRED=1 $DIR/snapshot-base.sh 8

PROFILE=1 SLOW_EXECUTION=1 $DIR/snapshot-base.sh 1

PROFILE=1 HEALTHY=1 $DIR/snapshot-base.sh 1

PROFILE=1 DEFERRED=1 $DIR/snapshot-base.sh 1
