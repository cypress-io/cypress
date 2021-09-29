import _ from 'lodash'
import R from 'ramda'
import la from 'lazy-ass'
import path from 'path'
import check from 'check-more-types'
import Debug from 'debug'
import minimatch from 'minimatch'
import Bluebird from 'bluebird'
import pluralize from 'pluralize'
import glob from './glob'
import Table from 'cli-table3'
import type { CommonSearchOptions, FindSpecs } from '@packages/types'

const debug = Debug('cypress:server:specs')

const MINIMATCH_OPTIONS = { dot: true, matchBase: true }

/**
 * Enums to help keep track of what types of spec files we find.
 * By default, every spec file is assumed to be integration.
*/
const SPEC_TYPES = {
  INTEGRATION: 'integration',
  COMPONENT: 'component',
} as const

const getPatternRelativeToProjectRoot = (specPattern: string, projectRoot: string) => {
  return _.map(specPattern, (p) => {
    return path.relative(projectRoot, p)
  })
}

/**
 * Finds all spec files that pass the config for given type. Note that "commonSearchOptions" is
 * a subset of the project's "config" object
 */
function findSpecsOfType (searchFolder: string, commonSearchOptions: CommonSearchOptions, specPattern?: string) {
  let fixturesFolderPath: string | undefined = undefined

  // @ts-ignore - types are incorrect
  la(check.maybe.strings(specPattern), 'invalid spec pattern', specPattern)

  la(check.unemptyString(searchFolder), 'expected spec folder path in', commonSearchOptions)

  debug(
    'looking for test specs in the folder:',
    searchFolder,
  )

  if (specPattern) {
    debug('spec pattern "%s"', specPattern)
  } else {
    debug('there is no spec pattern')
  }

  // support files are not automatically
  // ignored because only _fixtures are hard
  // coded. the rest is simply whatever is in
  // the javascripts array

  if (typeof commonSearchOptions.fixturesFolder === 'string' && commonSearchOptions.fixturesFolder !== '') {
    // users should be allowed to set the fixtures folder
    // the same as the specs folder
    if (commonSearchOptions.fixturesFolder !== searchFolder) {
      fixturesFolderPath = path.join(
        commonSearchOptions.fixturesFolder,
        '**',
        '*',
      )
    }
  }

  const supportFilePath = commonSearchOptions.supportFile || []

  // TODO: think about moving this into config
  // ignore fixtures
  const options = {
    sort: true,
    absolute: true,
    nodir: true,
    cwd: searchFolder,
    ignore: _.compact(_.flatten([
      supportFilePath,
      fixturesFolderPath,
    ])),
  }

  // example of resolved paths in the returned spec object
  // filePath                          = /Users/bmann/Dev/my-project/cypress/integration/foo.js
  // integrationFolderPath             = /Users/bmann/Dev/my-project/cypress/integration
  // relativePathFromSearchFolder      = foo.js
  // relativePathFromProjectRoot       = cypress/integration/foo.js

  const relativePathFromSearchFolder = (file) => {
    return path.relative(searchFolder, file).replace(/\\/g, '/')
  }

  const relativePathFromProjectRoot = (file) => {
    return path.relative(commonSearchOptions.projectRoot, file).replace(/\\/g, '/')
  }

  const setNameParts = (file) => {
    debug('found spec file %s', file)

    if (!path.isAbsolute(file)) {
      throw new Error(`Cannot set parts of file from non-absolute path ${file}`)
    }

    return {
      name: relativePathFromSearchFolder(file),
      relative: relativePathFromProjectRoot(file),
      absolute: file,
    }
  }

  const ignorePatterns = ([] as string[]).concat(commonSearchOptions.ignoreTestFiles)

  // a function which returns true if the file does NOT match
  // all of our ignored patterns
  const doesNotMatchAllIgnoredPatterns = (file) => {
    // using {dot: true} here so that folders with a '.' in them are matched
    // as regular characters without needing an '.' in the
    // using {matchBase: true} here so that patterns without a globstar **
    // match against the basename of the file
    return _.every(ignorePatterns, (pattern) => {
      return !minimatch(file, pattern, MINIMATCH_OPTIONS)
    })
  }

  const matchesSpecPattern = (file) => {
    if (!specPattern) {
      return true
    }

    const matchesPattern = (pattern) => {
      return minimatch(file, pattern, MINIMATCH_OPTIONS)
    }

    // check to see if the file matches
    // any of the spec patterns array
    return _
    .chain<string>([])
    .concat(specPattern)
    .some(matchesPattern)
    .value()
  }

  // grab all the files
  debug('globbing test files "%s"', commonSearchOptions.testFiles)
  debug('glob options %o', options)

  // ensure we handle either a single string or a list of strings the same way
  const testFilesPatterns = ([] as string[]).concat(commonSearchOptions.testFiles)

  /**
   * Finds matching files for the given pattern, filters out specs to be ignored.
   */
  const findOnePattern = (pattern: string) => {
    return glob(pattern, options)
    .tap(debug)

    // filter out anything that matches our
    // ignored test files glob
    .filter(doesNotMatchAllIgnoredPatterns)
    .filter(matchesSpecPattern)
    .map(setNameParts)
    .tap((files: Array<Pick<Cypress.Spec, 'name' | 'relative' | 'absolute'>>) => {
      return debug('found %s: %o', pluralize('spec file', files.length, true), files)
    })
  }

  return Bluebird.mapSeries(testFilesPatterns, findOnePattern).then(_.flatten)
}

const setTestType = (testType: Cypress.CypressSpecType) => R.map(R.set(R.lensProp('specType'), testType))

const findIntegrationSpecs = (searchFolder: string | undefined, commonSearchOptions: CommonSearchOptions, specPattern: string | undefined) => {
  if (!searchFolder) {
    return []
  }

  return findSpecsOfType(searchFolder, commonSearchOptions, specPattern)
  .then(setTestType(SPEC_TYPES.INTEGRATION))
}

const findComponentSpecs = (searchFolder: string | undefined | false, commonSearchOptions: CommonSearchOptions, specPattern: string | undefined) => {
  if (!searchFolder) {
    return []
  }

  return findSpecsOfType(searchFolder, commonSearchOptions, specPattern)
  .then(setTestType(SPEC_TYPES.COMPONENT))
}

const printFoundSpecs = (foundSpecs: Cypress.Spec[]) => {
  const table = new Table({
    head: ['relative', 'specType'],
  })

  foundSpecs.forEach((spec: Cypress.Spec) => {
    // @ts-ignore - types are incorrect
    table.push([spec.relative, spec.specType])
  })

  /* eslint-disable no-console */
  console.error(table.toString())
}

/**
 * First, finds all integration specs, then finds all component specs.
 * Resolves with an array of objects. Each object has a "testType" property
 * with one of TEST_TYPES values.
 */
const findSpecs = (payload: FindSpecs, specPattern?: string) => {
  const { componentFolder, integrationFolder, ...commonSearchOptions } = payload

  return Bluebird.all([
    findComponentSpecs(componentFolder, commonSearchOptions, specPattern),
    findIntegrationSpecs(integrationFolder, commonSearchOptions, specPattern),
  ]).then(([ct, e2e]) => {
    const foundSpecs = [...ct, ...e2e]

    if (debug.enabled) {
      printFoundSpecs(foundSpecs)
    }

    return foundSpecs
  })
}

export default {
  findSpecs,
  findSpecsOfType,
  getPatternRelativeToProjectRoot,
}
