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

function getResolvedTestConfigOverride (test) {
  let curParent = test.parent

  const cfgs = [test.cfg]

  while (curParent) {
    if (curParent.cfg) {
      cfgs.push(curParent.cfg)
    }

    curParent = curParent.parent
  }

  return _.reduceRight(cfgs, (acc, cfg) => _.extend(acc, cfg), {})
}

class TestConfigOverride {
  private restoreTestConfigFn: Nullable<() => void> = null
  restoreAndSetTestConfigOverrides (test, config, env) {
    if (this.restoreTestConfigFn) this.restoreTestConfigFn()

    const resolvedTestConfig = getResolvedTestConfigOverride(test)

    this.restoreTestConfigFn = mutateConfiguration(resolvedTestConfig, config, env)
  }
}

export function create () {
  return new TestConfigOverride()
}
