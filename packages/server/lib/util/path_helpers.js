const path = require('path')
const { fs } = require('./fs')
const debug = require('debug')('cypress:server:path_helpers')
const _ = require('lodash')

// When we load the spec iframe, we set its url to start with the type of the spec file
// thus all integration tests are at "/integration/..."
// and all component tests are at "/component/..."
// After the spec type the url is the relative path to the spec from
// the parent folder _of that spec type_.
// Example:
//    root/
//      cypress/
//        e2e/
//          spec.js
// Cypress config:
//   integrationFolder: cypress/e2e
// Serving spec.js at url: /integration/spec.js
const isIntegrationTestRe = /^integration/
const isComponentTestRe = /^component/

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

    case !isComponentTestRe.test(spec):
      return path.relative('component', spec)

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

    const componentTestingEnabled = _.get(config, 'resolved.testingType.value', 'e2e') === 'component'

    // if our file is an integration test
    // then figure out the absolute path
    // to it
    if (isIntegrationTestRe.test(spec)) {
      spec = getRelativePathToSpec(spec)

      // now simply join this with our integrationFolder
      // which makes it an absolute path
      const resolved = path.join(config.integrationFolder, spec)

      debug('resolved path %s', resolved)

      return resolved
    }

    if (componentTestingEnabled && isComponentTestRe.test(spec)) {
      spec = getRelativePathToSpec(spec)

      const resolved = path.join(config.componentFolder, spec)

      debug('resolved component spec path %o', { spec, componentFolder: config.componentFolder, resolved })

      return resolved
    }

    // when isUnitTestRe.test(spec)

    // // strip off the unit part
    // spec = path.relative("unit", spec)

    debug('returning default path %s', spec)

    return spec
  },
}
