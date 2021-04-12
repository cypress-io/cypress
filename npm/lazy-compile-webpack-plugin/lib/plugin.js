const fs = require('fs')
const Server = require('./server')
const util = require('./util')
const getIps = require('./util/getIps')

const DEFAULT_PORT = 8060
const moduleLoader = require.resolve('./loaders/module-loader.js')
const entryLoader = require.resolve('./loaders/entry-loader.js')

function isImportDep (dep) {
  return dep.type.startsWith('import()')
}

function isEntryDep (dep) {
  return dep.type === 'single entry' || dep.type === 'multi entry'
}

function isEntry (wpModule) {
  const { dependencies } = wpModule

  return dependencies && dependencies.some(isEntryDep)
}

function getModuleId (wpModule) {
  // return wpModule.resourceResolveData.path;
  return wpModule.userRequest
}

const ModuleStatus = {
  INIT: 1,
  BLOCKED: 2,
  READY: 3,
  COMPILED: 4,
}

class LazyCompilePlugin {
  constructor (options) {
    options = options || {}
    this.options = Object.assign(
      {
        refreshAfterCompile: false,
      },
      options,
      {
        ignores: [/\bhtml-webpack-plugin\b/].concat(options.ignores || []),
      },
    )

    this.server = new Server(this, DEFAULT_PORT)
    const ips = getIps()

    this._ips = ips.length ? ips : ['localhost']
    this._lazyModules = new Map()
    this._pendingActivation = []
    this._firstCompileDone = false
    this._collectLazyModules = this._collectLazyModules.bind(this)
  }

  async activateModule (id) {
    if (!this._firstCompileDone) {
      this._pendingActivation.push(id)

      return
    }

    const moduleInfo = this._lazyModules.get(id)

    if (moduleInfo) {
      moduleInfo.status = ModuleStatus.READY

      return this._recompile(moduleInfo.filename)
    }
  }

  apply (compiler) {
    let serverLunched = false
    const serverPromise = this._startServer()

    compiler.hooks.beforeCompile.tapAsync(
      'LazyCompilePlugin',
      ({ normalModuleFactory }, callback) => {
        normalModuleFactory.hooks.afterResolve.tap(
          'LazyCompilePlugin',
          this._collectLazyModules,
        )

        if (serverLunched) {
          callback()
        } else {
          serverPromise.then(
            () => {
              serverLunched = true
              callback()
            },
            (err) => callback(err),
          )
        }
      },
    )

    compiler.hooks.compilation.tap('LazyCompilePlugin', (compilation) => {
      compilation.hooks.buildModule.tap('LazyCompilePlugin', (wpModule) => {
        const id = getModuleId(wpModule)

        if (!this._lazyModules.has(id)) {
          return
        }

        const moduleInfo = this._lazyModules.get(id)

        if (moduleInfo.status === ModuleStatus.COMPILED) {
          return
        }

        if (moduleInfo.status === ModuleStatus.READY) {
          wpModule.loaders = moduleInfo.loaders
          moduleInfo.status = ModuleStatus.COMPILED
        } else if (moduleInfo.status === ModuleStatus.INIT) {
          const stripQuery = wpModule.resource.replace(/\?.*$/, '')

          moduleInfo.filename = stripQuery
          moduleInfo.loaders = wpModule.loaders
          wpModule.loaders = [
            {
              loader: moduleInfo.isEntry ? entryLoader : moduleLoader,
              options: {
                hmr: !this.options.refreshAfterCompile,
                activationUrl: this.server.createActivationUrl(id),
                ips: this._ips.length ? this._ips : ['localhost'],
              },
            },
          ]

          moduleInfo.status = ModuleStatus.BLOCKED
        }
      })
    })

    compiler.hooks.done.tap('LazyCompilePlugin', () => {
      if (this._firstCompileDone) return

      this._pendingActivation.forEach((id) => this.activateModule(id))
      this._firstCompileDone = true
    })
  }

  dispose () {
    this.server.close()
  }

  async _startServer () {
    await this.server.start()
  }

  async _recompile (filename) {
    return new Promise((resolve, reject) => {
      const now = new Date()

      // trigger watcher to recompile
      fs.utimes(filename, now, now, (err) => {
        if (err) {
          return reject(err)
        }

        resolve()
      })
    })
  }

  _collectLazyModules (wpModule) {
    const id = getModuleId(wpModule)

    if (this._shouldBeLazy(wpModule) && !this._lazyModules.has(id)) {
      this._lazyModules.set(id, {
        status: ModuleStatus.INIT,
        isEntry: isEntry(wpModule),
      })
    }
  }

  _shouldBeLazy (wpModule) {
    const { request, dependencies } = wpModule

    if (dependencies.length <= 0) return false

    const lazible = dependencies.some(
      (dep) => isImportDep(dep) || isEntryDep(dep),
    )

    if (!lazible) return false

    const { ignores } = this.options

    for (let index = 0; index < ignores.length; index++) {
      const ignore = ignores[index]
      let shouldIgnore = false

      if (util.isRegExp(ignore)) {
        shouldIgnore = ignore.test(request)
      } else if (util.isFunction(ignore)) {
        shouldIgnore = ignore(request, wpModule)
      }

      if (shouldIgnore) return false
    }

    return true
  }
}

module.exports = LazyCompilePlugin
