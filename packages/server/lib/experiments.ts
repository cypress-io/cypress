import { trim, find, propEq } from 'ramda'

interface CypressExperiments {
  componentTesting: boolean
}

export const defaultExperiments: CypressExperiments = {
  componentTesting: false,
}

/**
 * The environment variable name used to grab the experiments
 */
export const EXPERIMENTS_ENV_FLAG_NAME = 'CYPRESS_EXPERIMENTS'

interface FlagToken {
  name: string
  value: boolean
}
/**
 * converts string like `flagA,flagB=false,flagC=true` into an array like
  ```
  [ {name: 'flagA', value: true},
    {name: 'flagB', value: false},
    {name: 'flagC', value: true}]
  ```
*/
export const parseFlags = (experiments: string): FlagToken[] => {
  const flagTokens = experiments.split(',').map(trim).map((flagToken) => {
    if (flagToken.includes('=')) {
      const [name, value] = flagToken.split('=').map(trim)

      if (value === 'true') {
        return {
          name,
          value: true,
        }
      }

      if (value === 'false') {
        return {
          name,
          value: false,
        }
      }

      throw new Error(`Could not parse flag token ${flagToken}`)
    }

    // boolean flag "flagA", automatic true
    return {
      name: flagToken,
      value: true,
    }
  })

  return flagTokens
}

/**
 * Returns an object with boolean flags corresponding to the enabled experiments.
 * @see https://on.cypress.io/experiments
 */
export const getExperiments = (): CypressExperiments => {
  const experimentsEnv: string = process.env[EXPERIMENTS_ENV_FLAG_NAME] || ''

  if (!experimentsEnv) {
    return defaultExperiments
  }

  const flagTokens = parseFlags(experimentsEnv)

  const flagValueOrDefault = (flagName, defaultValue) => {
    const flagToken = find(propEq('name', flagName))(flagTokens)

    if (flagToken) {
      return flagToken.value
    }

    return defaultValue
  }

  const experiments: CypressExperiments = {
    componentTesting: flagValueOrDefault('componentTesting', defaultExperiments.componentTesting),
  }

  return experiments
}
