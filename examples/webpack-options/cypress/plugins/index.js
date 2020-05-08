// @ts-check
const webpackPreprocessor = require('@cypress/webpack-preprocessor')

// Cypress Webpack preprocessor includes Babel env preset,
// but to transpile JSX code we need to add Babel React preset
module.exports = (on, config) => {
  // @ts-ignore
  const opts = webpackPreprocessor.defaultOptions
  // add React preset to be able to transpile JSX
  opts.webpackOptions.module.rules[0].use[0].options.presets.push(
    require.resolve('@babel/preset-react'),
  )
  on('file:preprocessor', webpackPreprocessor(opts))
}
