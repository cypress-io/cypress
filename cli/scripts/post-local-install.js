#!/usr/bin/env node

/**
 * The post-local-install.js script is run after your *local* yarn install.
 * It is not run by the user.
 *
 * This script is responsible for:
 * 1. re-exporting the types of dependencies shipped by the binary
 */

// @ts-check
/* eslint-disable no-console */
const fs = require('fs-extra')
const globby = require('globby')
const path = require('path')
const { includeTypes } = require('./utils')
const shell = require('shelljs')
const { join } = require('path')
const resolvePkg = require('resolve-pkg')

require('./clean')

shell.set('-v') // verbose
shell.set('-e') // any error is fatal

fs.ensureDirSync(join(__dirname, '..', 'types'))

includeTypes.forEach((folder) => {
  const source = resolvePkg(`@types/${folder}`, { cwd: join(__dirname, '..', '..') })

  fs.copySync(source, join(__dirname, '..', 'types', folder))
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
fs.copySync(resolvePkg('@packages/net-stubbing/lib/external-types.ts'), 'types/net-stubbing.ts')

// https://github.com/cypress-io/cypress/issues/18069
// To avoid type clashes, some files should be commented out entirely by patch-package
// and uncommented here.

const filesToUncomment = [
  'mocha/index.d.ts',
  'jquery/JQuery.d.ts',
  'jquery/legacy.d.ts',
  'jquery/misc.d.ts',
]

filesToUncomment.forEach((file) => {
  const filePath = join(__dirname, '../types', file)
  const str = fs.readFileSync(filePath).toString()

  const result = str.split('\n').map((line) => {
    return line.startsWith('//z ') ? line.substring(4) : line
  }).join('\n')

  fs.writeFileSync(filePath, result)
})

const npmPkg = [
  'react',
  'vue',
  'mount-utils',
]

const externalPkg = {
  vue: [
    '@vue/test-utils',
  ],
}

npmPkg.forEach((pkg) => {
  fs.removeSync(join(__dirname, `../${pkg}`))
  const pluginDir = path.dirname(require.resolve(`@cypress/${pkg}/package.json`))
  const toCopy = globby.sync(['*.d.ts', '**/*.d.ts'], {
    cwd: path.join(pluginDir, 'dist'),
  })

  for (const file of toCopy) {
    const outputFileName = join(__dirname, '..', pkg, file)

    fs.copySync(
      path.join(pluginDir, 'dist', file),
      outputFileName,
    )

    shell.sed('-i', 'from \'@cypress/mount-utils\';', 'from \'../mount-utils\';', outputFileName)

    if (externalPkg[pkg]) {
      for (const external of externalPkg[pkg]) {
        shell.sed('-i', `from '${external}';`, `from './${external}';`, outputFileName)
      }
    }
  }

  if (externalPkg[pkg]) {
    for (const external of externalPkg[pkg]) {
      const externalPluginDir = path.dirname(require.resolve(require.resolve(`${external}/package.json`), {
        paths: [path.dirname(require.resolve(`@cypress/${pkg}/package.json`))],
      }))
      const toCopyExternal = globby.sync(['*.d.ts', '**/*.d.ts'], {
        cwd: path.join(externalPluginDir, 'dist'),
      })

      for (const file of toCopyExternal) {
        const outputFileName = join(__dirname, '..', pkg, external, file)

        fs.copySync(
          path.join(externalPluginDir, 'dist', file),
          outputFileName,
        )
      }
    }
  }
})
