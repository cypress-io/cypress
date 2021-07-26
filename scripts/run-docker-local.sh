#!/bin/bash
set e+x

echo "This script should be run from cypress's root"

name=cypress/browsers:node14.16.0-chrome90-ff88
echo "Pulling CI container $name"

docker pull $name

echo "Starting Docker image with cypress volume attached"
echo "You should be able to edit files locally"
echo "but execute the code in the container"

docker run -v $PWD:/home/person/cypress \
  --user 12345 \
  -w /home/person/cypress${WORKING_DIR:-} \
  -it $name \
  /bin/bash
