// @ts-check
const debugLib = require('debug')
const path = require('path')
const tsnode = require('ts-node')
const resolve = require('../../util/resolve')

const debug = debugLib('cypress:server:ts-node')

const getTsNodeOptions = (tsPath, registeredFile) => {
  /**
   * @type {import('ts-node').RegisterOptions}
   */
  const opts = {
    compiler: process.env.TS_NODE_COMPILER || tsPath, // use the user's installed typescript
    compilerOptions: {
      module: 'CommonJS',
    },
    // resolves tsconfig.json starting from the plugins directory
    // instead of the cwd (the project root)
    dir: path.dirname(registeredFile),
    transpileOnly: true, // transpile only (no type-check) for speed
  }

  return opts
}

const register = (projectRoot, registeredFile) => {
  // in test mode we already register ts-node for the config object
  // we don't want to re-register it.
  // This should be false in production
  if (process.env.CYPRESS_TS_NODE_REGISTERED) return

  try {
    debug('projectRoot path: %s', projectRoot)
    debug('registeredFile: %s', registeredFile)
    const tsPath = resolve.typescript(projectRoot)

    if (!tsPath) return

    debug('typescript path: %s', tsPath)

    const tsOptions = getTsNodeOptions(tsPath, registeredFile)

    debug('registering project TS with options %o', tsOptions)

    require('tsconfig-paths/register')
    tsnode.register(tsOptions)
  } catch (err) {
    debug(`typescript doesn't exist. ts-node setup failed.`)
    debug('error message: %s', err.message)
  }
}

module.exports = {
  register,
}
