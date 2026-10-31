const paths = new WeakMap<object, string[]>()

// keys Cypress, lodash and chai probe to classify a value, which must not look present
const PROBED_KEYS = new Set(['then', 'jquery', 'nodeType', 'toJSON', 'asymmetricMatch', '$$typeof', 'length', '_spreadArray'])

const create = (path: string[]): object => {
  const label = path.length ? `[AUT window].${path.join('.')}` : '[AUT window]'
  const target = {
    toString: () => label,
  }

  const proxy = new Proxy(target, {
    get (target, key) {
      if (typeof key === 'symbol' || PROBED_KEYS.has(key)) {
        return undefined
      }

      if (Object.prototype.hasOwnProperty.call(target, key)) {
        return Reflect.get(target, key)
      }

      return create([...path, key])
    },
  })

  paths.set(proxy, path)

  return proxy
}

// What cy.window() yields under the remote driver. The AUT's window is cross-origin to the
// spec, so this only records the property path it's read along, for cy.stub and cy.spy to target.
export const createRemoteWindow = () => create([])

export const getRemoteWindowPath = (value: unknown) => {
  return typeof value === 'object' && value !== null ? paths.get(value) : undefined
}
