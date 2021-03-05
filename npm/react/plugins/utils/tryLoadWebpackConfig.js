// @ts-check
const debug = require('debug')('@cypress/react')

/** @type {(configPath: string) => null | import('webpack').Configuration } */
module.exports = function tryLoadWebpackConfig (webpackConfigPath) {
  debug('trying to load webpack config from %s', webpackConfigPath)
  // Do this as the first thing so that any code reading it knows the right env.
  const envName = 'test'

  // @ts-expect-error override env is possible
  process.env.NODE_ENV = envName
  process.env.BABEL_ENV = envName

  try {
    let webpackOptions = require(webpackConfigPath)

    if (webpackOptions.default) {
      // we probably loaded TS file
      debug('loaded webpack options has .default - taking that as the config')
      webpackOptions = webpackOptions.default
    }

    if (typeof webpackOptions === 'function') {
      debug('calling webpack function with environment "%s"', envName)
      webpackOptions = webpackOptions('development')
    }

    debug('webpack options: %o', webpackOptions)

    return webpackOptions
  } catch (err) {
    debug('could not load react-scripts webpack')
    debug('error %s', err.message)
    debug(err)

    console.error(err)

    return null
  }
}
