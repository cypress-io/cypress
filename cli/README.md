# Cypress CLI source

This folder is used to build Cypress NPM module.

## Building

See `scripts/build.js`. Note that the built NPM package will include [NPM_README.md](NPM_README.md) as its public README file.

## Testing

To build and test an NPM package:

- `npm install`
- `npm run build`

This creates `build` folder.

- `cd build; npm pack`

This creates an archive, usually named `cypress-<version>.tgz`. You can install this archive from other projects, but because there is no corresponding binary yet (probably), skip binary download. For example from inside `cypress-example-kitchensink` folder

```shell
npm i ~/git/cypress/cli/build/cypress-3.1.5.tgz --ignore-scripts
```

Which installs the `tgz` file we have just built from folder `~/git/cypress/cli/build`.

## Local development

See [index.js](index.js) for local commands. For example to install local zip file and print debug logs, you could do

```shell
DEBUG=cypress:cli CYPRESS_INSTALL_BINARY=/tmp/tt/cyp.zip \
  node ./index.js --exec install --force
```
