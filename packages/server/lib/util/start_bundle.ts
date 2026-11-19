import fs from 'fs'
import Module from 'module'
import path from 'path'
import vm from 'vm'
import Debug from 'debug'

const debug = Debug('cypress:server:start-bundle')

const START_BUNDLE_FILE = 'start-cypress.bundle.js'

export const getStartBundlePaths = (serverDir: string) => {
  const bundlePath = path.join(serverDir, START_BUNDLE_FILE)

  return { bundlePath, cachePath: `${bundlePath}.cache` }
}

const readCachedData = (cachePath: string) => {
  try {
    // eslint-disable-next-line no-restricted-syntax
    return fs.readFileSync(cachePath)
  } catch {
    return undefined
  }
}

/**
 * Runs the main process bundle that the binary build produces in place of `start-cypress.js`, with the V8 code cache
 * the build generated for it. With CYPRESS_INTERNAL_WRITE_START_BUNDLE_CACHE set, it writes that cache when the process
 * exits instead, so the cache also holds the functions that compiled lazily during startup.
 */
export const loadStartBundle = (serverDir: string): unknown => {
  const { bundlePath, cachePath } = getStartBundlePaths(serverDir)
  const writeCache = !!process.env.CYPRESS_INTERNAL_WRITE_START_BUNDLE_CACHE
  // Synchronous on purpose: start-cypress appends Electron switches, which are ignored once the app is ready
  // eslint-disable-next-line no-restricted-syntax
  const bundleSource = fs.readFileSync(bundlePath, 'utf8')
  const cachedData = writeCache ? undefined : readCachedData(cachePath)
  // The wrapper sits on its own line so that lineOffset keeps stack positions in the bundle accurate
  const source = `(function (exports, require, module, __filename, __dirname) {\n${bundleSource}\n})`

  const script = new vm.Script(source, {
    filename: bundlePath,
    lineOffset: -1,
    cachedData,
    importModuleDynamically: vm.constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
  })

  if (cachedData) {
    debug('code cache %s (%d bytes)', script.cachedDataRejected ? 'rejected' : 'accepted', cachedData.length)
  }

  if (writeCache) {
    process.once('exit', () => {
      // 'exit' listeners must be synchronous
      // eslint-disable-next-line no-restricted-syntax
      fs.writeFileSync(cachePath, script.createCachedData())
    })
  }

  const bundleModule = new Module(bundlePath, module)

  bundleModule.filename = bundlePath
  script.runInThisContext()(bundleModule.exports, Module.createRequire(bundlePath), bundleModule, bundlePath, serverDir)
  bundleModule.loaded = true

  return bundleModule.exports
}
