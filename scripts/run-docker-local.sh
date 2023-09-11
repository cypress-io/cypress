#!/bin/bash
set e+x

echo "This script should be run from cypress's root"

name=cypress/browsers-internal:node18.15.0-chrome114-ff115
echo "Pulling CI container $name"

docker pull $name

echo "Starting Docker image with cypress volume attached"
echo "You should be able to edit files locally"
echo "but execute the code in the container"

docker run -v $PWD:/home/person/cypress \
  -w /home/person/cypress${WORKING_DIR:-} \
  -it $name \
  /bin/bash
