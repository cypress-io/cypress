const typescript = require('typescript')

const { createProgram } = typescript

// TODO:
// monkey patch typescript for now until we upgrade
// webpack preprocessor
typescript.createProgram = (...args) => {
  const [programOptions] = args
  const { options } = programOptions

  options.sourceMap = true
  delete options.inlineSources
  delete options.inlineSourceMap

  return createProgram.apply(typescript, args)
}

const wp = require('@cypress/webpack-preprocessor')

const webpackOptions = {
  // TODO: remove once we upgrade webpack preprocessor
  mode: 'development',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: [/node_modules/],
        use: {
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              // act as if this option is off
              sourceMap: false,
            },
          },
        },
      },
    ],
  },
}

module.exports = (on) => {
  on('file:preprocessor', wp({ webpackOptions }))
}
