import _ from 'lodash'
import $errUtils from '../cypress/error_utils'

// See Test Config Overrides in ../../../../cli/types/cypress.d.ts

type ResolvedTestConfigOverride = {
  /**
   * The list of test config overrides and the invocation details used to add helpful
   * error messaging to consumers if a test override fails validation.
   */
  testConfigList: Array<TestConfig>
  /**
   * The test config overrides that will apply to the test if it passes validation.
   * */
  unverifiedTestConfig: Object
}

type TestConfig = {
  overrides: {
    browser?: Object
  }
  invocationDetails: {
    stack: Object
  }
};

type ConfigOverrides = {
  env: Object | undefined
};

function setConfig (testConfigList: Array<TestConfig>, config, localConfigOverrides: ConfigOverrides = { env: undefined }) {
  testConfigList.forEach(({ overrides: testConfigOverride, invocationDetails }) => {
    if (_.isArray(testConfigOverride)) {
      setConfig(testConfigOverride, config, localConfigOverrides)
    } else {
      delete testConfigOverride.browser

      try {
        config(testConfigOverride)
      } catch (e: any) {
        let err = $errUtils.errByPath('config.invalid_test_override', {
          errMsg: e.message,
        })

        err.stack = $errUtils.stackWithReplacedProps({ stack: invocationDetails.stack }, err)
        throw err
      }
      localConfigOverrides = { ...localConfigOverrides, ...testConfigOverride }
    }
  })

  return localConfigOverrides
}

function mutateConfiguration (testConfig: ResolvedTestConfigOverride, config, env) {
  const { testConfigList } = testConfig || []

  let globalConfig = _.clone(config())

  const localConfigOverrides = setConfig(testConfigList, config)

  // only store the global config values that updated
  globalConfig = _.pick(globalConfig, Object.keys(localConfigOverrides))
  const globalEnv = _.clone(env())

  const localConfigOverridesBackup = _.clone(localConfigOverrides)

  if (localConfigOverrides.env) {
    env(localConfigOverrides.env)
  }

  const localTestEnv = env()
  const localTestEnvBackup = _.clone(localTestEnv)

  // we restore config back to what it was before the test ran
  // UNLESS the user mutated config with Cypress.config, in which case
  // we apply those changes to the global config
  // TODO: (NEXT_BREAKING) always restore configuration
  //   do not allow global mutations inside test
  const restoreConfigFn = function () {
    _.each(localConfigOverrides, (val, key) => {
      if (localConfigOverridesBackup[key] !== val) {
        globalConfig[key] = val
      }

      // explicitly set to undefined if config wasn't previously defined
      if (!globalConfig.hasOwnProperty(key)) {
        globalConfig[key] = undefined
      }
    })

    _.each(localTestEnv, (val, key) => {
      if (localTestEnvBackup[key] !== val) {
        globalEnv[key] = val
      }
    })

    // reset test config overrides
    config(globalConfig)

    env.reset()
    env(globalEnv)
  }

  return restoreConfigFn
}

// this is called during test onRunnable time
// in order to resolve the test config upfront before test runs
// note: must return as an object to meet the dashboard recording API
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
          overrides: curr._testConfig,
          invocationDetails: curr.invocationDetails,
        })
      }
    }

    curr = curr.parent
  }

  const testConfig = {
    testConfigList: testConfigList.filter(({ overrides }) => overrides !== undefined),
    // collect test overrides to send to the dashboard api when @packages/server is ran in record mode
    unverifiedTestConfig: _.reduce(testConfigList, (acc, { overrides }) => _.extend(acc, overrides), {}),
  }

  return testConfig
}

export class TestConfigOverride {
  private restoreTestConfigFn: Nullable<() => void> = null

  restoreAndSetTestConfigOverrides (test, config, env) {
    if (this.restoreTestConfigFn) this.restoreTestConfigFn()

    const resolvedTestConfig = test._testConfig || {
      unverifiedTestConfig: [],
    }

    if (Object.keys(resolvedTestConfig.unverifiedTestConfig).length > 0) {
      this.restoreTestConfigFn = mutateConfiguration(resolvedTestConfig, config, env)
    }
  }
}
