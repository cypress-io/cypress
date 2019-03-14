#!/usr/bin/env node

const { includeTypes } = require('./utils')
const shell = require('shelljs')
const { join } = require('path')

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

// We include the TypeScript definitions for the bundled 3rd party tools
// thus we need to copy them from "dev" dependencies into our types folder
// and we need to sometimes tweak these types files to use relative paths
// This ensures that globals like Cypress.$, Cypress._ etc are property typed
// yet we do not install "@types/.." packages with "npm install cypress"
// because they can conflict with user's own libraries

includeTypes.forEach((folder) => {
  const source = join('node_modules', '@types', folder)

  shell.cp('-R', source, 'types')
})

// fix paths to Chai, jQuery and other types to be relative
shell.sed(
  '-i',
  '<reference types="chai" />',
  '<reference path="../chai/index.d.ts" />',
  join('types', 'chai-jquery', 'index.d.ts')
)
shell.sed(
  '-i',
  '<reference types="jquery" />',
  '<reference path="../jquery/index.d.ts" />',
  join('types', 'chai-jquery', 'index.d.ts')
)
shell.sed(
  '-i',
  '<reference types="chai" />',
  '<reference path="../chai/index.d.ts" />',
  join('types', 'sinon-chai', 'index.d.ts')
)
shell.sed(
  '-i',
  '<reference types="sinon" />',
  '<reference types="../sinon" />',
  join('types', 'sinon-chai', 'index.d.ts')
)
// also use relative import for sinon-chai
shell.sed(
  '-i',
  'from \'sinon\';',
  'from \'../sinon\';',
  join('types', 'sinon-chai', 'index.d.ts')
)
