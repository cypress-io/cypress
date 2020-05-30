// @ts-check
const webpackPreprocessor = require('@cypress/webpack-preprocessor')

// Cypress Webpack preprocessor includes Babel env preset,
// but to transpile JSX code we need to add Babel React preset
module.exports = (on, config) => {
  // @ts-ignore
  const opts = webpackPreprocessor.defaultOptions
  const babelLoader = opts.webpackOptions.module.rules[0].use[0]

  // add React preset to be able to transpile JSX
  babelLoader.options.presets.push(require.resolve('@babel/preset-react'))

  // We can also push Babel istanbul plugin to instrument the code on the fly
  // and get code coverage reports from component tests (optional)
  if (!babelLoader.options.plugins) {
    babelLoader.options.plugins = []
  }
  babelLoader.options.plugins.push(require.resolve('babel-plugin-istanbul'))

  // in order to mock named imports, need to include a plugin
  babelLoader.options.plugins.push([
    require.resolve('@babel/plugin-transform-modules-commonjs'),
    {
      loose: true,
    },
  ])

  // add code coverage plugin
  require('@cypress/code-coverage/task')(on, config)

  on('file:preprocessor', webpackPreprocessor(opts))

  // if adding code coverage, important to return updated config
  return config
}
