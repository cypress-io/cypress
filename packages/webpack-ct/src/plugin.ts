import * as webpack from 'webpack'
import { EventEmitter } from 'events'
import _ from 'lodash'

interface CypressOptions {
  files: any[]
  projectRoot: string
  devserverEvents?: EventEmitter
}

type CypressCTWebpackContext = {
  _cypress: CypressOptions
} & webpack.compilation.Compilation

export default class CypressCTOptionsPlugin implements webpack.WebpackPluginInstance {
  private readonly files: any[] = []
  private readonly projectRoot: string
  private readonly devserverEvents: EventEmitter

  constructor (options: CypressOptions) {
    this.files = options.files
    this.projectRoot = options.projectRoot
    this.devserverEvents = options.devserverEvents
  }

  private pluginFunc = (context: CypressCTWebpackContext, module) => {
    if (!module.resource) {
      return
    }

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
  private plugin = (compilation) => {
    this.devserverEvents.on('devserver:specs:changed', (specs) => {
      if (_.isEqual(specs, this.files)) return

      // add specs
      // trigger the loader.ts with new files to serve
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
    (compilation as webpack.compilation.Compilation).hooks.normalModuleLoader.tap(
      'CypressCTOptionsPlugin',
      this.pluginFunc,
    )
  };

  apply (compiler: webpack.Compiler): void {
    compiler.hooks.compilation.tap('CypressCTOptionsPlugin', this.plugin)
  }
}
