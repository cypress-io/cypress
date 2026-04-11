import { origin } from '@packages/network-tools'

export const hideKeys = (token?: string | number | boolean) => {
  if (!token) {
    return
  }

  if (typeof token !== 'string') {
    // maybe somehow we passes key=true?
    // https://github.com/cypress-io/cypress/issues/14571
    return
  }

  return [
    token.slice(0, 5),
    token.slice(-5),
  ].join('...')
}

export function setUrls (obj: any) {
  obj = { ...obj }

  // TODO: rename this to be proxyServer
  const proxyUrl = `http://localhost:${obj.port}`

  const rootUrl = obj.baseUrl
    ? origin(obj.baseUrl)
    : proxyUrl

  return {
    ...obj,
    proxyUrl,
    browserUrl: rootUrl + obj.clientRoute,
    reporterUrl: rootUrl + obj.reporterRoute,
  }
}

// https://github.com/cypress-io/cypress/issues/6810
const toArray = (value: any) => {
  const valueIsNotStringOrArray = typeof (value) !== 'string' || (value[0] !== '[' && value[value.length - 1] !== ']')

  if (valueIsNotStringOrArray) {
    return
  }

  // '[foo,bar]' => ['foo', 'bar']
  const convertStringToArray = () => value.substring(1, value.length - 1).split(',')
  const arr = convertStringToArray()

  // The default `toString` array method returns one string containing each array element separated
  // by commas, but without '[' or ']'. If an environment variable is intended to be an array, it
  // will begin and end with '[' and ']' respectively. To correctly compare the value argument to
  // the value in `process.env`, the `toString` method must be updated to include '[' and ']'.
  // Default `toString()` on array: ['foo', 'bar'].toString() => 'foo,bar'
  // Custom `toString()` on array: ['foo', 'bar'].toString() => '[foo,bar]'
  arr.toString = () => `[${arr.join(',')}]`

  return arr
}

// https://github.com/cypress-io/cypress/issues/8818
// toArray() above doesn't handle JSON string properly.
// For example, '[{a:b,c:d},{e:f,g:h}]' isn't the parsed object but ['{a:b', 'c:d}', '{e:f', 'g:h}']. It's useless.
// Because of that, we check if the value is a JSON string.
const fromJson = (value: string) => {
  try {
    return JSON.parse(value)
  } catch (e) {
    // do nothing
  }
}

const toBooleanStrict = (value: string): boolean | undefined => {
  if (value === 'true') return true

  if (value === 'false') return false

  return undefined
}

export const coerce = (value: any) => {
  const num = Number(value)

  if (num?.toString?.() === value) {
    return num
  }

  const bool = toBooleanStrict(value)

  if (bool?.toString?.() === value) {
    return bool
  }

  const obj = fromJson(value)

  if (obj && typeof obj === 'object') {
    return obj
  }

  const arr = toArray(value)

  if (arr?.toString?.() === value) {
    return arr
  }

  return value
}

export const isResolvedConfigPropDefault = (config: Record<string, any>, prop: string) => {
  return config.resolved[prop].from === 'default'
}
