const debug = require('debug')('cypress:server:find_system_node')
const execa = require('execa')
const fixPath = require('fix-path')
const Promise = require('bluebird')
const which = require('which')

const NODE_VERSION_RE = /^v(\d+\.\d+\.\d+)/m

/*
 * Find the full path to a `node` binary on the current PATH.
 * Note about fix-path:
 *   while fix-path is good, it can cause unexpected behavior when running Cypress locally
 *   for example, using NVM we set local Node to 8
 *   then fix-path adds all user paths, and the found Node is whatever we have
 *   installed globally, like 6 or 10 (NVM path comes later)
 *   So this function only fixes the path, if the Node cannot be found on first attempt
 */
function findNodeInFullPath () {
  debug('finding Node with $PATH %s', process.env.PATH)

  return Promise.fromCallback((cb) => {
    return which('node', cb)
  })
  .catch(() => {
    debug('could not find Node, trying to fix path')
    // Fix the $PATH on macOS when run from a GUI app
    fixPath()
    debug('searching again with fixed $PATH %s', process.env.PATH)

    return Promise.fromCallback((cb) => {
      return which('node', cb)
    })
  })
  .tap((path) => {
    debug('found Node %o', { path })
  })
  .catch((err) => {
    debug('could not find Node %o', { err })

    throw err
  })
}

function findNodeVersionFromPath (path) {
  if (!path) {
    return Promise.resolve(null)
  }

  return execa.stdout(path, ['-v'])
  .then((stdout) => {
    debug('node -v returned %o', { stdout })
    const matches = NODE_VERSION_RE.exec(stdout)

    if (matches && matches.length === 2) {
      const version = matches[1]

      debug('found Node version', { version })

      return version
    }
  })
  .catch((err) => {
    debug('could not resolve Node version %o', { err })

    throw err
  })
}

function findNodePathAndVersion () {
  return findNodeInFullPath()
  .then((path) => {
    return findNodeVersionFromPath(path)
    .then((version) => {
      return {
        path, version,
      }
    })
  })
}

module.exports = {
  findNodePathAndVersion,
}
