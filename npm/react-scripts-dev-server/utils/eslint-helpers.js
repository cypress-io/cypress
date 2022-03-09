const debug = require('debug')('@cypress/react')

const addCypressToWebpackEslintRulesInPlace = (webpackOptions) => {
  const globalsToAdd = ['cy', 'Cypress', 'before', 'after', 'context']

  if (webpackOptions.module && Array.isArray(webpackOptions.module.rules)) {
    const modulePre = webpackOptions.module.rules.find(
      (rule) => rule.enforce === 'pre',
    )

    if (modulePre && Array.isArray(modulePre.use)) {
      debug('found Pre block %o', modulePre)

      const useEslintLoader = modulePre.use.find(
        (use) => use.loader && use.loader.includes('eslint-loader'),
      )

      if (useEslintLoader) {
        debug('found useEslintLoader %o', useEslintLoader)

        if (useEslintLoader.options) {
          if (Array.isArray(useEslintLoader.options.globals)) {
            debug(
              'adding cy to existing globals %o',
              useEslintLoader.options.globals,
            )

            useEslintLoader.options.globals.push(...globalsToAdd)
          } else {
            debug('setting new list of globals with cy and Cypress')
            useEslintLoader.options.globals = globalsToAdd
          }

          debug('updated globals %o', useEslintLoader.options.globals)
        } else {
          debug('eslint loader does not have options ⚠️')
        }
      }
    }
  }
}

module.exports = { addCypressToWebpackEslintRulesInPlace }
