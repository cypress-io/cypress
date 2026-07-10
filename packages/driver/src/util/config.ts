import _ from 'lodash'
import { testOverrideLevels, validate as validateConfigValues, validateOverridableAtRunTime } from '@packages/config'
import { preprocessForSerialization } from './serialization'
import $errUtils from '../cypress/error_utils'

import type { StateFunc as State } from '../cypress/state'
import type { MochaOverrideLevel } from '../cy/testConfigOverrides'
import type { ErrResult } from '@packages/config'

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
  Object.keys(objectLikeConfig).forEach((configKey) => {
    const overrideLevels = testOverrideLevels[configKey]

    // allow user defined config values
    if (!overrideLevels) {
      return
    }

    // Cross-origin syncing applies the diff via Cypress.config() at run-time, so omit any
    // value that cannot be set that way.
    if (
      (overrideLevels === 'never' && configKey !== 'isDefaultProtocolEnabled') ||
      overrideLevels === 'suiteOrTest'
    ) {
      delete objectLikeConfig[configKey]
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

export const syncExposeToCurrentOrigin = (expose: Cypress.ObjectLike) => {
  const shallowConfigDiff = syncToCurrentOrigin(expose, Cypress.expose())

  Cypress.expose(shallowConfigDiff)
}

export const preprocessConfig = (config: Cypress.Config) => {
  return preprocessForSerialization(config) as Cypress.Config
}

/**
 * Prepares config to initialize a cross-origin spec bridge.
 * isInteractive is read-only and must reflect the server-computed run/open mode value
 * from bootstrap, not testing overrides on the primary origin (e.g. defaults.js).
 */
export const preprocessConfigForSpecBridge = (
  config: Cypress.Config,
  originalConfig: { isInteractive?: boolean, isTextTerminal?: boolean },
) => {
  const preprocessed = preprocessConfig(config)

  return {
    ..._.omit(preprocessed, 'isInteractive'),
    isInteractive: originalConfig.isInteractive ?? !originalConfig.isTextTerminal,
  }
}

export const preprocessExpose = (expose: Cypress.ObjectLike) => {
  return preprocessForSerialization(expose) as Cypress.Config
}

export const getMochaOverrideLevel = (state): MochaOverrideLevel | undefined => {
  const test = state('test')

  if (!state('duringUserTestExecution') && test && !Object.keys(test?._fired || {}).length) {
    return test._testConfig.applied
  }

  return undefined
}

// Extra guidance appended to the generic `suite_or_test_only` error, keyed by config option.
// Add an entry here when a new `suiteOrTest` option needs option-specific advice.
const suiteOrTestOnlyGuidance: Record<string, string> = {
  viewportWidth: ' To change the viewport during a test, use `cy.viewport()`.',
  viewportHeight: ' To change the viewport during a test, use `cy.viewport()`.',
}

// Configuration can be override at multiple run-time levels. Ensure the configuration keys can
// be override and that the provided override values are the correct type.
//
// The run-time override levels (listed in order applied):
//   fileLoad  -  config override via Cypress.config() when either loading the supportFile or specFile in the
//                 browser (this is before mocha as process the spec
//   restoring - restore global (suite-level) configuration before applying test-specific overrides
//   suite     - config override via describe('', {...}, () => {})
//   test      - config override via it('', {...}, () => {})
//   event     - config override via Cypress.config() in test:before:runner or test:before:runner:async event
//   runtime   - config override via Cypress.config() when the test callback is executed
export const validateConfig = (state: State, config: Record<string, any>, skipConfigOverrideValidation: boolean = false) => {
  const mochaOverrideLevel = getMochaOverrideLevel(state)

  if (!skipConfigOverrideValidation && mochaOverrideLevel !== 'restoring') {
    const currentOverrideLevel = mochaOverrideLevel === 'suite' || mochaOverrideLevel === 'test'
      ? mochaOverrideLevel
      : state('duringUserTestExecution') ? 'runtime' : undefined

    validateOverridableAtRunTime(config, currentOverrideLevel, (validationResult) => {
      let errKey = 'config.cypress_config_api.read_only'

      if (validationResult.supportedOverrideLevel === 'global_only') {
        errKey = 'config.invalid_mocha_config_override.global_only'
      } else if (validationResult.supportedOverrideLevel === 'suite') {
        errKey = 'config.invalid_mocha_config_override.suite_only'
      } else if (validationResult.supportedOverrideLevel === 'suiteOrTest') {
        errKey = 'config.cypress_config_api.suite_or_test_only'
      } else if (mochaOverrideLevel) {
        errKey = 'config.invalid_mocha_config_override.read_only'
      }

      throw new (state('specWindow').Error)($errUtils.errByPath(errKey, {
        ...validationResult,
        additionalInfo: suiteOrTestOnlyGuidance[validationResult.invalidConfigKey] ?? '',
      }))
    })
  }

  validateConfigValues(config, (errResult: ErrResult | string) => {
    const stringify = (str) => format(JSON.stringify(str))

    const format = (str) => `\`${str}\``

    // TODO: this does not use the @packages/error rewriting rules
    // for stdout vs markdown - it always inserts back ticks for markdown
    // and those leak out into the stdout formatting.
    const errMsg = _.isString(errResult)
      ? errResult
      : `Expected ${format(errResult.key)} to be ${errResult.type}.\n\nInstead the value was: ${stringify(errResult.value)}`

    throw new (state('specWindow').Error)(errMsg)
  }, Cypress.testingType)
}
