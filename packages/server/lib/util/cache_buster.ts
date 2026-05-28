export const SEPARATOR = '-'

export const strip = (str: string) => {
  if (_hasCacheBuster(str)) {
    return str.slice(0, -4)
  }

  return str
}

const _hasCacheBuster = (str: string) => {
  return str.split('').slice(-4, -3).join('') === SEPARATOR
}
