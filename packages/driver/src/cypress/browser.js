const _ = require('lodash')
const $utils = require('./utils')
const $errUtils = require('./error_utils')

const _isBrowser = (browser, matcher, errPrefix) => {
  let isMatch
  let exclusive = false

  const matchWithExclusion = (objValue, srcValue) => {
    if (srcValue.startsWith('!')) {
      exclusive = true

      return objValue !== srcValue.slice(1)
    }

    return objValue === srcValue
  }

  if (_.isString(matcher)) {
    const name = matcher.toLowerCase()
    const currentName = browser.name.toLowerCase()

    isMatch = matchWithExclusion(currentName, name)
  } else if (_.isObject(matcher)) {
    isMatch = _.isMatchWith(browser, matcher, matchWithExclusion)
  } else {
    $errUtils.throwErrByPath('browser.invalid_arg', {
      args: { prefix: errPrefix, obj: $utils.stringify(matcher) },
    })
  }

  return {
    isMatch,
    exclusive,
  }
}

const isBrowser = (config, obj = '', errPrefix = '`Cypress.isBrowser()`') => {
  return _
  .chain(obj)
  .concat([])
  .map((matcher) => _isBrowser(config.browser, matcher, errPrefix))
  .reduce((a, b) => {
    if (!a) return b

    if (a.exclusive && b.exclusive) {
      return {
        isMatch: a.isMatch && b.isMatch,
        exclusive: true,
      }
    }

    return {
      isMatch: a.isMatch || b.isMatch,
      exclusive: b.exclusive,
    }
  }, null)
  .thru((result) => {
    return Boolean(result) && result.isMatch
  })
  .value()
}

module.exports = (config) => {
  return {
    browser: config.browser,
    isBrowser: _.partial(isBrowser, config),
  }
}
