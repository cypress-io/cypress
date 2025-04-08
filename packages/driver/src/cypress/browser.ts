import _ from 'lodash'
import $utils from './utils'
import $errUtils from './error_utils'

const _isBrowser = (browser, matcher, errPrefix) => {
  let isMatch
  let exclusive = false

  const matchWithExclusion = (objValue, srcValue) => {
    if (_.isString(srcValue) && srcValue.startsWith('!')) {
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

const isBrowser = (config, obj: Cypress.IsBrowserMatcher = '', errPrefix: string = '`Cypress.isBrowser()`') => {
  return _
  .chain(obj)
  .concat([])
  .map((matcher) => _isBrowser(config.browser, matcher, errPrefix))
  .reduce((
    a: null | { isMatch: boolean, exclusive: boolean },
    b: { isMatch: boolean, exclusive: boolean },
  ) => {
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

export default (config) => {
  return {
    browser: config.browser,
    isBrowser: _.partial(isBrowser, config),
    browserMajorVersion: () => config.browser.majorVersion,
  }
}
