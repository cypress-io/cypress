import _ from 'lodash'

const whitespaceRe = /\s+/g

export type MatcherFunction = (content: string, element: Element | null) => boolean

export type Matcher = string | RegExp | number | MatcherFunction

export type Normalizer = (text: string) => string

export interface MatchOptions {
  exact?: boolean
  normalizer?: Normalizer
}

export const defaultNormalizer: Normalizer = (text) => {
  return text.trim().replace(whitespaceRe, ' ')
}

export const identityNormalizer: Normalizer = (text) => text

export const isValidMatcher = (matcher: unknown): matcher is Matcher => {
  return _.isString(matcher) || _.isRegExp(matcher) || _.isFunction(matcher) || _.isFinite(matcher)
}

// A global or sticky regex keeps `lastIndex` between calls, which would make the
// same element match on one retry and fail on the next.
const matchRegExp = (matcher: RegExp, text: string) => {
  matcher.lastIndex = 0

  const matched = matcher.test(text)

  matcher.lastIndex = 0

  return matched
}

export const matches = (text: string | null | undefined, element: Element | null, matcher: Matcher, { exact = true, normalizer = defaultNormalizer }: MatchOptions = {}): boolean => {
  if (typeof text !== 'string') {
    return false
  }

  const normalizedText = normalizer(text)

  if (_.isFunction(matcher)) {
    return matcher(normalizedText, element)
  }

  if (_.isRegExp(matcher)) {
    return matchRegExp(matcher, normalizedText)
  }

  const expected = String(matcher)

  if (exact) {
    return normalizedText === expected
  }

  return normalizedText.toLowerCase().includes(expected.toLowerCase())
}

export const describeMatcher = (matcher: Matcher): string => {
  if (_.isFunction(matcher)) {
    return matcher.name ? `a function (${matcher.name})` : 'a function'
  }

  if (_.isRegExp(matcher)) {
    return String(matcher)
  }

  return `"${matcher}"`
}
