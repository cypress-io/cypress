#!/bin/bash

# NOTE: do not wrap this script with `yarn run`, `npm run`, etc., they add their own stdout

# cd to this "scripts" directory
cd "$(dirname "${BASH_SOURCE[0]}")"

# Sort glob output, as it can vary based on architecture. LC_ALL=C required for locale-agnostic sort.
file_list=$(ls ../projects/**/{package.json,yarn.lock} | LC_ALL=C sort -f)
 
contents=''
for t in ${file_list[@]}; do
  contents+=$(<$t)
done
 
echo $contents
