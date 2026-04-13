import $utils from './utils'
import $errUtils from './error_utils'

const isMatchWith = (obj: Record<string, any>, source: Record<string, any>, customizer: (objValue: any, srcValue: any) => boolean): boolean => {
  for (const key of Object.keys(source)) {
    if (!customizer(obj[key], source[key])) {
      return false
    }
  }

  return true
}

const _isBrowser = (browser, matcher, errPrefix) => {
  let isMatch
  let exclusive = false

  const matchWithExclusion = (objValue, srcValue) => {
    if (typeof srcValue === 'string' && srcValue.startsWith('!')) {
      exclusive = true

      return objValue !== srcValue.slice(1)
    }

    return objValue === srcValue
  }

  if (typeof matcher === 'string') {
    const name = matcher.toLowerCase()
    const currentName = browser.name.toLowerCase()

    isMatch = matchWithExclusion(currentName, name)
  } else if (matcher !== null && typeof matcher === 'object') {
    isMatch = isMatchWith(browser, matcher, matchWithExclusion)
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
  const matchers = ([] as any[]).concat(obj)

  const result = matchers
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

  return Boolean(result) && result.isMatch
}

export default (config) => {
  return {
    browser: config.browser,
    isBrowser: (obj?: Cypress.IsBrowserMatcher, errPrefix?: string) => isBrowser(config, obj, errPrefix),
    browserMajorVersion: () => config.browser.majorVersion,
  }
}
