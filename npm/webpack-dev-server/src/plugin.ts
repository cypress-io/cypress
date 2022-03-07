import webpack, { Compiler } from 'webpack'
import { EventEmitter } from 'events'
import _ from 'lodash'
import semver from 'semver'
import fs, { PathLike } from 'fs'
import path from 'path'
import debugFn from 'debug'
// eslint-disable-next-line no-duplicate-imports
import type { Compilation } from 'webpack'

const debug = debugFn('cypress:webpack-dev-server:webpack')

type UtimesSync = (path: PathLike, atime: string | number | Date, mtime: string | number | Date) => void

export interface CypressCTOptionsPluginOptions {
  files: Cypress.Cypress['spec'][]
  projectRoot: string
  supportFile: string
  devServerEvents?: EventEmitter
}

export interface CypressCTOptionsPluginState {
  allFiles: Cypress.Cypress['spec'][]
  projectRoot: string
  supportFile: string
  devServerEvents?: EventEmitter
}

export type CypressCTOptionsPluginOptionsWithEmitter = CypressCTOptionsPluginOptions & {
  devServerEvents: EventEmitter
}

export interface CypressCTWebpackContext {
  _cypress: CypressCTOptionsPluginState
}

export type Webpack45Compilation = Compilation & {
  // TODO: Drop these additional Webpack 4 types
  inputFileSystem: {
    fileSystem: {
      utimesSync: UtimesSync
    }
  }
}

export const normalizeError = (error: Error | string) => {
  return typeof error === 'string' ? error : error.message
}

const pluginName = 'CypressCTOptionsPlugin'

export default class CypressCTOptionsPlugin {
  private active: Set<string> = new Set()
  private allFiles: Cypress.Cypress['spec'][]
  private supportFile: string
  private errorEmitted = false
  private pendingRequests: (() => void)[] = []
  private compilation: Webpack45Compilation | null = null
  private compiling = false

  private readonly projectRoot: string
  private readonly devServerEvents: EventEmitter

  constructor (options: CypressCTOptionsPluginOptionsWithEmitter) {
    this.allFiles = options.files
    this.supportFile = options.supportFile
    this.projectRoot = options.projectRoot
    this.devServerEvents = options.devServerEvents

    // Uncomment this line to compile all specs immediately.
    // Sometimes useful for testing performance
    // this.allFiles.forEach(({absolute}) => this.active.add(absolute))
  }

  private setLoaderContext (context: CypressCTWebpackContext) {
    context._cypress = {
      allFiles: this.allFiles,
      projectRoot: this.projectRoot,
      supportFile: this.supportFile,
    }
  }

  private isSpecFile (path: string) {
    return Boolean(_.find(this.allFiles, ['absolute', path]))
  }

  private ignoreInactive = (result: any) => {
    if (this.isSpecFile(result.request) && !this.active.has(result.request)) {
      debug(`blocking compilation of ${result.request}, spec is not active`)

      return false
    }

    if ('NormalModule' in webpack) {
      // Webpack 5
      return
    }

    // Webpack 4
    return result
  }

  private onSpecsChanged = (specs: Cypress.Cypress['spec'][]) => {
    if (_.isEqual(specs, this.allFiles)) {
      return
    }

    this.allFiles = specs
    this.invalidate()
  }

  private onSpecRequest = (url: string, done: () => void) => {
    if (!this.isSpecFile(url) || this.active.has(url)) {
      if (this.compiling) {
        this.pendingRequests.push(done)
      } else {
        done()
      }

      return
    }

    debug('compiling new spec', url)
    this.active.add(url)
    this.compiling = true
    this.pendingRequests.push(done)
    this.invalidate()
  }

  /**
   *
   * @param compilation webpack 4 `compilation.Compilation`, webpack 5
   *   `Compilation`
   */
  private setupCompilationHooks (compilation: Webpack45Compilation) {
    // This function gets invoked every time compilation is invoked; we need to clean up
    // any previous listeners so we don't leak them.
    this.compilation = compilation
    this.devServerEvents.off('dev-server:specs:changed', this.onSpecsChanged)
    this.devServerEvents.off('webpack-dev-server:request', this.onSpecRequest)
    this.devServerEvents.on('dev-server:specs:changed', this.onSpecsChanged)
    this.devServerEvents.on('webpack-dev-server:request', this.onSpecRequest)

    /* istanbul ignore next */
    if ('NormalModule' in webpack) {
      // Webpack 5
      webpack.NormalModule.getCompilationHooks(compilation).loader.tap(
        pluginName,
        (context) => this.setLoaderContext(context as CypressCTWebpackContext),
      )
    } else {
      // Webpack 4
      compilation.hooks.normalModuleLoader.tap(
        pluginName,
        (context) => this.setLoaderContext(context as CypressCTWebpackContext),
      )
    }
  }

  private invalidate = () => {
    if (!this.compilation) {
      return
    }

    const inputFileSystem = this.compilation.inputFileSystem
    const utimesSync: UtimesSync = semver.gt('4.0.0', webpack.version) ? inputFileSystem.fileSystem.utimesSync : fs.utimesSync

    utimesSync(path.resolve(__dirname, 'browser.js'), new Date(), new Date())
  }

  private afterCompile (compilation: Webpack45Compilation) {
    this.compiling = false
    const stats = compilation.getStats()

    if (stats.hasErrors()) {
      this.errorEmitted = true

      // webpack 4: string[]
      // webpack 5: Error[]
      const errors = stats.toJson().errors as Array<Error | string> | undefined

      if (!errors || !errors.length) {
        return
      }

      this.devServerEvents.emit('dev-server:compile:error', normalizeError(errors[0]))
    } else if (this.errorEmitted) {
      // compilation succeed but assets haven't emitted to the output yet
      this.devServerEvents.emit('dev-server:compile:error', null)
    }

    this.pendingRequests.forEach((done) => done())
    this.pendingRequests = []
  }

  private afterEmit (compilation: Webpack45Compilation) {
    if (!compilation.getStats().hasErrors()) {
      this.devServerEvents.emit('dev-server:compile:success')
    }
  }

  apply (compiler: Compiler): void {
    compiler.hooks.normalModuleFactory.tap(pluginName, (nmf) => {
      nmf.hooks.beforeResolve.tap(pluginName, this.ignoreInactive)
    })

    compiler.hooks.thisCompilation.tap(pluginName, (c) => this.setupCompilationHooks(c as Webpack45Compilation))
    compiler.hooks.beforeCompile.tap(pluginName, (c) => this.compiling = true)
    compiler.hooks.afterCompile.tap(pluginName, (c) => this.afterCompile(c as Webpack45Compilation))
    compiler.hooks.afterEmit.tap(pluginName, (c) => this.afterEmit(c as Webpack45Compilation))
  }
}
