'use strict'

// @ts-check

const path = require('path')
const { createConfig } = require('@packages/snapshot')
const env = process.env.CYPRESS_ENV === 'production' ? 'prod' : 'dev'
const config = createConfig(env)

const isDev = env === 'dev'

if (process.env.USE_SNAPSHOT != null) {
  runWithSnapshot()
} else if (process.env.USE_VANILLA_SNAPSHOT != null) {
  runWithVanillaSnapshot()
}

function runWithVanillaSnapshot () {
  if (typeof snapshotResult !== 'undefined') {
    // console.log('snapshotResult available!', snapshotResult)
    // console.log('require cache', require.cache)

    const Module = require('module')
    const entryPointDirPath = path.join(process.env.PROJECT_BASE_DIR)

    // console.log('entryPointDirPath:', entryPointDirPath)

    let webpackRequire
    let webpackRequireCache

    const originalRequire = Module.prototype.require

    Module.prototype.require = function (module) {
      if (require.cache[module]) {
        return require.cache[module].exports
      }

      if (!module.startsWith('.') && Module.builtinModules.indexOf(module) !== -1) {
        const cachedModule = {
          id: module,
          exports: originalRequire(module),
        }

        require.cache[module] = cachedModule

        return cachedModule.exports
      }

      const absoluteFilePath = module.startsWith('./node_modules') || module.startsWith('./packages') || module.startsWith('node_modules') || module.startsWith('packages') ? module : Module._resolveFilename(module, this, false)
      let relativeFilePath = path.relative(
        entryPointDirPath,
        absoluteFilePath,
      )

      if (!relativeFilePath.startsWith('./')) {
        relativeFilePath = `./${relativeFilePath}`
      }

      // console.log(relativeFilePath)

      if (process.platform === 'win32') {
        relativeFilePath = relativeFilePath.replace(/\\/g, '/')
      }

      let cachedModule =
        // eslint-disable-next-line no-undef
        snapshotResult.customRequire.cache[relativeFilePath]

      if (cachedModule) {
        return cachedModule.exports
      }

      // eslint-disable-next-line no-undef
      if (snapshotResult.customRequire.definitions[relativeFilePath]) {
        // eslint-disable-next-line no-undef
        cachedModule = snapshotResult.customRequire(relativeFilePath)
        if (relativeFilePath === './packages/server/server.js') {
          webpackRequire = cachedModule.server.webpackRequire
          webpackRequireCache = cachedModule.server.webpackRequire.m
        }

        return cachedModule
      }

      if (!cachedModule) {
        if (webpackRequireCache && webpackRequireCache[relativeFilePath]) {
          cachedModule = webpackRequire(relativeFilePath)

          return cachedModule
        }

        if (module === './node_modules/electron/index.js') {
          cachedModule = { exports: Module._load('electron', this, false) }
        } else if (module.startsWith('./node_modules') || module.startsWith('./packages')) {
          cachedModule = { exports: Module._load(`../.${module}`, this, false) }
        } else if (module.startsWith('node_modules') || module.startsWith('packages')) {
          cachedModule = { exports: Module._load(`../../${module}`, this, false) }
        } else {
          cachedModule = { exports: Module._load(module, this, false) }
        }

        if (relativeFilePath === './packages/server/server.js') {
          webpackRequire = cachedModule.exports.server.webpackRequire
          webpackRequireCache = cachedModule.exports.server.webpackRequire.m
        }

        // eslint-disable-next-line no-undef
        snapshotResult.customRequire.cache[relativeFilePath] = cachedModule
      }

      return cachedModule.exports
    }

    const checked_process =
      typeof process !== 'undefined' ? process : undefined
    const checked_window =
      // eslint-disable-next-line no-undef
      typeof window !== 'undefined' ? window : undefined
    const checked_document =
      // eslint-disable-next-line no-undef
      typeof document !== 'undefined' ? document : undefined

    // eslint-disable-next-line no-undef
    snapshotResult.setGlobals(
      global,
      checked_process,
      checked_window,
      checked_document,
      console,
      require,
    )
  }
}

function runWithSnapshot () {
  const { snapshotRequire } = require('v8-snapshot/dist/loading/snapshot-require')
  const { projectBaseDir } = config

  snapshotRequire(projectBaseDir, {
    diagnostics: isDev,
    useCache: true,
    transpileOpts: {
      supportTS: isDev,
      initTranspileCache: isDev
        ? () => require('dirt-simple-file-cache').DirtSimpleFileCache.initSync(projectBaseDir, { keepInMemoryCache: true })
        : function () {},
      tsconfig: {
        compilerOptions: {
          useDefineForClassFields: false, // default
          importsNotUsedAsValues: 'remove', // default
        },
      },
    },

  })
}
