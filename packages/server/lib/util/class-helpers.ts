const propertyGetterNameRe = /\.get\s(.+?)\s/

export function ensureProp<C extends {constructor: {name: string}}, T> (this: C, prop: T | undefined, methodSetter: keyof C): T {
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
