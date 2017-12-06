set e+x

echo "This script should be run from monorepo's root"

name=cypress/browsers:chrome62
echo "Pulling CI container $name"

docker pull $name

echo "Starting Docker image with monorepo volume attached"
echo "You should be able to edit files locally"
echo "but execute the code in the container"

docker run -v $PWD:/home/person/cypress-monorepo \
  -w /home/person/cypress-monorepo \
  -it $name \
  /bin/bash
