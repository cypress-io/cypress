// Values cross between the spec and the AUT as JSON, matching the recorder the server
// installs in the AUT: undefined and functions are tagged so they survive the trip.
type Tagged = { __cypressRemote: 'undefined' } | { __cypressRemote: 'function', name: string }

const isTagged = (value: unknown): value is Tagged => {
  return typeof value === 'object' && value !== null && typeof Reflect.get(value, '__cypressRemote') === 'string'
}

export const toPageValue = (value: unknown): unknown => {
  if (value === undefined) {
    return { __cypressRemote: 'undefined' }
  }

  if (typeof value === 'function') {
    return { __cypressRemote: 'function', name: value.name }
  }

  if (Array.isArray(value)) {
    return value.map(toPageValue)
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toPageValue(item)]))
  }

  return value
}

export const fromPageValue = (value: unknown): unknown => {
  if (isTagged(value)) {
    if (value.__cypressRemote === 'function') {
      // a placeholder that keeps the function's name, so sinon.match.func and messages still work
      return Object.defineProperty(function () {}, 'name', { value: value.name })
    }

    return undefined
  }

  if (Array.isArray(value)) {
    return value.map(fromPageValue)
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, fromPageValue(item)]))
  }

  return value
}

export const toPageError = (error: unknown) => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message }
  }

  return typeof error === 'string' ? { name: error, message: error } : { message: String(error) }
}
