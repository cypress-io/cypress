path = require("path")
Promise = require("bluebird")
fs = require("./fs")

isIntegrationTestRe = /^integration/
isUnitTestRe        = /^unit/

# require.resolve walks the symlinks, which can really change
# the results. For example
#  /tmp/foo is symlink to /private/tmp/foo on Mac
# thus resolving /tmp/foo to find /tmp/foo/index.js
# can return /private/tmp/foo/index.js
# which can really confuse the rest of the code.
# Detect this switch by checking if the resolution of absolute
# paths moved the prefix
#
# Good case: no switcheroo, return false
#   /foo/bar -> /foo/bar/index.js
# Bad case: return true
#   /tmp/foo/bar -> /private/tmp/foo/bar/index.js
checkIfResolveChangedRootFolder = (resolved, initial) ->
  path.isAbsolute(resolved) &&
  path.isAbsolute(initial) &&
  !resolved.startsWith(initial)

# real folder path found could be different due to symlinks
# For example, folder /tmp/foo on Mac is really /private/tmp/foo
getRealFolderPath = (folder) ->
  # TODO check if folder is a non-empty string
  throw new Error("Expected folder") if not folder

  fs.realpathAsync(folder)

getRelativePathToSpec = (spec) ->
  switch
    ## if our file is an integration test
    ## then figure out the absolute path
    ## to it
    when isIntegrationTestRe.test(spec)
      ## strip off the integration part
      path.relative("integration", spec)
    else
      spec

module.exports = {
  checkIfResolveChangedRootFolder

  getRealFolderPath

  getRelativePathToSpec

  getAbsolutePathToSpec: (spec, config) ->
    switch
      ## if our file is an integration test
      ## then figure out the absolute path
      ## to it
      when isIntegrationTestRe.test(spec)
        spec = getRelativePathToSpec(spec)

        ## now simply join this with our integrationFolder
        ## which makes it an absolute path
        path.join(config.integrationFolder, spec)

      # ## commented out until we implement unit testing
      # when isUnitTestRe.test(spec)

        ## strip off the unit part
        # spec = path.relative("unit", spec)

        # ## now simply resolve this with our unitFolder
        # ## which makes it an absolute path
        # path.join(config.unitFolder, spec)

      else
        spec
}
