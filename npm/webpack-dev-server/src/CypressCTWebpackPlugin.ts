import type { Compiler, Compilation } from 'webpack'
import type webpack from 'webpack'
import type { EventEmitter } from 'events'
import _ from 'lodash'
import fs from 'fs-extra'
import path from 'path'

interface CypressCTWebpackPluginOptions {
  files: Cypress.Cypress['spec'][]
  projectRoot: string
  supportFile: string | false
  devServerEvents: EventEmitter
  webpack: Function
  indexHtmlFile: string
  isRunMode?: boolean
}

type CypressCTContextOptions = Omit<CypressCTWebpackPluginOptions, 'devServerEvents' | 'webpack' | 'isRunMode'>

export interface CypressCTWebpackContext {
  _cypress: CypressCTContextOptions
}

/**
 * A webpack 5 compatible Cypress Component Testing Plugin
 *
 * @internal
 */
export class CypressCTWebpackPlugin {
  private files: Cypress.Cypress['spec'][] = []
  private supportFile: string | false
  private compilation: Compilation | null = null
  private compiler: Compiler | null = null
  private webpack: Function
  private indexHtmlFile: string

  private readonly projectRoot: string
  private readonly devServerEvents: EventEmitter
  private readonly isRunMode: boolean

  constructor (options: CypressCTWebpackPluginOptions) {
    this.files = options.files
    this.supportFile = options.supportFile
    this.projectRoot = options.projectRoot
    this.devServerEvents = options.devServerEvents
    this.webpack = options.webpack
    this.indexHtmlFile = options.indexHtmlFile
    this.isRunMode = options.isRunMode ?? false
  }

  private addLoaderContext = (loaderContext: object, module: any) => {
    (loaderContext as CypressCTWebpackContext)._cypress = {
      files: this.files,
      projectRoot: this.projectRoot,
      supportFile: this.supportFile,
      indexHtmlFile: this.indexHtmlFile,
    }
  }

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
   * The spec entry is built by a non-cacheable loader that reads `this.files`, so any new
   * compilation picks up the updated spec list. This hook only has to start one.
   *
   * In run mode, the compile is started in memory through the compiler's `Watching`. Run mode
   * with `justInTimeCompile` changes the spec list before every spec, and `component-index.html`
   * is shared by every Cypress process on the machine, so touching it would make each
   * process's watcher recompile for specs it never asked for.
   *
   * In open mode, `component-index.html` is marked as "updated on disk" instead, which makes
   * the file watcher recompile and pull newly created specs in as dependencies. The component
   * index file is used because it is always present in a Component Testing project and sits
   * outside the Cypress application bundle, which macOS Ventura will not let us write to.
   *
   * See https://github.com/cypress-io/cypress/issues/24398
   */
  private onSpecsChange = async ({ specs, options }: { specs: Cypress.Cypress['spec'][], options?: { neededForJustInTimeCompile: boolean}}) => {
    if (!this.compilation || _.isEqual(specs, this.files)) {
      return
    }

    this.files = specs

    const watching = this.compiler?.watching

    if (this.isRunMode && watching) {
      watching.invalidate()

      return
    }

    const inputFileSystem = this.compilation.inputFileSystem
    // TODO: don't use a sync fs method here
    // eslint-disable-next-line no-restricted-syntax
    const utimesSync = (inputFileSystem as any).utimesSync ?? fs.utimesSync
    const indexHtmlFilePath = path.isAbsolute(this.indexHtmlFile) ? this.indexHtmlFile : path.join(this.projectRoot, this.indexHtmlFile)

    utimesSync(indexHtmlFilePath, new Date(), new Date())
  }

  /**
   * The webpack compiler generates a new `compilation` each time it compiles, so
   * we have to apply hooks to it fresh each time
   *
   * @param compilation webpack 5 `Compilation`
   */
  private addCompilationHooks = (compilation: Compilation) => {
    this.compilation = compilation

    const loader = (this.webpack as typeof webpack).NormalModule.getCompilationHooks(compilation).loader

    loader.tap('CypressCTPlugin', this.addLoaderContext)
  }

  /**
   * The plugin's entrypoint, called once by webpack when the compiler is initialized.
   */
  apply (compiler: unknown): void {
    const _compiler = compiler as Compiler

    this.compiler = _compiler
    this.devServerEvents.on('dev-server:specs:changed', this.onSpecsChange)
    _compiler.hooks.beforeCompile.tapAsync('CypressCTPlugin', this.beforeCompile)
    _compiler.hooks.compilation.tap('CypressCTPlugin', (compilation) => this.addCompilationHooks(compilation))
    _compiler.hooks.done.tap('CypressCTPlugin', () => {
      this.devServerEvents.emit('dev-server:compile:success')
    })
  }
}
