#!/bin/bash

# some environments (like Arm on CircleCI) bring their own nvm
if type nvm &>/dev/null; then
  echo 'nvm found, not doing anything in load-nvm.sh.'
  exit 0
fi

if [ -s "${HOME}/.nvm/nvm.sh" ]; then
  echo 'nvm found in home, sourcing...'
else
  echo "nvm not found. Installing nvm..."
  curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.39.1/install.sh | bash
fi

source "${HOME}/.nvm/nvm.sh"
