#!/usr/bin/env node

// @ts-check
/* eslint-disable no-console */

const { includeTypes } = require('./utils')
const shell = require('shelljs')
const { join } = require('path')
const resolvePkg = require('resolve-pkg')

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

// We include the TypeScript definitions for the bundled 3rd party tools
// thus we need to copy them from "dev" dependencies into our types folder
// and we need to sometimes tweak these types files to use relative paths
// This ensures that globals like Cypress.$, Cypress._ etc are property typed
// yet we do not install "@types/.." packages with "npm install cypress"
// because they can conflict with user's own libraries

includeTypes.forEach((folder) => {
  const source = resolvePkg(`@types/${folder}`, { cwd: join(__dirname, '..', '..') })

  shell.cp('-R', source, 'types')
})

// jQuery v3.3.x includes "dist" folder that just references back to itself
// causing dtslint to think there are double definitions. Remove that folder.
const typesJqueryDistFolder = join('types', 'jquery', 'dist')

shell.rm('-rf', typesJqueryDistFolder)

/**
 * Replaces "reference types=<name>" comment with "reference path=..." line.
 * @param {string} typeName - like "chai" or "jquery"
 * @param {string} relativeTypesFilePath - relative path to .d.ts file like "../chai/index.d.ts"
 * @param {string} filename - the source file to change
 */
function makeReferenceTypesCommentRelative (typeName, relativeTypesFilePath, filename) {
  console.log('in file %s changing reference for types %s to relative path %s',
    filename, typeName, relativeTypesFilePath)

  const referenceTypes = `<reference types="${typeName}" />`
  const relativeTypes = `<reference path="${relativeTypesFilePath}" />`

  shell.sed(
    '-i',
    referenceTypes,
    relativeTypes,
    filename,
  )
}

// fix paths to Chai, jQuery and other types to be relative
makeReferenceTypesCommentRelative('chai', '../chai/index.d.ts',
  join('types', 'chai-jquery', 'index.d.ts'))

makeReferenceTypesCommentRelative('jquery', '../jquery/index.d.ts',
  join('types', 'chai-jquery', 'index.d.ts'))

const sinonChaiFilename = join('types', 'sinon-chai', 'index.d.ts')

makeReferenceTypesCommentRelative('chai', '../chai/index.d.ts', sinonChaiFilename)

// also use relative import via path for sinon-chai
// there is reference comment line we need to fix to be relative
makeReferenceTypesCommentRelative('sinon', '../sinon/index.d.ts', sinonChaiFilename)

// and an import sinon line to be changed to relative path
shell.sed('-i', 'from \'sinon\';', 'from \'../sinon\';', sinonChaiFilename)

// copy experimental network stubbing type definitions
// so users can import: `import 'cypress/types/net-stubbing'`
shell.cp(resolvePkg('@packages/net-stubbing/lib/external-types.ts'), 'types/net-stubbing.ts')
