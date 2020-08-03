const debug = require('debug')('cypress:server:ts-node')
const tsnode = require('ts-node')
const resolve = require('resolve')

const getTsNodeOptions = (tsPath) => {
  return {
    compiler: tsPath, // use the user's installed typescript
    compilerOptions: {
      module: 'CommonJS',
    },
    transpileOnly: true, // transpile only (no type-check) for speed
  }
}

const registerTsNode = (projectRoot) => {
  try {
    const tsPath = resolve.sync('typescript', {
      basedir: projectRoot,
    })
    const tsOptions = getTsNodeOptions(tsPath)

    debug('typescript path: %s', tsPath)
    debug('registering project TS with options %o', tsOptions)

    tsnode.register(tsOptions)
  } catch (err) {
    debug(`typescript doesn't exist. ts-node setup failed.`)
    debug('error message: %s', err.message)
  }
}

module.exports = {
  registerTsNode,
}
