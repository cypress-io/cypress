// Since we are linking the `@cypress/webpack-preprocessor` package,
// `require('webpack')` will resolve the version found in our repo (v4).
// We need to override the webpack require to point to the local node_modules
const Module = require('module')

const originalModuleLoad = Module._load

Module._load = function (request, parent, isMain) {
  if (request === 'webpack' || request.startsWith('webpack/')) {
    const resolvePath = require.resolve(request, {
      paths: [__dirname],
    })

    return originalModuleLoad(resolvePath, parent, isMain)
  }

  return originalModuleLoad(request, parent, isMain)
}

const { defineConfig } = require('cypress')
const wp = require('@cypress/webpack-preprocessor')

module.exports = defineConfig({
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      on('file:preprocessor', wp({
        webpackOptions: {
          module: {
            rules: [
              {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                  loader: 'babel-loader',
                  options: {
                    presets: [
                      ['@babel/preset-env', { targets: 'defaults' }],
                    ],
                    plugins: ['@babel/plugin-transform-runtime'],
                  },
                },
              },
            ],
          },
        },
      }))
    },
  },
})
