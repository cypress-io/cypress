set e+x

echo "This script should be run from cypress's root"

name=cypress/browsers:chrome64
echo "Pulling CI container $name"

docker pull $name

echo "Starting Docker image with cypress volume attached"
echo "You should be able to edit files locally"
echo "but execute the code in the container"

docker run -v $PWD:/home/person/cypress \
  -w /home/person/cypress \
  -it $name \
  /bin/bash
