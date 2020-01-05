const path = require('path')
const fs = require('./fs')
const debug = require('debug')('cypress:server:path_helpers')

const isIntegrationTestRe = /^integration/
// TODO THIS IS A HACK, WE MUST DETERMINE PATH TO LOAD BETTER
const isComponentTestRe = /component/

// require.resolve walks the symlinks, which can really change
// the results. For example
//  /tmp/foo is symlink to /private/tmp/foo on Mac
// thus resolving /tmp/foo to find /tmp/foo/index.js
// can return /private/tmp/foo/index.js
// which can really confuse the rest of the code.
// Detect this switch by checking if the resolution of absolute
// paths moved the prefix
//
// Good case: no switcheroo, return false
//   /foo/bar -> /foo/bar/index.js
// Bad case: return true
//   /tmp/foo/bar -> /private/tmp/foo/bar/index.js
const checkIfResolveChangedRootFolder = (resolved, initial) => {
  return path.isAbsolute(resolved) &&
  path.isAbsolute(initial) &&
  !resolved.startsWith(initial)
}

// real folder path found could be different due to symlinks
// For example, folder /tmp/foo on Mac is really /private/tmp/foo
const getRealFolderPath = (folder) => {
  // TODO check if folder is a non-empty string
  if (!folder) {
    throw new Error('Expected folder')
  }

  return fs.realpathAsync(folder)
}

const getRelativePathToSpec = (spec) => {
  switch (false) {
    // if our file is an integration test
    // then figure out the absolute path
    // to it
    case !isIntegrationTestRe.test(spec):
      // strip off the integration part
      return path.relative('integration', spec)
    default:
      return spec
  }
}

module.exports = {
  checkIfResolveChangedRootFolder,

  getRealFolderPath,

  getRelativePathToSpec,

  getAbsolutePathToSpec (spec, config) {
    debug('get absolute path to spec %o', { spec })

    let resolved

    switch (false) {
      // if our file is an integration test
      // then figure out the absolute path
      // to it
      case !isIntegrationTestRe.test(spec):
        spec = getRelativePathToSpec(spec)

        // now simply join this with our integrationFolder
        // which makes it an absolute path
        resolved = path.join(config.integrationFolder, spec)

        debug('resolved path %s', resolved)

        return resolved

        // // commented out until we implement unit testing
        // when isUnitTestRe.test(spec)

        // // strip off the unit part
        // spec = path.relative("unit", spec)

        // // now simply resolve this with our unitFolder
        // // which makes it an absolute path
        // path.join(config.unitFolder, spec)

      case !isComponentTestRe.test(spec):
        resolved = path.join(config.parentTestsFolder, spec)

        debug('resolved component path %s', resolved)

        return resolved

      default:
        debug('returning default path %s', spec)

        return spec
    }
  },
}
