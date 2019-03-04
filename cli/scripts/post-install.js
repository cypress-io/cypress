#!/usr/bin/env node

const { includeTypes } = require('./utils')
const shell = require('shelljs')
const { join } = require('path')

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

// we include the TypeScript definitions for the bundled 3rd party tools
// thus we need to copy them from "dev" dependencies into our types folder
includeTypes.forEach(folder => {
  const source = join('node_modules', '@types', folder)

  shell.cp('-R', source, 'types')
})

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

// fix paths to Chai, jQuery to be relative
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
