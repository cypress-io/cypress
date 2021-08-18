import webpack from 'webpack'
// eslint-disable-next-line no-duplicate-imports
import type { Compiler, Compilation, Module } from 'webpack'
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

export type CypressCTOptionsPluginOptionsWithEmitter = CypressCTOptionsPluginOptions & {
  devServerEvents: EventEmitter
}

export interface CypressCTWebpackContext {
  _cypress: CypressCTOptionsPluginOptions
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
  private files: Cypress.Cypress['spec'][] = []
  private supportFile: string
  private errorEmitted = false

  private readonly projectRoot: string
  private readonly devServerEvents: EventEmitter
  private refreshCompile: boolean = false

  constructor (options: CypressCTOptionsPluginOptionsWithEmitter) {
    this.files = options.files
    this.supportFile = options.supportFile
    this.projectRoot = options.projectRoot
    this.devServerEvents = options.devServerEvents
  }

  private pluginFunc = (context: CypressCTWebpackContext) => {
    context._cypress = {
      files: this.files,
      projectRoot: this.projectRoot,
      supportFile: this.supportFile,
    }
  };

  private setupCustomHMR = (compiler: Compiler) => {
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

    compiler.hooks.done.tap(
      'CypressCTOptionsPlugin',
      () => {
        this.refreshCompile = true
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
      if (_.isEqual(specs, this.files)) return

      this.files = specs
      const inputFileSystem = compilation.inputFileSystem
      const utimesSync: UtimesSync = semver.gt('4.0.0', webpack.version) ? inputFileSystem.fileSystem.utimesSync : fs.utimesSync

      utimesSync(path.resolve(__dirname, 'browser.js'), new Date(), new Date())
    })

    // Webpack 5
    /* istanbul ignore next */
    if ('NormalModule' in webpack) {
      webpack.NormalModule.getCompilationHooks(compilation).loader.tap(
        'CypressCTOptionsPlugin',
        (context) => this.pluginFunc(context as CypressCTWebpackContext),
      )

      return
    }

    // Webpack 4
    compilation.hooks.normalModuleLoader.tap(
      'CypressCTOptionsPlugin',
      (context) => this.pluginFunc(context as CypressCTWebpackContext),
    )

    compilation.hooks.succeedModule.tap(
      'CypressCTOptionsPlugin',
      (module) => {
        // only run refreshes after first compile is done
        if (this.refreshCompile) {
          this.sendSuccessEventIfSpecRecursively(module)
        }
      },
    )
  };

  apply (compiler: Compiler): void {
    this.setupCustomHMR(compiler)
    compiler.hooks.compilation.tap('CypressCTOptionsPlugin', (compilation) => this.plugin(compilation as Webpack45Compilation))
  }

  /**
   * If the current module is in the spec list,
   * send a `dev-server:compile:success` event.
   * If it is not try its issuer
   * @param module
   */
  sendSuccessEventIfSpecRecursively (module: Module) {
    const identifier = module.identifier()

    if (this.supportFile && identifier.endsWith(this.supportFile)) {
      this.devServerEvents.emit('dev-server:compile:success')

      return
    }

    const updatedSpecFile = this.files.find((file) => identifier.endsWith(file.absolute))

    if (updatedSpecFile) {
      this.devServerEvents.emit('dev-server:compile:success', { specFile: updatedSpecFile.absolute })
    }

    const issuer = module.issuer

    // if we are not an entry point
    if (issuer) {
      this.sendSuccessEventIfSpecRecursively(issuer)
    }
  }
}
