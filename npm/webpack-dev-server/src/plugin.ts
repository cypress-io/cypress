import webpack, { Compiler, compilation, Plugin } from 'webpack'
import { EventEmitter } from 'events'
import _ from 'lodash'
import semver from 'semver'
import fs, { PathLike } from 'fs'
import path from 'path'

type UtimesSync = (path: PathLike, atime: string | number | Date, mtime: string | number | Date) => void

interface CypressOptions {
  files: any[]
  projectRoot: string
  devserverEvents?: EventEmitter
}

interface CypressCTWebpackContext extends compilation.Compilation {
  _cypress: CypressOptions
}

export default class CypressCTOptionsPlugin implements Plugin {
  private files: string[] = []
  private readonly projectRoot: string
  private readonly devserverEvents: EventEmitter

  constructor (options: CypressOptions) {
    this.files = options.files
    this.projectRoot = options.projectRoot
    this.devserverEvents = options.devserverEvents
  }

  private pluginFunc = (context: CypressCTWebpackContext, module: compilation.Module) => {
    context._cypress = {
      files: this.files,
      projectRoot: this.projectRoot,
    }
  };

  /**
   *
   * @param compilation webpack 4 `compilation.Compilation`, webpack 5
   *   `Compilation`
   */
  private plugin = (compilation: compilation.Compilation) => {
    this.devserverEvents.on('devserver:specs:changed', (specs) => {
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
    compiler.hooks.compilation.tap('CypressCTOptionsPlugin', this.plugin)
    compiler.hooks.compilation.tap('afterEmit', () => {
      console.log('AFTER EMIT')
    })
  }
}
