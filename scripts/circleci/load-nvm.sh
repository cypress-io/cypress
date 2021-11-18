# loads previously installed NVM
# USE:
# - run:
#     name: check Node version
#     command: |
#       . ./scripts/load-nvm.sh
#       yarn check-node-version

export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
     \. "$NVM_DIR/nvm.sh"
else 
    echo "Installing NVM"
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.30.0/install.sh | bash
fi

export NODE_VERSION=$(cat .node-version)