import _ from 'lodash'
import $errUtils from '../cypress/error_utils'

// See Test Config Overrides in ../../../../cli/types/cypress.d.ts

const mochaOverrideLevel = ['restoring', 'suite', 'test'] as const

export type MochaOverrideLevel = typeof mochaOverrideLevel[number]

type ResolvedTestConfigOverride = {
  /**
   * The list of test config overrides and the invocation details used to add helpful
   * error messaging to consumers if a test override fails validation.
   */
  testConfigList: Array<TestConfig|ResolvedTestConfigOverride>
  /**
   * The test config overrides that will apply to the test if it passes validation.
   */
  unverifiedTestConfig: Object
  /**
   * The current runnable level of test config overrides that are being applied.
   * Used for accurate error reporting.
   */
  applied?: MochaOverrideLevel | 'complete'
}

type TestConfig = {
  // The level in which the configuration override was set.
  overrideLevel: MochaOverrideLevel
  // The configuration overrides. Browser is a valid configuration
  // to indicate the suite or test should run for that browser(s).
  overrides: Record<string, any>
  invocationDetails: {
    stack: Object
  }
};

type ConfigOverrides = {
  env: Object | undefined
  expose?: Record<string, any>
};

type ExposeKeyBackup =
  | { existed: true, value: any }
  | { existed: false }

type ExposeFn = Cypress.Cypress['expose']

/**
 * Saves an existing expose key and returns the original value to be restored after the test runs.
 */
function backupExposeKey (key: string, expose: ExposeFn): ExposeKeyBackup {
  const allExpose = expose()

  if (Object.prototype.hasOwnProperty.call(allExpose, key)) {
    return { existed: true, value: _.cloneDeep(expose(key)) }
  }

  return { existed: false }
}

/**
 * Restores an expose key from a backup value after the test runs. If no value existed, the key will be deleted.
 */
function restoreExposeKey (key: string, backup: ExposeKeyBackup, expose: ExposeFn) {
  if (backup.existed) {
    expose(key, _.cloneDeep(backup.value))
  } else {
    delete expose()[key]
  }
}

function setConfig (testConfig: ResolvedTestConfigOverride, config, localConfigOverrides: ConfigOverrides = { env: undefined }) {
  const { testConfigList = [] } = testConfig

  testConfigList.forEach((resolvedConfig) => {
    const { overrides: testConfigOverride, overrideLevel, invocationDetails } = resolvedConfig as TestConfig

    if (_.isArray(testConfigOverride)) {
      setConfig(resolvedConfig as ResolvedTestConfigOverride, config, localConfigOverrides)
    } else if (Object.keys(testConfigOverride).length) {
      const testConfigOverrideCopy = { ...testConfigOverride }
      const exposeOverride = testConfigOverrideCopy.expose

      delete testConfigOverrideCopy.browser
      delete testConfigOverrideCopy.expose

      try {
        testConfig.applied = overrideLevel

        config(testConfigOverrideCopy)
      } catch (e: any) {
        let err = $errUtils.errByPath('config.invalid_test_override', {
          errMsg: e.message,
          overrideLevel,
        })

        err.stack = $errUtils.stackWithReplacedProps({ stack: invocationDetails.stack }, err)
        throw err
      }
      localConfigOverrides = { ...localConfigOverrides, ...testConfigOverrideCopy }

      if (exposeOverride) {
        localConfigOverrides.expose = {
          ...localConfigOverrides.expose,
          ...exposeOverride,
        }
      }
    }
  })

  return localConfigOverrides
}

function mutateConfiguration (testConfig: ResolvedTestConfigOverride, config, env, expose: ExposeFn) {
  let globalConfig = _.clone(config())

  const localConfigOverrides = setConfig(testConfig, config)

  // only store the global config values that updated
  globalConfig = _.pick(globalConfig, Object.keys(localConfigOverrides))

  const localConfigOverridesBackup = _.clone(localConfigOverrides)

  // Do not allow overriding test/suite environment variables via testConfigOverrides with allowCypressEnv=false
  // as the server needs to be restarted. The environment variables needing to be overridden need to be injected via the Cypress server
  // and are not permitted in the browser.
  if (!config('allowCypressEnv') && localConfigOverrides.env) {
    let err = $errUtils.errByPath('config.invalid_test_override_with_allow_cypress_env')

    throw err
  }

  // only set if allowCypressEnv is enabled
  let globalEnv
  let localTestEnv
  let localTestEnvBackup
  let testExposeBackup: Map<string, ExposeKeyBackup> | undefined

  if (config('allowCypressEnv')) {
    globalEnv = _.clone(env())
    if (localConfigOverrides.env) {
      env(localConfigOverrides.env)
    }

    localTestEnv = env()
    localTestEnvBackup = _.clone(localTestEnv)
  }

  // Expose overrides are applied at test start and restored after each test for only the overridden keys
  // so hook-level values remain intact.
  if (localConfigOverrides.expose) {
    const exposeBackup = new Map<string, ExposeKeyBackup>()

    testExposeBackup = exposeBackup
    _.each(localConfigOverrides.expose, (val, key) => {
      exposeBackup.set(key, backupExposeKey(key, expose))
      expose(key, _.cloneDeep(val))
    })
  }

  // we restore config back to what it was before the test ran
  // UNLESS the user mutated config with Cypress.config, in which case
  // we apply those changes to the global config
  // TODO: (NEXT_BREAKING) always restore configuration
  //   do not allow global mutations inside test
  const restoreConfigFn = function () {
    _.each(localConfigOverrides, (val, key) => {
      if (key === 'expose') {
        return
      }

      if (localConfigOverridesBackup[key] !== val) {
        globalConfig[key] = val
      }

      // explicitly set to undefined if config wasn't previously defined
      if (!globalConfig.hasOwnProperty(key)) {
        globalConfig[key] = undefined
      }
    })

    if (config('allowCypressEnv')) {
      _.each(localTestEnv, (val, key) => {
        if (localTestEnvBackup[key] !== val) {
          globalEnv[key] = val
        }
      })
    }

    if (testExposeBackup) {
      for (const [key, backup] of testExposeBackup) {
        restoreExposeKey(key, backup, expose)
      }
    }

    // reset test config overrides
    config(globalConfig)
    if (config('allowCypressEnv')) {
      env.reset()
      env(globalEnv)
    }
  }

  return restoreConfigFn
}

// this is called during test onRunnable time
// in order to resolve the test config upfront before test runs
// note: must return as an object to meet the Cypress Cloud recording API
export function getResolvedTestConfigOverride (test): ResolvedTestConfigOverride {
  let curr = test
  let testConfigList: TestConfig[] = []

  while (curr) {
    if (curr._testConfig) {
      if (curr._testConfig.testConfigList) {
        // configuration for mocha function has already been processed
        testConfigList = testConfigList.concat(curr._testConfig.testConfigList)
      } else {
        testConfigList.unshift({
          overrideLevel: curr.type,
          overrides: curr._testConfig,
          invocationDetails: curr.invocationDetails,
        })
      }
    }

    curr = curr.parent
  }

  const testConfig = {
    testConfigList: testConfigList.filter(({ overrides }) => overrides !== undefined),
    // collect test overrides to send to the Cypress Cloud api when @packages/server is ran in record mode
    unverifiedTestConfig: _.reduce(testConfigList, (acc: Record<string, any>, { overrides }) => {
      const result = _.extend({}, acc, overrides)

      if (overrides?.expose) {
        result.expose = {
          ...acc.expose,
          ...overrides.expose,
        }
      }

      return result
    }, {} as Record<string, any>),
  }

  return testConfig
}

export class TestConfigOverride {
  private restoreTestConfigFn: Cypress.Nullable<() => void> = null

  restoreAndSetTestConfigOverrides (test, config, env, expose: ExposeFn) {
    if (this.restoreTestConfigFn) {
      test._testConfig.applied = 'restoring'
      this.restoreTestConfigFn()
    }

    const resolvedTestConfig = test._testConfig || {
      unverifiedTestConfig: [],
    }

    if (Object.keys(resolvedTestConfig.unverifiedTestConfig).length > 0) {
      this.restoreTestConfigFn = mutateConfiguration(resolvedTestConfig, config, env, expose)
    } else {
      this.restoreTestConfigFn = null
    }

    resolvedTestConfig.applied = 'complete'
  }
}
