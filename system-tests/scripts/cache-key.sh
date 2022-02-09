#!/bin/bash

# NOTE: do not wrap this script with `yarn run`, `npm run`, etc., they add their own stdout

# cd to this "scripts" directory
cd "$(dirname "${BASH_SOURCE[0]}")"

cat ../projects/**/{package.json,yarn.lock}