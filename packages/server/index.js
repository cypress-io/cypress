const runChildProcess = async (entryPoint) => {
  // FIXME: use a bridge here to import TypeScript into a CommonJS context
  // Once everything is converted to ESM, we can remove this and use import() directly at the top of the file.
  require('tsx/cjs')
  require('./lib/util/patch_promise_then').patchPromiseThen()
  require(entryPoint)
}

const stubElectronModuleOutsideElectron = () => {
  // Run as plain Node (a --workers process, or ELECTRON_RUN_AS_NODE=1 cypress run), Electron's built-in module
  // doesn't exist and run mode never calls it, but modules that run mode loads still import it
  if (!process.env.ELECTRON_RUN_AS_NODE || !process.versions.electron) return

  const Module = require('module')
  const load = Module._load

  Module._load = function (request, ...args) {
    return request === 'electron' ? {} : load.call(this, request, ...args)
  }
}

const startCypress = async () => {
  stubElectronModuleOutsideElectron()

  try {
    // The binary build replaces start-cypress.js with a single bundle of the main process and ships these modules
    // as JavaScript, so it needs no tsx
    if (require('fs').existsSync(require('path').join(__dirname, 'start-cypress.bundle.js'))) {
      require('./lib/util/patch_promise_then').patchPromiseThen()
      require('./lib/util/performance_benchmark').initializeStartTime()
      await require('./lib/util/start_bundle').loadStartBundle(__dirname)

      return
    }

    const tsx = require('tsx/cjs/api')

    // @see https://tsx.hirok.io/dev-api/register-cjs
    const unregister = tsx.register()
    // load these files in one by one as we aren't sure if its source TypeScript (development mode) or transpiled JavaScript (production mode).
    // once the file is converted to TypeScript, we can remove these one-off tsx.require calls.
    // One off require calls to tsx are needed for now to prevent side effects when building the binary.
    const { patchPromiseThen } = require('./lib/util/patch_promise_then')
    const { initializeStartTime } = require('./lib/util/performance_benchmark')

    unregister()

    patchPromiseThen()
    initializeStartTime()

    // No typescript requires before this point please
    // typescript isn't interpreted until the start cypress file
    const { hookRequire } = require('./hook-require')

    hookRequire()

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
