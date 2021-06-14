#!/bin/bash

# If we're in CI, exit early
if [[ $CI ]]; then exit 0; fi
# otherwise, run the supplied command
"${@:1}"
