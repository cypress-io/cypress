const DIGITS = 3
const SEPARATOR = '-'

const get = (): string => {
  return SEPARATOR + Math.random().toFixed(DIGITS).slice(2, 5)
}

const _hasCacheBuster = (str: string): boolean => {
  return str.split('').slice(-4, -3).join('') === SEPARATOR
}

const strip = (str: string | string[] | undefined | any): string => {
  if (!str) {
    return ''
  }

  // Handle Express query params which can be ParsedQs objects
  const strValue = Array.isArray(str)
    ? String(str[0])
    : typeof str === 'string'
      ? str
      : String(str)

  if (_hasCacheBuster(strValue)) {
    return strValue.slice(0, -4)
  }

  return strValue
}

export { get, strip }

export default {
  get,
  strip,
}

module.exports = {
  get,
  strip,
}
