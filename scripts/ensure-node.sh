#!/bin/bash
# `source ./scripts/ensure-node.sh` to ensure you are running the correct Node version for this repo

node_version=$(cat .node-version)

# some environments (like Arm on CircleCI) bring their own nvm
if type nvm &>/dev/null; then
  echo 'nvm found with cache dir' `nvm cache dir`
else
  if [ -s "${HOME}/.nvm/nvm.sh" ]; then
    echo 'nvm found in home, sourcing...'
  else
    echo "nvm not found. Installing nvm..."
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.39.1/install.sh | bash
  fi

  source "${HOME}/.nvm/nvm.sh"
fi
echo "Installing Node $node_version"
nvm install ${node_version}
echo "Using Node $node_version"
nvm use ${node_version}
[[ $PLATFORM != 'windows' ]] && nvm alias default ${node_version} || sleep 2s
