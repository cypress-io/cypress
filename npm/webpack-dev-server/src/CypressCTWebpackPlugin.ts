import type { Compiler, Compilation } from 'webpack'
import type webpack from 'webpack'
import type { EventEmitter } from 'events'
import _ from 'lodash'
import fs, { PathLike } from 'fs-extra'
import path from 'path'

type UtimesSync = (path: PathLike, atime: string | number | Date, mtime: string | number | Date) => void

export interface CypressCTWebpackPluginOptions {
  files: Cypress.Cypress['spec'][]
  projectRoot: string
  supportFile: string | false
  devServerEvents: EventEmitter
  webpack: Function
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

  private readonly projectRoot: string
  private readonly devServerEvents: EventEmitter

  constructor (options: CypressCTWebpackPluginOptions) {
    this.files = options.files
    this.supportFile = options.supportFile
    this.projectRoot = options.projectRoot
    this.devServerEvents = options.devServerEvents
    this.webpack = options.webpack
  }

  private addLoaderContext = (loaderContext: object, module: any) => {
    (loaderContext as CypressCTWebpackContext)._cypress = {
      files: this.files,
      projectRoot: this.projectRoot,
      supportFile: this.supportFile,
    }
  };

  private beforeCompile = async (compilationParams: object, callback: Function) => {
    if (!this.compilation) {
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

    this.files = foundFiles.filter((file) => file !== null) as Cypress.Spec[]

    callback()
  }

  /*
   * `webpack --watch` watches the existing specs and their dependencies for changes,
   * but we also need to add additional dependencies to our dynamic "browser.js" (generated
   * using loader.ts) when new specs are created. This hook informs webpack that browser.js
   * has been "updated on disk", causing a recompliation (and pulling the new specs in as
   * dependencies).
   */
  private onSpecsChange = async (specs: Cypress.Cypress['spec'][]) => {
    if (!this.compilation || _.isEqual(specs, this.files)) {
      return
    }

    this.files = specs
    const inputFileSystem = this.compilation.inputFileSystem
    // TODO: don't use a sync fs method here
    // eslint-disable-next-line no-restricted-syntax
    const utimesSync: UtimesSync = inputFileSystem.fileSystem.utimesSync ?? fs.utimesSync

    utimesSync(path.resolve(__dirname, 'browser.js'), new Date(), new Date())
  }

  /**
   * The webpack compiler generates a new `compilation` each time it compiles, so
   * we have to apply hooks to it fresh each time
   *
   * @param compilation webpack 4 `compilation.Compilation`, webpack 5
   *   `Compilation`
   */
  private addCompilationHooks = (compilation: Webpack45Compilation) => {
    this.compilation = compilation

    /* istanbul ignore next */
    if ('NormalModule' in this.webpack) {
      // Webpack 5
      const loader = (this.webpack as typeof webpack).NormalModule.getCompilationHooks(compilation).loader

      loader.tap('CypressCTPlugin', this.addLoaderContext)
    } else {
      // Webpack 4
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
      this.devServerEvents.emit('dev-server:compile:success')
    })
  }
}
