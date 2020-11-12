const debug = require('debug')('cypress:evergreen:webpack')
const path = require('path')
const webpack = require('webpack')
const webpackDevServer = require('webpack-dev-server')
const globby = require('globby')
const { merge } = require('webpack-merge')

async function getFiles (glob) {
  let files = await globby(
    glob,
    {
      absolute: true,
      onlyFiles: true,
      objectMode: true,
      ignore: ['node_modules'],
    },
  )

  debug(`Files`, files)

  files = files.map((f) => ({ path: f.path, absolute: path.resolve(f.path) }))

  debug(`Found files`, files)

  return files
}

async function resolveWebpackConfig (userWebpackConfig = {}, { componentSupportFile, testPattern, projectRoot, files, support }) {
  componentSupportFile = '/Users/jess/projects/cypress/core/tr1/cypress/npm/evergreen/examples/webpack-vue-cli/component-helpers.js'
  debug(`User passed in webpack config with values`, userWebpackConfig)

  const evergreenWebpackConfig = require('./webpack.config')

  debug(`Merging Evergreen's webpack config with users'`)

  debug(`Test files pattern`, testPattern)
  debug(`Support files`, componentSupportFile)
  files = files ? files : await getFiles(testPattern)
  support = support ? support : (await getFiles(path.resolve(componentSupportFile)))[0]

  debug(`New webpack entries`, files)

  const entry = path.resolve(__dirname, '../../plugins/webpack-client.js')

  debug({ entry })

  const entryValLoader = {
    test: /bundle-specs.js$/,
    use: [
      {
        loader: 'val-loader',
        options: {
          support,
          files,
          projectRoot,
        },
      },
    ],
  }

  const vueDocgenLoader = {
    test: /\.vue$/,
    use: 'vue-docgen-loader',
    enforce: 'post'
  }

  const dynamicWebpackConfig = {
    module: {
      rules: [
        entryValLoader,
        vueDocgenLoader
      ],
    },
  }

  const mergedConfig = merge(userWebpackConfig, evergreenWebpackConfig, dynamicWebpackConfig)

  mergedConfig.entry = { entry }

  return mergedConfig
}

// files, support, projectRoot
async function start (userWebpackConfig = {}, testConfig) {
  const webpackConfig = await resolveWebpackConfig(userWebpackConfig, testConfig)
  const compiler = webpack(webpackConfig)

  return new webpackDevServer(compiler, { hot: true })
}

if (require.main === module) {
  start()
}

module.exports = start
