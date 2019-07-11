#!/bin/bash

echo "This script should be run from monorepo's root"

name=cypress/internal:chrome61
echo "Pulling CI container $name"

docker pull $name

echo "Starting Docker image with monorepo volume attached"
echo "In order to build Cypress Linux binary"
echo Command npm run binary-deploy -- "$@"

docker run \
  -e npm_config_loglevel='warn' \
  -v $PWD:/home/person/cypress \
  -w /home/person/cypress \
  -it $name \
  npm run binary-deploy -- "$@"
