import { isFunction, isSymbol } from 'lodash'

const serialize = (value: any): string => {
  let serializedSubject: string = undefined!

  try {
    serializedSubject = JSON.stringify(value, (key, value) => {
      // If we encounter any unserializable values we want to bail on the whole process.
      if (isFunction(value) || isSymbol(value) || value === undefined) {
        throw 'cannot serialize'
      }

      return value
    })
  } catch {
    console.log('failed to serialize Subject')
    // whateves
  }

  return serializedSubject
}

const deserialize = (value: string|undefined): string|object|boolean|number|null|any[] => {
  return value ? JSON.parse(value) : value
}

export { serialize, deserialize }
