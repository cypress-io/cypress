# loads previously installed NVM
# USE:
# - run:
#     name: check Node version
#     command: |
#       . ./scripts/load-nvm.sh
#       yarn check-node-version

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export NODE_VERSION=$(cat .node-version)
