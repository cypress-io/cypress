import { get } from 'lodash'

/**
 * Returns a single string with human-readable experiments.
  ```
  const experimental = getExperimentsFromResolved(config.resolved)
  const enabledExperiments = _.pickBy(experimental, (experiment) => experiment.enabled)
  formatExperiments(enabledExperiments)
  // "componentsTesting=true,featureB=false"
  ```
 */
export const formatExperiments = (exp: CypressExperiments) => {
  return Object.keys(exp).map((name) => `${name}=${exp[name].value}`).join(',')
}

type CypressProject = unknown

/**
 * Single experimental feature. Experiment is enabled
 * if its value is different from the default value (coming from the config).
 */
interface CypressExperiment {
  enabled: boolean // is the experiment enabled
  value: unknown // current value
}

/**
 * Collection of Cypress experiments
 */
interface CypressExperiments {
  [key: string]: CypressExperiment
}

export const getExperimentsFromResolved = (resolvedConfig): CypressExperiments => {
  const experiments: CypressExperiments = {}

  if (!resolvedConfig) {
    // no config - no experiments
    // this is likely to happen during unit testing
    return experiments
  }

  const experimentalKeys = Object.keys(resolvedConfig).filter((key) => key.startsWith('experimental'))

  experimentalKeys.forEach((key) => {
    // it would be nice to have default value in the resolved config
    experiments[key] = {
      value: resolvedConfig[key].value,
      enabled: resolvedConfig[key].from !== 'default',
    }
  })

  return experiments
}

/**
 * Looks at the resolved config, finds all keys that start with "experimental" prefix
 * and have non-default values and returns a simple object with {key: {value, enabled}}
 * where "on" is set to true if the value is different from default..
 */
export const getExperiments = (project: CypressProject): CypressExperiments => {
  const resolvedEnv = get(project, 'resolvedConfig', {})

  return getExperimentsFromResolved(resolvedEnv)
}
