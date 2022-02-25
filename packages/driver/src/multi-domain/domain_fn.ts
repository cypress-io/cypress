import type { $Cy } from '../cypress/cy'
import type { SpecBridgeDomainCommunicator } from './communicator'
import $errUtils from '../cypress/error_utils'
import $utils from '../cypress/utils'
import { syncConfigToCurrentDomain, syncEnvToCurrentDomain } from '../util/config'

interface RunDomainFnOptions {
  config: Cypress.Config
  data: any[]
  env: Cypress.ObjectLike
  fn: string
  skipConfigValidation: boolean
  state: {}
}

export const handleDomainFn = (Cypress: Cypress.Cypress, cy: $Cy, specBridgeCommunicator: SpecBridgeDomainCommunicator) => {
  const reset = (state) => {
    cy.reset({})

    const stateUpdates = {
      ...state,
      redirectionCount: {}, // This is fine to set to an empty object, we want to refresh this count on each switchToDomain command.
      runnable: {
        ...state.runnable,
        titlePath: () => state.runnable.titlePath,
        clearTimeout () {},
        resetTimeout () {},
        timeout () {},
        isPending () {},
      },
    }

    // the viewport could've changed in the primary, so sync it up in the secondary
    Cypress.multiDomainCommunicator.emit('sync:viewport', { viewportWidth: state.viewportWidth, viewportHeight: state.viewportHeight })

    // Update the state with the necessary values from the primary domain
    cy.state(stateUpdates)

    // Set the state ctx to the runnable ctx to ensure they remain in sync
    cy.state('ctx', cy.state('runnable').ctx)

    // Stability is always false when we start as the page will always be
    // loading at this point
    cy.isStable(false, 'multi-domain-start')
  }

  specBridgeCommunicator.on('run:domain:fn', async (options: RunDomainFnOptions) => {
    const { config, data, env, fn, state, skipConfigValidation } = options

    let queueFinished = false

    reset(state)

    // @ts-ignore
    window.__cySkipValidateConfig = skipConfigValidation || false

    // resync the config/env before running the domain:fn
    syncConfigToCurrentDomain(config)
    syncEnvToCurrentDomain(env)

    cy.state('onFail', (err) => {
      if (queueFinished) {
        // If the queue is already finished, send this event instead because
        // the primary won't be listening for 'queue:finished' anymore
        specBridgeCommunicator.toPrimary('uncaught:error', { err })

        return
      }

      cy.stop()
      specBridgeCommunicator.toPrimary('queue:finished', { err }, { syncConfig: true })
    })

    try {
      const value = window.eval(`(${fn})`)(data)

      // If we detect a non promise value with commands in queue, throw an error
      if (value && cy.queue.length > 0 && !value.then) {
        $errUtils.throwErrByPath('switchToDomain.callback_mixes_sync_and_async', {
          args: { value: $utils.stringify(value) },
        })
      } else {
        const hasCommands = !!cy.queue.length

        // If there are queued commands, their yielded value will be preferred
        // over the value resolved by a return promise. Don't send the subject
        // or the primary will think we're done already with a sync-returned
        // value
        const subject = hasCommands ? undefined : await value

        specBridgeCommunicator.toPrimary('ran:domain:fn', {
          subject,
          finished: !hasCommands,
        }, {
          // Only sync the config if there are no commands in queue
          // (for instance, only assertions exist in the callback)
          // since it means the callback is finished at this point
          syncConfig: !hasCommands,
        })

        if (!hasCommands) {
          queueFinished = true

          return
        }
      }
    } catch (err) {
      specBridgeCommunicator.toPrimary('ran:domain:fn', { err }, { syncConfig: true })

      return
    }

    cy.queue.run()
    .then(() => {
      queueFinished = true
      specBridgeCommunicator.toPrimary('queue:finished', {
        subject: cy.state('subject'),
      }, {
        syncConfig: true,
      })
    })
  })
}
