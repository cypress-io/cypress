#!/bin/bash

# NOTE: do not wrap this script with `yarn run`, `npm run`, etc., they add their own stdout

# cd to this "scripts" directory
cd "$(dirname "${BASH_SOURCE[0]}")"

file_list=$(ls ../projects/**/{package.json,yarn.lock} | sort -f)

contents=''
for t in ${file_list[@]}; do
  contents+=$(<$t)
done

# md5=$contents | md5

# echo $md5

echo $contents