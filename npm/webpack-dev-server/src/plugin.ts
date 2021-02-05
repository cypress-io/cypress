import webpack, { Compiler, compilation, Plugin } from 'webpack'
import { EventEmitter } from 'events'
import _ from 'lodash'
import semver from 'semver'
import fs, { PathLike } from 'fs'
import path from 'path'

type UtimesSync = (path: PathLike, atime: string | number | Date, mtime: string | number | Date) => void

export interface CypressCTOptionsPluginOptions {
  files: Cypress.Cypress['spec'][]
  projectRoot: string
  supportFile: string
  devServerEvents?: EventEmitter
}

export interface CypressCTWebpackContext extends compilation.Compilation {
  _cypress: CypressCTOptionsPluginOptions
}

export default class CypressCTOptionsPlugin implements Plugin {
  private files: Cypress.Cypress['spec'][] = []
  private supportFile: string
  private errorEmitted = false

  private readonly projectRoot: string
  private readonly devServerEvents: EventEmitter

  constructor (options: CypressCTOptionsPluginOptions) {
    this.files = options.files
    this.supportFile = options.supportFile
    this.projectRoot = options.projectRoot
    this.devServerEvents = options.devServerEvents
  }

  private pluginFunc = (context: CypressCTWebpackContext, module: compilation.Module) => {
    context._cypress = {
      files: this.files,
      projectRoot: this.projectRoot,
      supportFile: this.supportFile,
    }
  };

  private setupCustomHMR = (compiler: webpack.Compiler) => {
    compiler.hooks.afterCompile.tap(
      'CypressCTOptionsPlugin',
      (compilation: compilation.Compilation) => {
        const stats = compilation.getStats()

        if (stats.hasErrors()) {
          this.errorEmitted = true
          this.devServerEvents.emit('dev-server:compile:error', stats.toJson().errors[0])
        } else if (this.errorEmitted) {
          // compilation succeed but assets haven't emitted to the output yet
          this.devServerEvents.emit('dev-server:compile:error', null)
        }
      },
    )

    compiler.hooks.afterEmit.tap(
      'CypressCTOptionsPlugin',
      (compilation: compilation.Compilation) => {
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
  private plugin = (compilation: compilation.Compilation) => {
    this.devServerEvents.on('dev-server:specs:changed', (specs) => {
      if (_.isEqual(specs, this.files)) return

      this.files = specs
      const inputFileSystem = compilation.inputFileSystem
      const utimesSync: UtimesSync = semver.gt('4.0.0', webpack.version) ? inputFileSystem.fileSystem.utimesSync : fs.utimesSync

      utimesSync(path.resolve(__dirname, 'browser.js'), new Date(), new Date())
    })

    // Webpack 5
    /* istanbul ignore next */
    if ('NormalModule' in webpack) {
      // @ts-ignore
      webpack.NormalModule.getCompilationHooks(compilation).loader.tap(
        'CypressCTOptionsPlugin',
        this.pluginFunc,
      )

      return
    }

    // Webpack 4
    compilation.hooks.normalModuleLoader.tap(
      'CypressCTOptionsPlugin',
      this.pluginFunc,
    )
  };

  apply (compiler: Compiler): void {
    this.setupCustomHMR(compiler)
    compiler.hooks.compilation.tap('CypressCTOptionsPlugin', this.plugin)
  }
}
