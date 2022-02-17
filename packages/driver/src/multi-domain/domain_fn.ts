import type { $Cy } from '../cypress/cy'
import type { SpecBridgeDomainCommunicator } from './communicator'
import $errUtils from '../cypress/error_utils'
import $utils from '../cypress/utils'

interface RunDomainFnOptions {
  data: any[]
  fn: string
  state: {}
}

export const handleDomainFn = (cy: $Cy, specBridgeCommunicator: SpecBridgeDomainCommunicator) => {
  const reset = (state) => {
    cy.reset({})

    const stateUpdates = {
      ...state,
      redirectionCount: {}, // This is fine to set to an empty object, we want to refresh this count on each switchToDomain command.
      runnable: {
        ...state.runnable,
        clearTimeout () {},
        resetTimeout () {},
        timeout () {},
        isPending () {},
      },
    }

    // Update the state with the necessary values from the primary domain
    cy.state(stateUpdates)

    // Set the state ctx to the runnable ctx to ensure they remain in sync
    cy.state('ctx', cy.state('runnable').ctx)

    // Stability is always false when we start as the page will always be
    // loading at this point
    cy.isStable(false, 'multi-domain-start')
  }

  specBridgeCommunicator.on('run:domain:fn', async ({ data, fn, state }: RunDomainFnOptions) => {
    reset(state)

    cy.state('onFail', (err) => {
      specBridgeCommunicator.toPrimaryWithError('queue:finished', err)
    })

    try {
      const value = window.eval(`(${fn})`)(data)

      // If we detect a non promise value with commands in queue, throw an error
      if (value && cy.queue.length > 0 && !value.then) {
        $errUtils.throwErrByPath('switchToDomain.callback_mixes_sync_and_async', {
          args: { value: $utils.stringify(value) },
        })
      } else {
        // If there are queued commands, their yielded value will be preferred
        // over the value resolved by a return promise. Don't send the subject
        // or the primary will think we're done already with a sync-returned
        // value
        const subject = cy.queue.length ? undefined : await value

        specBridgeCommunicator.toPrimaryWithSubject('ran:domain:fn', subject)
      }
    } catch (err) {
      specBridgeCommunicator.toPrimaryWithError('ran:domain:fn', err)
    } finally {
      cy.state('done', undefined)
    }

    cy.queue.run()
    .then(() => {
      specBridgeCommunicator.toPrimaryWithSubject('queue:finished', cy.state('subject'))
    })
  })
}
