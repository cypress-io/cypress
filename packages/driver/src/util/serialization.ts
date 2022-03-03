import _ from 'lodash'
import structuredClonePonyfill from 'core-js-pure/actual/structured-clone'

// If a native structuredClone exists, use that to determine if a value can be serialized or not. Otherwise, use the ponyfill.
// we need this because some implementations of SCA treat certain values as unserializable (ex: Error is serializable in ponyfill but NOT in firefox implementations)
// @ts-ignore
const structuredCloneRef = window?.structuredClone || structuredClonePonyfill

const isSerializableInCurrentBrowser = (value: any) => {
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

    return true
  } catch (e) {
    return false
  }
}

/**
 * Sanitizes any unserializable values from a object to prep for postMessage serialization
 * @param objectToSanitize Object that might have unserializable properties
 * @returns a copy of this object with all unserializable keys omitted from the object.
 *
 * NOTE: If an object nested inside objectToSanitize contains an unserializable property, the whole object is deemed as unserializable
 */
export const preprocessObjForSerialization = <T>(objectToSanitize: { [key: string]: any }): T => {
  return _.pickBy(objectToSanitize, isSerializableInCurrentBrowser) as T
}
