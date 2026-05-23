const runChildProcess = async (entryPoint) => {
  // FIXME: use a bridge here to import TypeScript into a CommonJS context
  // Once everything is converted to ESM, we can remove this and use import() directly at the top of the file.
  require('tsx/cjs')
  require(entryPoint)
}

const startCypress = async () => {
  try {
    const tsx = require('tsx/cjs/api')

    // @see https://tsx.hirok.io/dev-api/register-cjs
    const unregister = tsx.register()
    // load these files in one by one as we aren't sure if its source TypeScript (development mode) or transpiled JavaScript (production mode).
    // once the file is converted to TypeScript, we can remove these one-off tsx.require calls.
    // One off require calls to tsx are needed for now to prevent side effects when building the binary.
    const { initializeStartTime } = require('./lib/util/performance_benchmark')

    unregister()

    initializeStartTime()

    // No typescript requires before this point please
    // typescript isn't interpreted until the start cypress file
    // Avoid putting much code here all together since this is prior to v8 snapshots.
    const { hookRequire } = require('./hook-require')

    hookRequire({ forceTypeScript: false })

    await require('./start-cypress')
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exit(1)
  }
}

const { entryPoint } = require('minimist')(process.argv.slice(1))

if (entryPoint) {
  module.exports = runChildProcess(entryPoint)
} else {
  module.exports = startCypress()
}
