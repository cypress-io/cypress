const _ = require('lodash')

function mutateConfiguration (testConfigOverride, config, env) {
  const globalConfig = _.clone(config())
  const globalEnv = _.clone(env())

  delete testConfigOverride.browser
  config(testConfigOverride)

  const localTestConfig = config()
  const localTestConfigBackup = _.clone(localTestConfig)

  if (testConfigOverride.env) {
    env(testConfigOverride.env)
  }

  const localTestEnv = env()
  const localTestEnvBackup = _.clone(localTestEnv)

  // we restore config back to what it was before the test ran
  // UNLESS the user mutated config with Cypress.config, in which case
  // we apply those changes to the global config
  // TODO: (NEXT_BREAKING) always restore configuration
  //   do not allow global mutations inside test
  const restoreConfigFn = function () {
    _.each(localTestConfig, (val, key) => {
      if (localTestConfigBackup[key] !== val) {
        globalConfig[key] = val
      }
    })

    _.each(localTestEnv, (val, key) => {
      if (localTestEnvBackup[key] !== val) {
        globalEnv[key] = val
      }
    })

    config.reset()
    config(globalConfig)
    env.reset()
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

export function create () {
  return new TestConfigOverride()
}
