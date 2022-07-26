type Options = {
  CypressUserAgentRe: string | RegExp
  ElectronUserAgentRe: string | RegExp
}

const defaultOptions: Options = {
  CypressUserAgentRe: /Cypress.*?\s/g,
  ElectronUserAgentRe: /[Ee]lectron.*?\s/g,
}

export const setUserAgentOverride = async (replacementUserAgent: string) => {
  try {
    await Cypress.automation('remote:debugger:protocol', {
      command: 'Network.setUserAgentOverride',
      params: {
        userAgent: replacementUserAgent,
      },
    })
  } catch (e) {
    throw new Error('Error occurred setting user agent')
  }
}

export const replaceCypressInUserAgent = (userAgent: string, regularExp: string | RegExp = defaultOptions.CypressUserAgentRe): string => {
  return userAgent.replace(regularExp, '')
}

export const replaceElectronInUserAgent = (userAgent: string, regularExp: string | RegExp = defaultOptions.ElectronUserAgentRe): string => {
  return userAgent.replace(regularExp, '')
}

export const normalizeObstructiveUserAgent = async (options?: Partial<Options>) => {
  const { CypressUserAgentRe, ElectronUserAgentRe } = Cypress._.extend(options || {}, defaultOptions)

  if (Cypress.isBrowser('electron') && Cypress.testingType === 'e2e') {
    let userAgentToBeManipulated = window.navigator.userAgent

    userAgentToBeManipulated = replaceCypressInUserAgent(userAgentToBeManipulated, CypressUserAgentRe)
    userAgentToBeManipulated = replaceElectronInUserAgent(userAgentToBeManipulated, ElectronUserAgentRe)
    await setUserAgentOverride(userAgentToBeManipulated)
  }

  return undefined
}
