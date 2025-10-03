import { init, loadRemote } from '@module-federation/runtime'
import type { CypressInternal, CyPromptDriverDefaultShape, CyPromptMoreInfoNeededOptions } from './prompt-driver-types'
import type Emitter from 'component-emitter'
import $errUtils from '../../../cypress/error_utils'
import $stackUtils from '../../../cypress/stack_utils'
import { isNonRetriableCertErrorCode } from '@packages/server/lib/cloud/network/non_retriable_cert_error_codes'

interface CyPromptDriver { default: CyPromptDriverDefaultShape }

declare global {
  interface Window {
    getEventManager?: () => {
      ws: Emitter
      localBus: Emitter
    }
  }
}

interface BundleResultInError {
  error: Error
  timedOut: false
}

interface BundleResultTimedOut {
  error: undefined
  timedOut: true
}

interface BundleResultSuccess {
  error: undefined
  bundle: Awaited<ReturnType<CyPromptDriverDefaultShape['createCyPrompt']>>
  timedOut: false
}

type BundleResult = BundleResultInError | BundleResultTimedOut | BundleResultSuccess

let initializedModule: CyPromptDriverDefaultShape | null = null
const initializeModule = async (Cypress: Cypress.Cypress): Promise<CyPromptDriverDefaultShape> => {
  // Wait for the cy prompt bundle to be downloaded and ready
  const { success, error } = await Cypress.backend('wait:for:prompt:ready')

  if (error) {
    if ('code' in error && isNonRetriableCertErrorCode(error.code as string)) {
      $errUtils.throwErrByPath('prompt.promptProxyError', {
        args: {
          error,
        },
      })
    }

    $errUtils.throwErrByPath('prompt.promptDownloadError', {
      args: {
        error,
      },
    })
  }

  if (!success && !error) {
    $errUtils.throwErrByPath('prompt.promptDownloadError', {
      args: {
        error: new Error('error waiting for cy prompt bundle to be downloaded and ready'),
      },
    })
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
    $errUtils.throwErrByPath('prompt.promptDownloadError', {
      args: {
        error: new Error('error loading cy prompt driver'),
      },
    })
  }

  initializedModule = module!.default

  return initializedModule
}

const initializeCloudCyPrompt = async (Cypress: Cypress.Cypress, cy: Cypress.Cypress['cy']): Promise<BundleResult> => {
  try {
    let cloudModule = initializedModule

    if (!cloudModule) {
      cloudModule = await initializeModule(Cypress)
    }

    if (!Cypress.isCrossOriginSpecBridge) {
      Cypress.primaryOriginCommunicator.removeAllListeners('prompt:more-info-needed')
      Cypress.primaryOriginCommunicator.on('prompt:more-info-needed', ({ testId, logId, onSave, onCancel }: CyPromptMoreInfoNeededOptions) => {
        window.getEventManager!().localBus.emit('prompt:more-info-needed', { testId, logId, onSave, onCancel })
      })

      Cypress.primaryOriginCommunicator.removeAllListeners('get:source:details:for:line')
      Cypress.primaryOriginCommunicator.on('get:source:details:for:line', ({ line, projectRoot }, { origin, responseEvent }) => {
        const sourceDetails = $stackUtils.getSourceDetailsForFirstLine(line, projectRoot)

        Cypress.primaryOriginCommunicator.toSpecBridge(origin, responseEvent, sourceDetails)
      })
    }

    return {
      bundle: await cloudModule.createCyPrompt({
        Cypress: Cypress as CypressInternal,
        cy,
        eventManager: window.getEventManager ? window.getEventManager() : undefined,
        errorUtils: {
          extendErrorMessages: $errUtils.extendErrorMessages,
          throwErrByPath: $errUtils.throwErrByPath,
        },
        getSourceDetailsForFirstLine: (line, projectRoot) => {
          if (Cypress.isCrossOriginSpecBridge) {
            return Cypress.specBridgeCommunicator.toPrimaryPromise({
              event: 'get:source:details:for:line',
              data: { line, projectRoot },
              timeout: Cypress.config().defaultCommandTimeout,
            })
          }

          return $stackUtils.getSourceDetailsForFirstLine(line, projectRoot)
        },
        onMoreInfoNeeded: ({ testId, logId, onSave, onCancel }: CyPromptMoreInfoNeededOptions) => {
          if (Cypress.isCrossOriginSpecBridge) {
            Cypress.specBridgeCommunicator.toPrimary('prompt:more-info-needed', { testId, logId, onSave, onCancel })
          } else {
            window.getEventManager!().localBus.emit('prompt:more-info-needed', { testId, logId, onSave, onCancel })
          }
        },
      }),
      error: undefined,
      timedOut: false,
    }
  } catch (error) {
    return {
      error,
      bundle: undefined,
      timedOut: false,
    }
  }
}

export default (Commands: Cypress.Cypress['Commands'], Cypress: Cypress.Cypress, cy: Cypress.Cypress['cy']) => {
  // @ts-expect-error - these types are not yet implemented until the prompt command is rolled out
  if (Cypress.config('experimentalPromptCommand')) {
    let initializeCloudCyPromptPromise = initializeCloudCyPrompt(Cypress, cy)

    const commands = {
      prompt (steps: string[], commandOptions: object = {}) {
        const promptCmd = cy.state('current')

        const downloadTimeout = '_downloadTimeout' in commandOptions ? commandOptions._downloadTimeout as number : 45000

        let timeoutId: NodeJS.Timeout
        const timeoutPromise = new Promise((resolve) => {
          timeoutId = setTimeout(() => {
            resolve({
              error: undefined,
              timedOut: true,
            })
          }, downloadTimeout)
        })
        const raceBundleResult = Promise.race([
          initializeCloudCyPromptPromise,
          timeoutPromise,
        ]).finally(() => {
          clearTimeout(timeoutId)
        }) as Promise<BundleResult>

        return cy.wrap(raceBundleResult, { log: false, timeout: 1e9 }).then((bundleResult: BundleResult) => {
          if (bundleResult.timedOut) {
            cy.state('current', promptCmd)

            return $errUtils.throwErrByPath('prompt.promptDownloadTimedOut', {
              args: {
                error: new Error('cy.prompt bundle download timed out'),
              },
            })
          }

          if (bundleResult.error) {
            cy.state('current', promptCmd)
            throw bundleResult.error
          }

          const cyPrompt = bundleResult.bundle

          return cyPrompt({
            steps,
            commandOptions,
            promptCmd,
          })
        })
      },
    }

    commands.prompt['__resetPrompt'] = async (delay: number = 0) => {
      initializedModule = null
      initializeCloudCyPromptPromise = new Promise((resolve) => setTimeout(resolve, delay)).then(() => initializeCloudCyPrompt(Cypress, cy))
    }

    Commands.addAll(commands)
  } else {
    Commands.addAll({
      prompt () {
        const stack = cy.state('current').get('userInvocationStack')

        if (Cypress.testingType === 'component') {
          $errUtils.throwErrByPath('prompt.promptTestingTypeError', {
            errProps: {
              name: 'PromptTestingTypeError',
            },
            onFail: (err) => {
              err.stack = stack
            },
          })
        }

        $errUtils.throwErrByPath('prompt.experimentalPromptCommandError', {
          errProps: {
            name: 'PromptNotEnabledError',
          },
          onFail: (err) => {
            err.stack = stack
          },
        })
      },
    })
  }
}
