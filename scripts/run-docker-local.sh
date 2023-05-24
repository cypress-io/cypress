#!/bin/bash
set e+x

echo "This script should be run from cypress's root"

docker compose build ci

echo "Starting Docker image with cypress volume attached"
echo "You should be able to edit files locally"
echo "but execute the code in the container"

docker compose run ci
