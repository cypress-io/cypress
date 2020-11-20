import * as webpack from 'webpack'

interface CypressOptions {
  files: any[]
}

type CypressCTWebpackContext = {
  _cypress: CypressOptions
} & webpack.compilation.Compilation

export default class CypressCTOptionsPlugin implements webpack.WebpackPluginInstance {
  private readonly files: any[] = []

  public constructor(options) {
    this.files = options.files
  }

  private pluginFunc = (context: CypressCTWebpackContext, module) => {
    if (!module.resource) {
      return
    }

    context._cypress = { files: this.files }
  };

  /**
   *
   * @param compilation webpack 4 `compilation.Compilation`, webpack 5
   *   `Compilation`
   */
  private plugin = (compilation: any) => {
    // Webpack 5
    /* istanbul ignore next */
    if ('NormalModule' in webpack) {
      // @ts-ignore
      webpack.NormalModule.getCompilationHooks(compilation).loader.tap(
        'CypressCTOptionsPlugin',
        this.pluginFunc as any
      )

      return
    }

    // Webpack 4
    (compilation as webpack.compilation.Compilation).hooks.normalModuleLoader.tap(
      'CypressCTOptionsPlugin',
      this.pluginFunc as any
    )
  };

  apply (compiler: webpack.Compiler): void {
    const files = this.files

    console.log('i think the files are', files)

    compiler.hooks.compilation.tap('CypressCTOptionsPlugin', this.plugin)
  }
}
