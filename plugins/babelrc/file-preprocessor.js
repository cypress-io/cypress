// @ts-check
// uses webpack to load your .babelrc file
const debug = require('debug')('cypress-react-unit-test')
const webpackPreprocessor = require('@cypress/webpack-preprocessor')
const { addImageRedirect } = require('../utils/add-image-redirect')

const wpPreprocessorOptions = {
  ...webpackPreprocessor.defaultOptions,
}

wpPreprocessorOptions.webpackOptions.resolve = {
  extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
}

wpPreprocessorOptions.webpackOptions.module.rules[0].test = /\.(jsx|tsx|js|ts)?$/

// note: modifies the input object
function enableBabelrc(webpackOptions) {
  if (!Array.isArray(webpackOptions.module.rules)) {
    debug('could not find webpack module rules %o', webpackOptions.module)
    return
  }

  const jsCodeRule = webpackOptions.module.rules[0]
  debug('js code rule %o', jsCodeRule)
  if (!jsCodeRule) {
    debug('could not get first rule %o', webpackOptions.module)
    return
  }

  const jsCodeRuleUses = jsCodeRule.use
  if (!Array.isArray(jsCodeRuleUses)) {
    debug('js code rule use is not an array %o', jsCodeRuleUses)
    return
  }
  const babelLoaderOptions = jsCodeRuleUses[0].options
  debug('Babel options %o', babelLoaderOptions)
  if (!babelLoaderOptions) {
    debug('Hmm, no babel loader options %o', jsCodeRuleUses)
    return
  }

  // by deleting our default presets list
  // we allow Babel loader to load the presets and plugins
  // from the project's .babelrc file
  delete babelLoaderOptions.presets
  delete babelLoaderOptions.plugins

  debug('babel loader options %o', babelLoaderOptions)
}

module.exports = config => {
  debug('env object %o', config.env)

  debug('initial environments %o', {
    BABEL_ENV: process.env.BABEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
  })

  const nodeEnvironment = 'test'
  if (!process.env.BABEL_ENV) {
    debug('setting BABEL_ENV to %s', nodeEnvironment)
    process.env.BABEL_ENV = nodeEnvironment
  }
  if (!process.env.NODE_ENV) {
    debug('setting NODE_ENV to %s', nodeEnvironment)
    process.env.NODE_ENV = nodeEnvironment
  }

  debug('environments %o', {
    BABEL_ENV: process.env.BABEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
  })

  const coverageIsDisabled =
    config && config.env && config.env.coverage === false
  debug('coverage is disabled? %o', { coverageIsDisabled })

  enableBabelrc(wpPreprocessorOptions.webpackOptions)
  debug('webpack options %o', wpPreprocessorOptions.webpackOptions)

  addImageRedirect(wpPreprocessorOptions.webpackOptions)

  return webpackPreprocessor(wpPreprocessorOptions)
}
