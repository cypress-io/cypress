import _ from 'lodash'

// See Test Config Overrides in ../../../../cli/types/cypress.d.ts

function mutateConfiguration (testConfigOverride, config, env) {
  delete testConfigOverride.browser

  const testConfigOverrideKeys = Object.keys(testConfigOverride)
  let testEnvOverrideKeys

  // only clone the keys that were overridden by the test overrides
  const globalConfig = _.pick(config(), testConfigOverrideKeys)

  const localConfigOverrides = config(testConfigOverride)
  const localConfigOverridesBackup = _.clone(localConfigOverrides)

  let localTestEnv
  let localTestEnvBackup
  let globalEnv

  if (testConfigOverride.env) {
    testEnvOverrideKeys = Object.keys(testConfigOverride.env)
    globalEnv = _.pick(env(), testEnvOverrideKeys)
    localTestEnv = env(testConfigOverride.env)
    localTestEnvBackup = _.clone(localTestEnv)
  }

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
    })

    _.each(localTestEnv, (val, key) => {
      if (localTestEnvBackup[key] !== val) {
        globalEnv[key] = val
      }
    })

    // reset test config overrides
    config(globalConfig)

    // reset test env overrides
    env(globalEnv)
  }

  return restoreConfigFn
}

// this is called during test onRunnable time
// in order to resolve the test config upfront before test runs
export function getResolvedTestConfigOverride (test) {
  let curParent = test.parent

  const testConfig = [test._testConfig]

  while (curParent) {
    if (curParent._testConfig) {
      testConfig.push(curParent._testConfig)
    }

    curParent = curParent.parent
  }

  return _.reduceRight(testConfig, (acc, opts) => _.extend(acc, opts), {})
}

class TestConfigOverride {
  private restoreTestConfigFn: Nullable<() => void> = null

  restoreAndSetTestConfigOverrides (test, config, env) {
    if (this.restoreTestConfigFn) this.restoreTestConfigFn()

    const resolvedTestConfig = test._testConfig || {}

    this.restoreTestConfigFn = mutateConfiguration(resolvedTestConfig, config, env)
  }
}

export default {
  create () {
    return new TestConfigOverride()
  },
}
