import { isFunction, isSymbol } from 'lodash'

/**
 * serialize. Used for serializing subject to be returned from subdomains to the primary domain.
 * @param value any object to be serialized.
 * @returns the serialized object as a string or undefined, if the object cannot be serialized.
 */
const serialize = (value: any): string => {
  let serializedSubject: string = undefined!

  try {
    serializedSubject = JSON.stringify(value, (key, value) => {
      // If we encounter any unserializable values we want to abort the whole process.
      if (isFunction(value) || isSymbol(value) || value === undefined) {
        throw 'abort serialization'
      }

      return value
    })
  } catch (error) {
    // we only want to silence serialization errors.
    if (error !== 'abort serialization') {
      throw error
    }
  }

  return serializedSubject
}

/**
 * deserialize. Companion to the above serialize function.
 * @param value a string
 * @returns the deserialized object
 */
const deserialize = (value: string|undefined): string|object|boolean|number|null|any[] => {
  return value ? JSON.parse(value) : value
}

export { serialize, deserialize }
