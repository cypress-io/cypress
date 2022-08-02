import _ from 'lodash'
import structuredClonePonyfill from 'core-js-pure/actual/structured-clone'
import $stackUtils from '../../cypress/stack_utils'
import $errUtils from '../../cypress/error_utils'

export const UNSERIALIZABLE = '__cypress_unserializable_value'

// If a native structuredClone exists, use that to determine if a value can be serialized or not. Otherwise, use the ponyfill.
// we need this because some implementations of SCA treat certain values as unserializable (ex: Error is serializable in ponyfill but NOT in firefox implementations)
// @ts-ignore
const structuredCloneRef = window?.structuredClone || structuredClonePonyfill

export const isSerializableInCurrentBrowser = (value: any) => {
  try {
    structuredCloneRef(value)

    // @ts-ignore
    if (Cypress.isBrowser('firefox') && _.isError(value) && structuredCloneRef !== window?.structuredClone) {
      /**
       * NOTE: structuredClone() was introduced in Firefox 94. Supported versions below 94 need to use the ponyfill
       * to determine whether or not a value can be serialized through postMessage. Since the ponyfill deems Errors
       * as clone-able, but postMessage does not in Firefox, we must make sure we do NOT attempt to send native errors through firefox
       */
      return false
    }

    // In some instances of structuredClone, Bluebird promises are considered serializable, but can be very deep objects
    // For ours needs, we really do NOT want to serialize these
    if (value instanceof Cypress.Promise) {
      return false
    }

    return true
  } catch (e) {
    return false
  }
}

/**
 * Walks the prototype chain and finds any serializable properties that exist on the object or its prototypes.
 * If the property can be serialized, the property is added to the literal.
 * This means read-only properties are now read/write on the literal.
 *
 * Please see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone for more details.
 * @param obj Object that is being converted
 * @returns a new object void of prototype chain (object literal) with all serializable properties
 */
const convertObjectToSerializableLiteral = (obj): typeof obj => {
  const allProps: string[] = []
  let currentObjectRef = obj

  do {
    const props = Object.getOwnPropertyNames(currentObjectRef)

    props.forEach((prop: string) => {
      try {
        if (!allProps.includes(prop) && isSerializableInCurrentBrowser(currentObjectRef[prop])) {
          allProps.push(prop)
        }
      } catch (err) {
      /**
       * In some browsers, properties of objects on the prototype chain point to the implementation object.
       * Depending on implementation constraints, these properties may throw an error when accessed.
       *
       * ex: DOMException's prototype is Error, and calling the 'name' getter on DOMException's prototype
       * throws a TypeError since Error does not implement the DOMException interface.
       */
        if (err?.name !== 'TypeError') {
          throw err
        }
      }
    })

    currentObjectRef = Object.getPrototypeOf(currentObjectRef)
  } while (currentObjectRef && currentObjectRef !== Object.prototype && currentObjectRef !== Date.prototype)

  const objectAsLiteral = {}

  allProps.forEach((key) => {
    objectAsLiteral[key] = obj[key]
  })

  return objectAsLiteral
}

/**
 * Sanitizes any unserializable values to prep for postMessage serialization. All Objects, including Errors, are mapped to an Object literal with
 * whatever serialization properties they have, including their prototype hierarchy.
 * This keeps behavior consistent between browsers without having to worry about the inner workings of structuredClone().
 *
 * This method takes a similar approach as the 'chromium' structuredClone algorithm, except that the prototype chain is walked and ANY serializable value, including getters, is serialized.
 * Please see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#things_that_dont_work_with_structured_clone.
 *
 *  NOTE: If an object nested inside valueToSanitize contains an unserializable property, the whole object is deemed as unserializable
 * @param valueToSanitize subject of sanitization that might be unserializable or have unserializable properties
 * @returns a serializable form of the subject. If the value passed in cannot be serialized, an error is thrown
 * @throws '__cypress_unserializable_value'
 */
export const preprocessForSerialization = <T>(valueToSanitize: { [key: string]: any }): T | undefined => {
// Even if native errors can be serialized through postMessage, many properties are omitted on structuredClone(), including prototypical hierarchy
// because of this, we preprocess native errors to objects and postprocess them once they come back to the primary origin

  // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays. This is important for commands like .selectFile() using buffer streams
  if (_.isArray(valueToSanitize) || _.isTypedArray(valueToSanitize)) {
    return _.map(valueToSanitize, preprocessForSerialization) as unknown as T
  }

  if (_.isObject(valueToSanitize)) {
    try {
      const sanitizedValueAsLiteral = convertObjectToSerializableLiteral(valueToSanitize) as T

      // convert any nested structures as well, if objects or arrays, to literals. This is needed in the case of Proxy objects
      _.forEach(sanitizedValueAsLiteral as any, (value, key) => {
        sanitizedValueAsLiteral[key] = preprocessForSerialization(value)
      })

      return sanitizedValueAsLiteral
    } catch (err) {
      // if its not serializable, tell the primary to inform the user that the value thrown could not be serialized
      throw UNSERIALIZABLE
    }
  }

  if (!isSerializableInCurrentBrowser(valueToSanitize)) {
    throw UNSERIALIZABLE
  }

  return valueToSanitize
}

export const reifySerializedError = (serializedError: any, userInvocationStack: string) => {
  // we have no idea what type the error this is... could be 'undefined', a plain old object, or something else entirely

  let reifiedError = $errUtils.errByPath('origin.failed_to_serialize_or_map_thrown_value')

  if (_.isArray(serializedError)) {
    // if the error is an array of anything, create a normal error with the stringified values of the passed in array
    reifiedError = new Error(serializedError.toString())
  } else if (_.isObject(serializedError as any)) {
    // otherwise, try to determine if there are any error details in the object and merge the error objects together
    let errorToMerge = serializedError?.message ? new Error(serializedError?.message || '') : reifiedError

    reifiedError = _.assignWith(errorToMerge, serializedError)
  } else if (serializedError !== UNSERIALIZABLE) {
    reifiedError = new Error(`${serializedError}`)
  }

  reifiedError.onFail = () => {}

  reifiedError.stack = $stackUtils.replacedStack(reifiedError, userInvocationStack)

  return reifiedError
}
