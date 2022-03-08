import { errPartial, fmt } from './errTemplate'

export function errPrefixRootOnly (optionKey: string) {
  return errPartial`
    ${fmt.highlight('setupNodeEvents()')} is updating the option ${fmt.highlight(optionKey)}.

    Since 10.0, this option is no longer supported on the root of the config object. 
  `
}

export function errPrefix (optionKey: string) {
  return errPartial`
    ${fmt.highlight('setupNodeEvents()')} is updating the option ${fmt.highlight(optionKey)}.

    Since 10.0, this option is no longer supported. 
  `
}

function getSpecPatternAdditionalHelp (optionKey: string) {
  const mergedOptionKey = 'testFiles' === optionKey ? 'integrationFolder' : 'testFiles'

  return errPartial`
    It was merged with ${fmt.highlight(mergedOptionKey)} into the ${fmt.highlight('specPattern')} option.

    NOTE: ${fmt.highlight('specPattern')} has to be set as a member of the ${fmt.highlight('e2e')} or ${fmt.highlight('component')} property.
  `
}

/**
 * Only listing of values that have broken configs between 9.X and 10.X
 * `brokenOnlyAtRoot` means that the option is only broken
 * at the root of the config object and can still
 * be used in e2e or component configs
 */
export const brokenOptionsMap = {
  baseUrl: {
    brokenOnlyAtRoot: true,
    additionalHelp: errPartial`
      Since 10.0, this option is no longer supported on the root of the config object. 
    `,
  },
  supportFile: {
    brokenOnlyAtRoot: true,
    additionalHelp: errPartial`
      Set a specific ${fmt.highlight('supportFile')} in the ${fmt.highlight('e2e')} or ${fmt.highlight('component')} object.
    `,
  },

  integrationFolder: {
    brokenOnlyAtRoot: false,
    additionalHelp: getSpecPatternAdditionalHelp('integrationFolder'),
  },

  componentFolder: {
    brokenOnlyAtRoot: false,
    additionalHelp: getSpecPatternAdditionalHelp('componentFolder'),
  },

  testFiles: {
    brokenOnlyAtRoot: false,
    additionalHelp: getSpecPatternAdditionalHelp('testFiles'),
  },
} as const
