const _ = require('lodash')
const la = require('lazy-ass')
const path = require('path')
const check = require('check-more-types')
const debug = require('debug')('cypress:server:specs')
const minimatch = require('minimatch')
const Promise = require('bluebird')
const glob = require('./glob')

const MINIMATCH_OPTIONS = { dot: true, matchBase: true }

const getPatternRelativeToProjectRoot = (specPattern, projectRoot) => {
  return _.map(specPattern, (p) => {
    return path.relative(projectRoot, p)
  })
}

/**
 * Finds all spec files that pass the config.
 */
const find = function findSpecs (config, specPattern) {
  let fixturesFolderPath

  la(check.maybe.strings(specPattern), 'invalid spec pattern', specPattern)

  const integrationFolderPath = config.integrationFolder

  debug(
    'looking for test specs in the folder:',
    integrationFolderPath
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

  if (config.fixturesFolder) {
    fixturesFolderPath = path.join(
      config.fixturesFolder,
      '**',
      '*'
    )
  }

  const supportFilePath = config.supportFile || []

  // map all of the javascripts to the project root
  // TODO: think about moving this into config
  // and mapping each of the javascripts into an
  // absolute path
  const javascriptsPaths = _.map(config.javascripts, (js) => {
    return path.join(config.projectRoot, js)
  })

  // ignore fixtures + javascripts
  const options = {
    sort: true,
    absolute: true,
    nodir: true,
    cwd: integrationFolderPath,
    ignore: _.compact(_.flatten([
      javascriptsPaths,
      supportFilePath,
      fixturesFolderPath,
    ])),
  }

  // filePath                          = /Users/bmann/Dev/my-project/cypress/integration/foo.coffee
  // integrationFolderPath             = /Users/bmann/Dev/my-project/cypress/integration
  // relativePathFromIntegrationFolder = foo.coffee
  // relativePathFromProjectRoot       = cypress/integration/foo.coffee

  const relativePathFromIntegrationFolder = (file) => {
    return path.relative(integrationFolderPath, file)
  }

  const relativePathFromProjectRoot = (file) => {
    return path.relative(config.projectRoot, file)
  }

  const setNameParts = (file) => {
    debug('found spec file %s', file)

    if (!path.isAbsolute(file)) {
      throw new Error(`Cannot set parts of file from non-absolute path ${file}`)
    }

    return {
      name: relativePathFromIntegrationFolder(file),
      relative: relativePathFromProjectRoot(file),
      absolute: file,
    }
  }

  const ignorePatterns = [].concat(config.ignoreTestFiles)

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
    .chain([])
    .concat(specPattern)
    .some(matchesPattern)
    .value()
  }

  // grab all the files
  debug('globbing test files "%s"', config.testFiles)
  debug('glob options %o', options)

  // ensure we handle either a single string or a list of strings the same way
  const testFilesPatterns = [].concat(config.testFiles)

  /**
   * Finds matching files for the given pattern, filters out specs to be ignored.
   */
  const findOnePattern = (pattern) => {
    return glob(pattern, options)
    .tap(debug)

    // filter out anything that matches our
    // ignored test files glob
    .filter(doesNotMatchAllIgnoredPatterns)
    .filter(matchesSpecPattern)
    .map(setNameParts)
    .tap((files) => {
      return debug('found %d spec files: %o', files.length, files)
    })
  }

  return Promise.mapSeries(testFilesPatterns, findOnePattern).then(_.flatten)
}

module.exports = {
  find,

  getPatternRelativeToProjectRoot,
}
