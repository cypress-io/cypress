import { init, loadRemote } from '@module-federation/runtime'
import type { CypressInternal, CyPromptDriverDefaultShape } from './prompt-driver-types'
import type Emitter from 'component-emitter'

interface CyPromptDriver { default: CyPromptDriverDefaultShape }

declare global {
  interface Window {
    getEventManager?: () => {
      ws: Emitter
    }
  }
}

let initializedModule: CyPromptDriverDefaultShape | null = null
const initializeModule = async (Cypress: Cypress.Cypress): Promise<CyPromptDriverDefaultShape> => {
  // Wait for the cy prompt bundle to be downloaded and ready
  const { success } = await Cypress.backend('wait:for:cy:prompt:ready')

  if (!success) {
    throw new Error('error waiting for cy prompt bundle to be downloaded and ready')
  }

  // Once the cy prompt bundle is downloaded and ready,
  // we can initialize it via the module federation runtime
  init({
    remotes: [{
      alias: 'cy-prompt',
      type: 'module',
      name: 'cy-prompt',
      entryGlobalName: 'cy-prompt',
      entry: '/__cypress-cy-prompt/cy-prompt.js',
      shareScope: 'default',
    }],
    name: 'driver',
  })

  // This cy-prompt.js file and any subsequent files are
  // served from the cy prompt bundle.
  const module = await loadRemote<CyPromptDriver>('cy-prompt')

  if (!module?.default) {
    throw new Error('error loading cy prompt driver')
  }

  initializedModule = module.default

  return initializedModule
}

const initializeCloudCyPrompt = async (Cypress: Cypress.Cypress, cy: Cypress.Cypress['cy']): Promise<ReturnType<CyPromptDriverDefaultShape['createCyPrompt']> | Error> => {
  try {
    let cloudModule = initializedModule

    if (!cloudModule) {
      cloudModule = await initializeModule(Cypress)
    }

    return await cloudModule.createCyPrompt({
      Cypress: Cypress as CypressInternal,
      cy,
      eventManager: window.getEventManager ? window.getEventManager() : undefined,
    })
  } catch (error) {
    return error
  }
}

export default (Commands, Cypress, cy) => {
  if (Cypress.config('experimentalPromptCommand')) {
    let initializeCloudCyPromptPromise: Promise<ReturnType<CyPromptDriverDefaultShape['createCyPrompt']> | Error> | undefined

    if (Cypress.browser.family === 'chromium' || Cypress.browser.name === 'electron') {
      initializeCloudCyPromptPromise = initializeCloudCyPrompt(Cypress, cy)
    }

    const prompt = async (message: string, options: object = {}) => {
      if (!initializeCloudCyPromptPromise) {
        // TODO: (cy.prompt) We will look into supporting other browsers (and testing them)
        // as this is rolled out
        throw new Error('`cy.prompt()` is not supported in this browser.')
      }

      try {
        const bundleResult = await initializeCloudCyPromptPromise

        if (bundleResult instanceof Error) {
          throw bundleResult
        }

        const cyPrompt = bundleResult

        return await cyPrompt(message, options)
      } catch (error) {
        // TODO: handle this better
        throw new Error(`CyPromptDriver not found: ${error}`)
      }
    }

    // For testing purposes, we can reset the prompt command initialization
    // by calling the __reset method.
    prompt.__reset = () => {
      initializedModule = null
      initializeCloudCyPromptPromise = initializeCloudCyPrompt(Cypress, cy)
    }

    Commands.addAll({
      prompt,
    })
  }
}
