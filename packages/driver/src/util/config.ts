import _ from 'lodash'
import { options } from '@packages/config'
import { preprocessForSerialization } from './serialization'

/**
 * Mutates the config/env object serialized from the other origin to omit read-only values
 * to prevent trying to update differences in read-only config. This function does mutate this
 * serialized config/env by reference, which should be ok since this object is a clone
 * of what is being received back from the 'other' origin.
 *
 * @param objectLikeConfig the config/env object to omit read-only values from.
 * @returns a reference to the config/env object passed in
 */
const omitConfigReadOnlyDifferences = (objectLikeConfig: Cypress.ObjectLike) => {
  Object.keys(objectLikeConfig).forEach((key) => {
    if (options.find((option) => option.name === key)?.canUpdateDuringTestTime === false) {
      delete objectLikeConfig[key]
    }
  })

  return objectLikeConfig
}

/**
 * Takes a full config object from a different origin, finds the differences in the current config, and updates the config for the current origin.
 * @param config The full config object from the other origin, serialized
 * @param env The full env object from the other origin, serialized
 * @returns Cypress.ObjectLike
 */
const syncToCurrentOrigin = (valuesFromOtherOrigin: Cypress.ObjectLike, valuesFromCurrentOrigin: Cypress.ObjectLike): Cypress.ObjectLike => {
  // @ts-ignore
  const shallowDifferencesInConfig = _.omitBy(valuesFromOtherOrigin, (value: any, key: string) => {
    const valueToSync = value
    const currentOriginValue = valuesFromCurrentOrigin[key]

    // if the values being compared are objects, do a value comparison to see if the contents of each object are identical
    return _.isEqual(valueToSync, currentOriginValue)
  })

  return shallowDifferencesInConfig
}

export const syncConfigToCurrentOrigin = (config: Cypress.Config) => {
  const shallowConfigDiff = syncToCurrentOrigin(config, Cypress.config())
  const valuesToSync = omitConfigReadOnlyDifferences(shallowConfigDiff)

  Cypress.config(valuesToSync)
}

export const syncEnvToCurrentOrigin = (env: Cypress.ObjectLike) => {
  const shallowConfigDiff = syncToCurrentOrigin(env, Cypress.env())

  Cypress.env(shallowConfigDiff)
}

export const preprocessConfig = (config: Cypress.Config) => {
  return preprocessForSerialization(config) as Cypress.Config
}

export const preprocessEnv = (env: Cypress.ObjectLike) => {
  return preprocessForSerialization(env) as Cypress.Config
}
