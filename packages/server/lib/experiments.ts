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
  key: string // usually the config key used to control the experiment
  name: string // short name of the experiment
  summary: string // one or two line experiment summary
}

/**
 * Collection of Cypress experiments
 */
interface CypressExperiments {
  [key: string]: CypressExperiment
}

interface StringValues {
  [key: string]: string
}

/**
 * Keeps summaries of experiments. Each summary is 1 - 2 sentences
 * describing the purpose of the experiment.
 * When adding an experiment, add its summary text here.
 *
 * @example
  ```
  {
    experimentalComponentTesting: 'Allows mounting and testing framework-specific components'
  }
  ```
*/
const _summaries: StringValues = {
  experimentalComponentTesting: 'Framework-specific component testing, uses `componentFolder` to load component specs',
  experimentalSourceRewriting: 'Enables AST-based JS/HTML rewriting. This may fix issues caused by the existing regex-based JS/HTML replacement algorithm.',
  experimentalFetchPolyfill: 'Polyfills `window.fetch` to enable Network spying and stubbing',
}

/**
 * Keeps short names for experiments. When adding new experiments, add a short name.
 * The name and summary will be shown in the Settings tab of the Desktop GUI.
 * @example
  ```
  {
    experimentalComponentTesting: 'Component Testing'
  }
  ```
*/
const _names: StringValues = {
  experimentalComponentTesting: 'Component Testing',
  experimentalSourceRewriting: 'Improved source rewriting',
  experimentalFetchPolyfill: 'Fetch polyfill',
}

/**
 * Export this object for easy stubbing from end-to-end tests.
 * If you cannot easily pass "names" and "summaries" arguments
 * to "getExperimentsFromResolved" function, then use this
 * object to change "experiments.names" and "experimental.summaries" objects.
*/
export const experimental = {
  names: _names,
  summaries: _summaries,
}

export const getExperimentsFromResolved = (resolvedConfig, names = experimental.names, summaries = experimental.summaries): CypressExperiments => {
  const experiments: CypressExperiments = {}

  if (!resolvedConfig) {
    // no config - no experiments
    // this is likely to happen during unit testing
    return experiments
  }

  const isExperimentKey = (key) => key.startsWith('experimental')
  const experimentalKeys = Object.keys(resolvedConfig).filter(isExperimentKey)

  experimentalKeys.forEach((key) => {
    const name = get(names, key)

    if (!name) {
      // ignore unknown experiments
      return
    }

    const summary = get(summaries, key, 'top secret')

    // it would be nice to have default value in the resolved config
    experiments[key] = {
      key,
      value: resolvedConfig[key].value,
      enabled: resolvedConfig[key].from !== 'default',
      name,
      summary,
    }
  })

  return experiments
}

/**
 * Looks at the resolved config, finds all keys that start with "experimental" prefix
 * and have non-default values and returns a simple object with {key: {value, enabled}}
 * where "on" is set to true if the value is different from default..
 */
export const getExperiments = (project: CypressProject, names = experimental.names, summaries = experimental.summaries): CypressExperiments => {
  const resolvedEnv = get(project, 'resolvedConfig', {})

  return getExperimentsFromResolved(resolvedEnv, names, summaries)
}

/**
 * Whilelist known experiments here to avoid accidentally showing
 * any config key that starts with "experimental" prefix
*/
// @ts-ignore
export const isKnownExperiment = (experiment, key) => {
  return Object.keys(experimental.names).includes(key)
}

// exporting a single default object with methods
// helps make it is to stub and to test
export default {
  getExperiments,
}
