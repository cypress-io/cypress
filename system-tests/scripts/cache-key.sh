#!/bin/bash

# NOTE: do not wrap this script with `yarn run`, `npm run`, etc., they add their own stdout

# cd to this "scripts" directory
cd "$(dirname "${BASH_SOURCE[0]}")"

# Sort files as globbing can vary based on architecture. LC_ALL required for locale-agnostic sort
file_list=$(ls ../projects/**/{package.json,yarn.lock})

contents=''
for t in ${file_list[@]}; do
  contents+=$(<$t)
done

# md5=$contents | md5sum

echo $contents