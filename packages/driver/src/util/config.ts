import _ from 'lodash'
import { options } from '@packages/config'
import { preprocessObjForSerialization } from './serialization'

/**
 * Mutates the config/env object serialized from the other domain to omit read-only values
 * to prevent trying to update differences in read-only config. This function does mutate this
 * serialized config/env by reference, which should be ok since this object is a clone
 * of what is being received back from the 'other' domain.
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
 * Takes a full config object from a different domain, finds the differences in the current config, and updates the config for the current domain.
 * @param config The full config object from the other domain, serialized
 * @param env The full env object from the other domain, serialized
 * @returns undefined
 */
const syncToCurrentDomain = (valuesFromOtherDomain: Cypress.ObjectLike, valuesFromCurrentDomain: Cypress.ObjectLike) => {
  // @ts-ignore
  const shallowDifferencesInConfig = _.omitBy(valuesFromOtherDomain, (value: any, key: string) => {
    const valueToSync = value
    const currentDomainValue = valuesFromCurrentDomain[key]

    // if the values being compared are objects, do a value comparison to see if the contents of each object are identical
    return _.isEqual(valueToSync, currentDomainValue)
  })

  return shallowDifferencesInConfig
}

export const syncConfigToCurrentDomain = (config: Cypress.Config) => {
  const shallowConfigDiff = syncToCurrentDomain(config, Cypress.config())
  const valuesToSync = omitConfigReadOnlyDifferences(shallowConfigDiff)

  Cypress.config(valuesToSync)
}

export const syncEnvToCurrentDomain = (env: Cypress.ObjectLike) => {
  const shallowConfigDiff = syncToCurrentDomain(env, Cypress.env())

  Cypress.env(shallowConfigDiff)
}

export const preprocessConfig = (config: Cypress.Config) => {
  return preprocessObjForSerialization(config) as Cypress.Config
}

export const preprocessEnv = (env: Cypress.ObjectLike) => {
  return preprocessObjForSerialization(env) as Cypress.Config
}
