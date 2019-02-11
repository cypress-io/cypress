#!/usr/bin/env node

const shell = require('shelljs')

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

// we include the TypeScript definitions for the bundled 3rd party tools
// thus we need to copy them from "dev" dependencies into our types folder
shell.cp('-R', 'node_modules/@types/blob-util', 'types')
shell.cp('-R', 'node_modules/@types/bluebird', 'types')
shell.cp('-R', 'node_modules/@types/lodash', 'types')
shell.cp('-R', 'node_modules/@types/mocha', 'types')
shell.cp('-R', 'node_modules/@types/minimatch', 'types')
shell.cp('-R', 'node_modules/@types/sinon', 'types')
shell.cp('-R', 'node_modules/@types/sinon-chai', 'types')
shell.cp('-R', 'node_modules/@types/chai', 'types')
shell.cp('-R', 'node_modules/@types/chai-jquery', 'types')
shell.cp('-R', 'node_modules/@types/jquery', 'types')

// for these folders, having duplicate folders presents a problem
// so we need to remove `index.d.ts` files :(
// Could not find a better way to avoid conflicts during dtslint check
try {
  shell.rm('node_modules/@types/jquery/index.d.ts')
} catch (e) {
  // do nothing on error
}
try {
  shell.rm('node_modules/@types/chai/index.d.ts')
} catch (e) {
  // do nothing on error
}
