import * as webpack from 'webpack'

interface CypressOptions {
  files: any[]
  projectRoot: string
}

type CypressCTWebpackContext = {
  _cypress: CypressOptions
} & webpack.compilation.Compilation

export default class CypressCTOptionsPlugin implements webpack.WebpackPluginInstance {
  private readonly files: any[] = []
  private readonly projectRoot: string

  public constructor (options: CypressOptions) {
    this.files = options.files
    this.projectRoot = options.projectRoot
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
  private plugin = (compilation: any) => {
    debugger;
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
