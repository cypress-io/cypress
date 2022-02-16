import _ from 'lodash'
import structuredClonePonyfill from 'core-js-pure/actual/structured-clone'
import { options } from '@packages/config'

const UNSERIALIZABLE = '__unserializable'

// If a native structuredClone exists, use that to determine if a value can be serialized or not. Otherwise, use the ponyfill.
// we need this because some implementations of SCA treat certain values as unserializable (ex: Error is serializable in ponyfill but NOT in firefox implementations)
// @ts-ignore
const structuredCloneRef = window?.structuredClone || structuredClonePonyfill

/**
 * Mutates the config/env object serialized from the other domain to omit read-only values
 * to prevent trying to update differences in read-only config. This function does mutate this
 * serialized config/env by reference, which should be ok since this object is a clone
 * of what is being received back from the 'other' domain.
 *
 * @param objectLikeConfig the config/env object to omit read-only values from.
 * @returns a reference to the config/env object passed in
 */
const omitReadOnlyDifferences = (objectLikeConfig: Cypress.ObjectLike) => {
  Object.keys(objectLikeConfig).forEach((key) => {
    if (options.find((option) => option.name === key)?.canUpdateDuringTestTime === false) {
      delete objectLikeConfig[key]
    }
  })

  return objectLikeConfig
}

/**
 * Sanitizes any unserializable values from the config/env object to prep the config/env for postMessage serialization
 * @param objectToSanitize Object that is either Cypress.config() or Cypress.env()
 * @returns a copy of this object with all unserializable keys omitted from the object.
 *
 * NOTE: If an object contains an unserializable property, the whole object is deemed as unserializable
 */
const preprocessConfigOrEnvObj = <T>(objectToSanitize: { [key: string]: any }): T => {
  const sanitizedOfUnserializableValues = _.mapValues(objectToSanitize, (val) => {
    try {
      return structuredCloneRef(val)
    } catch (e) {
      return UNSERIALIZABLE
    }
  })

  _.forEach(sanitizedOfUnserializableValues, (value, key) => {
    if (value === UNSERIALIZABLE) {
      delete sanitizedOfUnserializableValues[key]
    }
  })

  return sanitizedOfUnserializableValues as T
}

/**
 * Takes a full config object from a different domain, finds the differences in the current config, and updates the config for the current domain.
 * @param config The full config object from the other domain, serialized
 * @param env The full env object from the other domain, serialized
 * @returns undefined
 */
const syncToCurrentDomain = (valuesFromOtherDomain: Cypress.ObjectLike, setterGetterFn) => {
  const currentDomainValues = setterGetterFn()
  // @ts-ignore
  const shallowDifferencesInConfig = _.omitBy(valuesFromOtherDomain, (value: any, key: string) => {
    const valueToSync = value
    const currentDomainValue = currentDomainValues[key]

    // if the values being compared are objects, do a value comparison to see if the contents of each object are identical
    return _.isEqual(valueToSync, currentDomainValue)
  })

  // we need to omit certain differences in config from the other domain, such as video: false to prevent the video recorder from being invoked in switchToDomain
  const valuesToSync = omitReadOnlyDifferences(shallowDifferencesInConfig)

  setterGetterFn(valuesToSync)

  return undefined
}

export const syncConfigToCurrentDomain = (config: Cypress.Config) => {
  return syncToCurrentDomain(config, Cypress.config)
}

export const syncEnvToCurrentDomain = (env: Cypress.ObjectLike) => {
  return syncToCurrentDomain(env, Cypress.env)
}

export const preprocessConfig = (config: Cypress.Config) => {
  return preprocessConfigOrEnvObj(config) as Cypress.Config
}

export const preprocessEnv = (env: Cypress.ObjectLike) => {
  return preprocessConfigOrEnvObj(env) as Cypress.ObjectLike
}
