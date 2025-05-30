import { init, loadRemote } from '@module-federation/runtime'
import type { CyPromptDriverDefaultShape } from './prompt-driver-types'
import type Emitter from 'component-emitter'

interface CyPromptDriver { default: CyPromptDriverDefaultShape }

declare global {
  interface Window {
    getEventManager: () => {
      ws: Emitter
    }
  }
}

let initializedModule: CyPromptDriverDefaultShape | null = null
const initializeModule = async (Cypress: Cypress.Cypress, cy: Cypress.Cypress['cy']): Promise<CyPromptDriverDefaultShape> => {
  // Wait for the cy prompt bundle to be downloaded and ready
  const { success } = await Cypress.backend('wait:for:cy:prompt:ready')

  if (!success) {
    throw new Error('CyPromptDriver not found')
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
    throw new Error('CyPromptDriver not found')
  }

  initializedModule = module.default

  return initializedModule
}

const initializeCloudCyPrompt = async (Cypress: Cypress.Cypress, cy: Cypress.Cypress['cy']) => {
  let cloudModule = initializedModule

  if (!cloudModule) {
    cloudModule = await initializeModule(Cypress, cy)
  }

  return cloudModule.createCyPrompt({
    Cypress,
    cy,
    eventManager: window.getEventManager(),
  })
}

export default (Commands, Cypress, cy) => {
  if (Cypress.config('experimentalPromptCommand')) {
    const initializeCloudCyPromptPromise = initializeCloudCyPrompt(Cypress, cy)

    Commands.addAll({
      async prompt (message: string, options: object = {}) {
        try {
          const cyPrompt = await initializeCloudCyPromptPromise

          return await cyPrompt(message, options)
        } catch (error) {
          // TODO: handle this better
          throw new Error(`CyPromptDriver not found: ${error}`)
        }
      },
    })
  }
}
