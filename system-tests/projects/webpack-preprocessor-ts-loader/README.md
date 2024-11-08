# Updating lock file

If updating the `yarn.lock` on a `yarn` install, make sure to set `CYPRESS_INSTALL_BINARY=0` as Cypress will try to pull a binary that does not exist.