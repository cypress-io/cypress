_ = require("lodash")
la = require("lazy-ass")
path = require("path")
check = require("check-more-types")
debug = require("debug")("cypress:server:specs")
minimatch = require("minimatch")
glob = require("./glob")

MINIMATCH_OPTIONS = { dot: true, matchBase: true }

getPatternRelativeToProjectRoot = (specPattern, projectRoot) ->
  _.map specPattern, (p) ->
    path.relative(projectRoot, p)

find = (config, specPattern) ->
  la(check.maybe.strings(specPattern), "invalid spec pattern", specPattern)

  integrationFolderPath = config.integrationFolder

  debug(
    "looking for test specs in the folder:",
    integrationFolderPath
  )

  ## support files are not automatically
  ## ignored because only _fixtures are hard
  ## coded. the rest is simply whatever is in
  ## the javascripts array

  if config.fixturesFolder
    fixturesFolderPath = path.join(
      config.fixturesFolder,
      "**",
      "*"
    )

  supportFilePath = config.supportFile or []

  ## map all of the javascripts to the project root
  ## TODO: think about moving this into config
  ## and mapping each of the javascripts into an
  ## absolute path
  javascriptsPaths = _.map config.javascripts, (js) ->
    path.join(config.projectRoot, js)

  ## ignore fixtures + javascripts
  options = {
    sort:     true
    absolute: true
    cwd:      integrationFolderPath
    ignore:   _.compact(_.flatten([
      javascriptsPaths
      supportFilePath
      fixturesFolderPath
    ]))
  }

  ## filePath                          = /Users/bmann/Dev/my-project/cypress/integration/foo.coffee
  ## integrationFolderPath             = /Users/bmann/Dev/my-project/cypress/integration
  ## relativePathFromIntegrationFolder = foo.coffee
  ## relativePathFromProjectRoot       = cypress/integration/foo.coffee

  relativePathFromIntegrationFolder = (file) ->
    path.relative(integrationFolderPath, file)

  relativePathFromProjectRoot = (file) ->
    path.relative(config.projectRoot, file)

  setNameParts = (file) ->
    debug("found spec file %s", file)

    if not path.isAbsolute(file)
      throw new Error("Cannot set parts of file from non-absolute path #{file}")

    {
      name: relativePathFromIntegrationFolder(file)
      relative: relativePathFromProjectRoot(file)
      absolute: file
    }

  ignorePatterns = [].concat(config.ignoreTestFiles)

  ## a function which returns true if the file does NOT match
  ## all of our ignored patterns
  doesNotMatchAllIgnoredPatterns = (file) ->
    ## using {dot: true} here so that folders with a '.' in them are matched
    ## as regular characters without needing an '.' in the
    ## using {matchBase: true} here so that patterns without a globstar **
    ## match against the basename of the file
    _.every ignorePatterns, (pattern) ->
      not minimatch(file, pattern, MINIMATCH_OPTIONS)

  matchesSpecPattern = (file) ->
    if not specPattern
      return true

    matchesPattern = (pattern) ->
      minimatch(file, pattern, MINIMATCH_OPTIONS)

    ## check to see if the file matches
    ## any of the spec patterns array
    return _
    .chain([])
    .concat(specPattern)
    .some(matchesPattern)
    .value()

  ## grab all the files
  glob(config.testFiles, options)

  ## filter out anything that matches our
  ## ignored test files glob
  .filter(doesNotMatchAllIgnoredPatterns)
  .filter(matchesSpecPattern)
  .map(setNameParts)
  .tap (files) ->
    debug("found %d spec files: %o", files.length, files)

module.exports = {
  find

  getPatternRelativeToProjectRoot
}
