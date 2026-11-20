import $Browser from '../../cypress/browser'
import $ensure from '../../cypress/ensure'
import type { AgentContext } from '../protocol'
import type { ICypress } from '../../cypress'

// The DOM, actionability and keyboard modules read `Cypress.*` as a global.
// The agent has no driver, so this supplies the few members they touch from
// the context the driver sends with every call.
export const installCypressShim = () => {
  let context: AgentContext | undefined
  let browser: ReturnType<typeof $Browser> | undefined

  const shim = {
    ensure: $ensure,
    config: (key: string) => context?.config[key],
    get browser () {
      return browser?.browser
    },
    isBrowser: (matcher) => browser?.isBrowser(matcher) ?? false,
    browserMajorVersion: () => browser?.browserMajorVersion(),
    setContext (newContext: AgentContext) {
      context = newContext
      browser = $Browser({ browser: newContext.browser })
    },
  }

  // @ts-expect-error - the shim covers only the members the reused modules read
  window.Cypress = shim

  // Safe because the reused modules only read the members defined above
  return shim as unknown as ICypress & Pick<typeof shim, 'setContext'>
}
