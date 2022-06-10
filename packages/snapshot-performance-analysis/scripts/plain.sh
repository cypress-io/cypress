#!/usr/bin/env bash

set -o pipefail;
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

$DIR/runner.sh
