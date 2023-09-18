#!/bin/bash
SERVICE=${1:-ci}

set e+x

echo "This script should be run from cypress's root"

docker compose build ${SERVICE}

echo "Starting Docker compose service, $SERVICE, with cypress volume attached"
echo "You should be able to edit files locally"
echo "but execute the code in the container"

docker compose run --service-ports ${SERVICE}
