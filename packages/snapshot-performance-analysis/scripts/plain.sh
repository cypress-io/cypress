#!/usr/bin/env bash

set -o pipefail;
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

SLOW_EXECUTION=1 $DIR/runner-base.sh 8

HEALTHY=1 $DIR/runner-base.sh 8

DEFERRED=1 $DIR/runner-base.sh 8

PROFILE=1 SLOW_EXECUTION=1 $DIR/runner-base.sh 1

PROFILE=1 HEALTHY=1 $DIR/runner-base.sh 1

PROFILE=1 DEFERRED=1 $DIR/runner-base.sh 1
