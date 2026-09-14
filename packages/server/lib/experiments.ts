import { get } from 'lodash'
import { hasExperimentalPrefix } from '@packages/config'

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
 * Copy for the `Experiments:` row of the `cypress run` header. It duplicates the Settings screen
 * copy in `@packages/frontend-shared`'s `en-US.json` because that package depends on this one, so
 * the import can only run the other way; `experiments_spec` holds the two in step. Plain text
 * here — the Settings screen renders markdown.
*/
export const _summaries: StringValues = {
  experimentalCspAllowList: 'Enables Cypress to selectively permit Content-Security-Policy and Content-Security-Policy-Report-Only header directives, including those that might otherwise block Cypress from running.',
  experimentalInteractiveRunEvents: 'Allows listening to the `before:run`, `after:run`, `before:spec`, and `after:spec` events in plugins during interactive mode.',
  experimentalModifyObstructiveThirdPartyCode: 'Applies `modifyObstructiveCode` to third party `.html` and `.js`, removes subresource integrity, and modifies the user agent in Electron.',
  experimentalOriginDependencies: 'Enables support for `Cypress.require()` for including dependencies within the `cy.origin()` callback.',
  experimentalRunAllSpecs: 'Enables the "Run All Specs" UI feature, allowing the execution of multiple specs sequentially.',
  experimentalSingleTabRunMode: 'Runs all component specs in a single tab, trading spec isolation for faster run mode execution.',
  experimentalWebKitSupport: 'Adds support for testing in the WebKit browser engine used by Safari. See https://on.cypress.io/webkit-experiment for more information.',
}

export const _names: StringValues = {
  experimentalCspAllowList: 'CSP Allow List',
  experimentalInteractiveRunEvents: 'Interactive run events',
  experimentalModifyObstructiveThirdPartyCode: 'Modify obstructive third party code',
  experimentalOriginDependencies: 'Origin Dependencies',
  experimentalRunAllSpecs: 'Run All Specs',
  experimentalSingleTabRunMode: 'Single tab run mode',
  experimentalWebKitSupport: 'WebKit Support',
}

/**
 * Internal object containing experiment names and summaries.
 * Used as default parameters in getExperimentsFromResolved and getExperiments.
*/
const experimental = {
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

  const experimentalKeys = Object.keys(resolvedConfig).filter(hasExperimentalPrefix)

  experimentalKeys.forEach((key) => {
    const name = get(names, key)

    if (!name) {
      // Cypress accepts unknown keys in a user's config, so one they invented that happens to
      // start with `experimental` reaches here and is not an experiment of ours.
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
