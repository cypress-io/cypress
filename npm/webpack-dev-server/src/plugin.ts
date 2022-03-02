import webpack, { Compiler } from 'webpack'
import { EventEmitter } from 'events'
import _ from 'lodash'
import semver from 'semver'
import fs, { PathLike } from 'fs'
import path from 'path'
// eslint-disable-next-line no-duplicate-imports
import type { Compilation } from 'webpack'

type UtimesSync = (path: PathLike, atime: string | number | Date, mtime: string | number | Date) => void

export interface CypressCTOptionsPluginOptions {
  files: Cypress.Cypress['spec'][]
  projectRoot: string
  supportFile: string
  publicPath?: string
  devServerEvents?: EventEmitter
}

export interface CypressCTOptionsPluginState {
  allFiles: Cypress.Cypress['spec'][]
  projectRoot: string
  supportFile: string
  devServerEvents?: EventEmitter
}

export type CypressCTOptionsPluginOptionsWithEmitter = CypressCTOptionsPluginOptions & {
  publicPath: string
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

export default class CypressCTOptionsPlugin {
  private active: Set<string> = new Set()
  private allFiles: Cypress.Cypress['spec'][]
  private supportFile: string
  private publicPath: string
  private errorEmitted = false

  private readonly projectRoot: string
  private readonly devServerEvents: EventEmitter

  constructor (options: CypressCTOptionsPluginOptionsWithEmitter) {
    this.allFiles = options.files
    this.supportFile = options.supportFile
    this.projectRoot = options.projectRoot
    this.devServerEvents = options.devServerEvents
    this.publicPath = options.publicPath
    // Uncomment this one line to return to old behavior - all specs compiled initially,
    // nothing incremental.
    // Handy for comparing without reinstalling anything.
//     this.allFiles.forEach(({absolute}) => this.active.add(absolute))
  }

  private pluginFunc = (context: CypressCTWebpackContext) => {
    context._cypress = {
      allFiles: this.allFiles,
      projectRoot: this.projectRoot,
      supportFile: this.supportFile,
    }
  };

  private isSpecFile(path: string) { return Boolean(_.find(this.allFiles, ['absolute', path])) }

  private ignoreInactive = (result: any) => {
    if (this.isSpecFile(result.request) && !this.active.has(result.request)) {
      console.log(`aborting ${result.request}, spec is not active`)
      return null
    }

    return result
  }

  private setupCustomHMR = (compiler: webpack.Compiler) => {
    compiler.hooks.normalModuleFactory.tap("CypressCTOptionsPlugin", nmf => {
      nmf.hooks.beforeResolve.tap("CypressCTOptionsPlugin", this.ignoreInactive);
    });

    compiler.hooks.afterCompile.tap(
      'CypressCTOptionsPlugin',
      (compilation) => {
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
      },
    )

    compiler.hooks.afterEmit.tap(
      'CypressCTOptionsPlugin',
      (compilation) => {
        if (!compilation.getStats().hasErrors()) {
          this.devServerEvents.emit('dev-server:compile:success')
        }
      },
    )
  }

  /**
   *
   * @param compilation webpack 4 `compilation.Compilation`, webpack 5
   *   `Compilation`
   */
  private plugin = (compilation: Webpack45Compilation) => {
    this.devServerEvents.on('dev-server:specs:changed', (specs) => {
      if (_.isEqual(specs, this.allFiles)) {
        return
      }

      this.allFiles = specs
      this.invalidate(compilation)
    })

    /* istanbul ignore next */
    if ('NormalModule' in webpack) {
      // Webpack 5
      webpack.NormalModule.getCompilationHooks(compilation).loader.tap(
        'CypressCTOptionsPlugin',
        (context) => this.pluginFunc(context as CypressCTWebpackContext),
      )
    } else {
      // Webpack 4
      compilation.hooks.normalModuleLoader.tap(
        'CypressCTOptionsPlugin',
        (context) => this.pluginFunc(context as CypressCTWebpackContext),
      )
    }


    this.devServerEvents.on('webpack-dev-server:request', (url) => {
      console.log(this.isSpecFile(url), url, this.active.has(url))

      if (!this.isSpecFile(url) || this.active.has(url)) {
        return
      }

      console.log('asking for new spec', url)
      this.active.add(url)
      this.invalidate(compilation)
    })
  };

  private invalidate = (compilation: Webpack45Compilation) => {
    const inputFileSystem = compilation.inputFileSystem
    const utimesSync: UtimesSync = semver.gt('4.0.0', webpack.version) ? inputFileSystem.fileSystem.utimesSync : fs.utimesSync

    utimesSync(path.resolve(__dirname, 'browser.js'), new Date(), new Date())
  }

  apply (compiler: Compiler): void {
    this.setupCustomHMR(compiler)
    compiler.hooks.compilation.tap('CypressCTOptionsPlugin', (compilation) => this.plugin(compilation as Webpack45Compilation))
  }
}
