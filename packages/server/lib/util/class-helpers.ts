const propertyGetterNameRe = /\.get\s(.+?)\s/

class AnyClass {}

export function ensureProp<T> (this: AnyClass, prop: T | undefined, methodSetter): T {
  if (!prop) {
    const obj = {} as Error

    Error.captureStackTrace(obj, ensureProp)
    const propertyGetterStackLine = obj.stack!.split('\n')[1]
    const matched = propertyGetterStackLine.match(propertyGetterNameRe)
    const propName = matched && matched[1]

    throw new Error(`${this.constructor.name}#${methodSetter} must first be called before accessing 'this.${propName}'`)
  }

  return prop
}
