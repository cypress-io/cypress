// Since we are linking the `@cypress/webpack-batteries-included-preprocessor` package,
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
const wbip = require('@cypress/webpack-batteries-included-preprocessor')

module.exports = defineConfig({
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      on('file:preprocessor', wbip())
    },
  },
})
