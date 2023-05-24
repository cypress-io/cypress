#!/bin/bash
IMAGE=${1:-ci}

set e+x

echo "This script should be run from cypress's root"

docker compose build ${IMAGE}

echo "Starting Docker image with cypress volume attached"
echo "You should be able to edit files locally"
echo "but execute the code in the container"

docker compose run --service-ports ${IMAGE}
