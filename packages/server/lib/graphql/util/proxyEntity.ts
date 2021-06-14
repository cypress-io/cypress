export interface ProxyableEntity<T> {
  data: T
}

/**
 * Takes an entity class with a "config" object as a property, and returns a
 * proxy for that class which looks up the entity if the class hasn't defined
 * an override
 *
 * @param obj
 * @returns
 */
export function proxyEntity<T extends object, O extends ProxyableEntity<T>> (obj: O): O {
  return new Proxy(obj, {
    get (target, key) {
      if (Reflect.has(target, key) || !Reflect.has(target.data, key)) {
        return Reflect.get(target, key)
      }

      return Reflect.get(target.data, key)
    },
  })
}
