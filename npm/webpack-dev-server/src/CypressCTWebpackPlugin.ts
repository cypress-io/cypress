import type { Compiler, Compilation } from 'webpack'
import type webpack from 'webpack'
import type { EventEmitter } from 'events'
import _ from 'lodash'
import fs, { PathLike } from 'fs-extra'
import path from 'path'
import debugLib from 'debug'

const debug = debugLib('cypress:webpack-dev-server:CypressCTWebpackPlugin')
const debugVerbose = debugLib('cypress-verbose:webpack-dev-server:CypressCTWebpackPlugin')

type UtimesSync = (path: PathLike, atime: string | number | Date, mtime: string | number | Date) => void

export interface CypressCTWebpackPluginOptions {
  files: Cypress.Cypress['spec'][]
  projectRoot: string
  supportFile: string | false
  devServerEvents: EventEmitter
  webpack: Function
  indexHtmlFile: string
}

export type CypressCTContextOptions = Omit<CypressCTWebpackPluginOptions, 'devServerEvents' | 'webpack'>

export interface CypressCTWebpackContext {
  _cypress: CypressCTContextOptions
}

/**
 * @internal
 */
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

/**
 * A webpack 4/5 compatible Cypress Component Testing Plugin
 *
 * @internal
 */
export class CypressCTWebpackPlugin {
  private files: Cypress.Cypress['spec'][] = []
  private supportFile: string | false
  private compilation: Webpack45Compilation | null = null
  private webpack: Function
  private indexHtmlFile: string

  private readonly projectRoot: string
  private readonly devServerEvents: EventEmitter

  constructor (options: CypressCTWebpackPluginOptions) {
    this.files = options.files
    this.supportFile = options.supportFile
    this.projectRoot = options.projectRoot
    this.devServerEvents = options.devServerEvents
    this.webpack = options.webpack
    this.indexHtmlFile = options.indexHtmlFile
  }

  private addLoaderContext = (loaderContext: object, module: any) => {
    debugVerbose(`addLoaderContext for %j`, {
      files: this.files,
      projectRoot: this.projectRoot,
      supportFile: this.supportFile,
      indexHtmlFile: this.indexHtmlFile,
    })

    ;(loaderContext as CypressCTWebpackContext)._cypress = {
      files: this.files,
      projectRoot: this.projectRoot,
      supportFile: this.supportFile,
      indexHtmlFile: this.indexHtmlFile,
    }
  };

  private beforeCompile = async (compilationParams: object, callback: Function) => {
    debug('beforeCompile')
    debug(`beforeCompile projectRoot: ${this.projectRoot}`)
    debug(`beforeCompile supportFile: ${this.supportFile}`)
    debug(`beforeCompile indexHtmlFile: ${this.indexHtmlFile}`)
    debugVerbose(`beforeCompile files: %j`, this.files)
    debugVerbose(`beforeCompile params: %j`, compilationParams)
    if (!this.compilation) {
      debug('beforeCompile: compile hooks not registered. Invoking callback.')
      callback()

      return
    }

    // Ensure we don't try to load files that have been removed from the file system
    // but have not yet been detected by the onSpecsChange handler

    const foundFiles = (await Promise.all(this.files.map(async (file) => {
      try {
        const exists = await fs.pathExists(file.absolute)

        return exists ? file : null
      } catch (e) {
        return null
      }
    })))

    debug('beforeCompile: compile hooks registered, filtering out files that have been removed by the file system but not yet detected by the onSpecsChange handler')
    this.files = foundFiles.filter((file) => file !== null) as Cypress.Spec[]

    debug('invoking callback')
    callback()
  }

  /*
   * `webpack --watch` watches the existing specs and their dependencies for changes.
   * When new specs are created, we need to trigger a recompilation to add the new specs
   * as dependencies. This hook informs webpack that `component-index.html` has been "updated on disk",
   * causing a recompilation (and pulling the new specs in as dependencies). We use the component
   * index file because we know that it will be there since the project is using Component Testing.
   *
   * We were using `browser.js` before to cause a recompilation but we ran into an
   * issue with MacOS Ventura that will not allow us to write to files inside of our application bundle.
   *
   * See https://github.com/cypress-io/cypress/issues/24398
   */
  private onSpecsChange = async (specs: Cypress.Cypress['spec'][]) => {
    debug(`"dev-server:specs:changed" has been emitted. triggering onSpecsChange handler.`)
    // 'dev-server:specs:changed'
    if (!this.compilation || _.isEqual(specs, this.files)) {
      debug(`onSpecsChange: either compilation has not started (this.compilation = ${this.compilation}), or the specs have not changes because they are the same value (this.files unchanged? ${_.isEqual(specs, this.files)})`)
      debug('short circuiting onSpecsChange')

      return
    }

    debug(`has the spec list changed? ${!_.isEqual(specs, this.files)}`)
    this.files = specs
    const inputFileSystem = this.compilation.inputFileSystem
    // TODO: don't use a sync fs method here
    // eslint-disable-next-line no-restricted-syntax
    const utimesSync: UtimesSync = inputFileSystem.fileSystem.utimesSync ?? fs.utimesSync

    debug(`forcing timestamp update of the indexHtmlFile to trigger webpack watcher`)
    utimesSync(path.join(this.projectRoot, this.indexHtmlFile), new Date(), new Date())
  }

  /**
   * The webpack compiler generates a new `compilation` each time it compiles, so
   * we have to apply hooks to it fresh each time
   *
   * @param compilation webpack 4 `compilation.Compilation`, webpack 5
   *   `Compilation`
   */
  private addCompilationHooks = (compilation: Webpack45Compilation) => {
    debug('addCompilationHooks')
    this.compilation = compilation

    /* istanbul ignore next */
    if ('NormalModule' in this.webpack) {
      // Webpack 5
      debug('addCompilationHooks: Webpack 5 detected')
      const loader = (this.webpack as typeof webpack).NormalModule.getCompilationHooks(compilation).loader

      loader.tap('CypressCTPlugin', this.addLoaderContext)
    } else {
      // Webpack 4
      debug('addCompilationHooks: Webpack 4 detected')
      compilation.hooks.normalModuleLoader.tap('CypressCTPlugin', this.addLoaderContext)
    }
  };

  /**
   * The plugin's entrypoint, called once by webpack when the compiler is initialized.
   */
  apply (compiler: unknown): void {
    const _compiler = compiler as Compiler

    this.devServerEvents.on('dev-server:specs:changed', this.onSpecsChange)
    _compiler.hooks.beforeCompile.tapAsync('CypressCTPlugin', this.beforeCompile)
    _compiler.hooks.compilation.tap('CypressCTPlugin', (compilation) => this.addCompilationHooks(compilation as Webpack45Compilation))
    _compiler.hooks.done.tap('CypressCTPlugin', () => {
      debug('compiler hooks done. emitting "dev-server:compile:success" to start the runner')
      this.devServerEvents.emit('dev-server:compile:success')
    })
  }
}
