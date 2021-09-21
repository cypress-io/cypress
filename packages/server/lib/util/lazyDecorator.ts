/**
 * A lazy decorator means the value is lazily evaluated once and
 * the result is cached on the class instance.
 */
export const lazy = <T>(
  target: T,
  key: PropertyKey,
  descriptor: PropertyDescriptor,
): void => {
  if (!descriptor) {
    descriptor = Object.getOwnPropertyDescriptor(
      target,
      key,
    ) as PropertyDescriptor
  }

  const originalMethod = descriptor.get
  const isStatic = Object.getPrototypeOf(target) === Function.prototype

  if (isStatic) {
    throw new Error(`Don't use @lazy decorator on static properties`)
  }

  if (!originalMethod) {
    throw new Error('@lazy can only decorate getters!')
  } else if (!descriptor.configurable) {
    throw new Error('@lazy target must be configurable')
  } else {
    descriptor.get = function () {
      // eslint-disable-next-line
      const value = originalMethod.apply(this, arguments as any)
      const newDescriptor: PropertyDescriptor = {
        configurable: false,
        enumerable: false,
        value,
      }

      Object.defineProperty(this, key, newDescriptor)

      return value
    }
  }
}
