import { init, loadRemote } from '@module-federation/runtime'
import type { CypressInternal, CyPromptDriverDefaultShape } from './prompt-driver-types'
import type Emitter from 'component-emitter'
import $errUtils from '../../../cypress/error_utils'
import $stackUtils from '../../../cypress/stack_utils'

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
  const { success, error } = await Cypress.backend('wait:for:prompt:ready')

  if (error) {
    if (error.name === 'ENOSPC') {
      $errUtils.throwErrByPath('prompt.promptDownloadError', {
        args: {
          error,
        },
      })
    } else {
      $errUtils.throwErrByPath('prompt.promptDownloadTimedOut', {
        args: {
          error,
        },
      })
    }
  }

  if (!success && !error) {
    // TODO: Generic error message
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
      entry: '/__cypress-cy-prompt/driver/cy-prompt.js',
      shareScope: 'default',
    }],
    name: 'driver',
  })

  // This cy-prompt.js file and any subsequent files are
  // served from the cy prompt bundle.
  const module = await loadRemote<CyPromptDriver>('cy-prompt')

  if (!module?.default) {
    // TODO: Generic error message
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
      errorUtils: {
        extendErrorMessages: $errUtils.extendErrorMessages,
        throwErrByPath: $errUtils.throwErrByPath,
      },
      getSourceDetailsForFirstLine: $stackUtils.getSourceDetailsForFirstLine,
    })
  } catch (error) {
    return error
  }
}

export default (Commands: Cypress.Cypress['Commands'], Cypress: Cypress.Cypress, cy: Cypress.Cypress['cy']) => {
  // @ts-expect-error - these types are not yet implemented until the prompt command is rolled out
  if (Cypress.config('experimentalPromptCommand')) {
    let initializeCloudCyPromptPromise: Promise<ReturnType<CyPromptDriverDefaultShape['createCyPrompt']> | Error> | undefined

    if (Cypress.browser.family === 'chromium' || Cypress.browser.name === 'electron') {
      initializeCloudCyPromptPromise = initializeCloudCyPrompt(Cypress, cy)
    }

    const prompt = (steps: string | string[], commandOptions: object = {}) => {
      const promptCmd = cy.state('current')

      if (Cypress.testingType === 'component') {
        $errUtils.throwErrByPath('prompt.promptTestingTypeError')

        return
      }

      if (!initializeCloudCyPromptPromise) {
        // TODO: (cy.prompt) We will look into supporting other browsers (and testing them)
        // as this is rolled out
        $errUtils.throwErrByPath('prompt.promptSupportedBrowser')

        return
      }

      // TODO: figure out how to handle timeout more generally
      return cy.wrap(initializeCloudCyPromptPromise, { log: false, timeout: 45000 }).then((bundleResult: ReturnType<CyPromptDriverDefaultShape['createCyPrompt']> | Error) => {
        if (bundleResult instanceof Error) {
          throw bundleResult
        }

        const cyPrompt = bundleResult

        return cyPrompt({
          steps,
          commandOptions,
          promptCmd,
        })
      })
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
