import { init, loadRemote } from '@module-federation/runtime'
import type{ CyPromptDriverDefaultShape } from './prompt-driver-types'

interface CyPromptDriver { default: CyPromptDriverDefaultShape }

let initializedCyPrompt: CyPromptDriverDefaultShape | null = null
const initializeCloudCyPrompt = async (Cypress: Cypress.Cypress): Promise<CyPromptDriverDefaultShape> => {
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

  initializedCyPrompt = module.default

  return module.default
}

export default (Commands, Cypress, cy) => {
  if (Cypress.config('experimentalPromptCommand')) {
    Commands.addAll({
      async prompt (message: string) {
        try {
          let cloud = initializedCyPrompt

          // If the cy prompt driver is not initialized,
          // we need to wait for it to be initialized
          // before using it
          if (!cloud) {
            cloud = await initializeCloudCyPrompt(Cypress)
          }

          return await cloud.cyPrompt(Cypress, message)
        } catch (error) {
          // TODO: handle this better
          throw new Error(`CyPromptDriver not found: ${error}`)
        }
      },
    })
  }
}
