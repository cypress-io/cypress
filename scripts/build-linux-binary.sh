#!/bin/bash

echo "This script should be run from monorepo's root"

name=cypress/internal:chrome58
echo "Pulling CI container $name"

docker pull $name

echo "Starting Docker image with monorepo volume attached"
echo "In order to build Cypress Linux binary"
echo Command npm run binary-build -- "$@"

# for now just run shell in the Docker container
# and then the user can go through the deploy
docker run \
  -e npm_config_loglevel='warn' \
  -v $PWD:/home/person/cypress-monorepo \
  -w /home/person/cypress-monorepo \
  -it $name \
  npm run binary-build -- "$@"

# /bin/bash
# todo: grab / compute the version to build

