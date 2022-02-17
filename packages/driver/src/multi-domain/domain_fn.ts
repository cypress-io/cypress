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

  const doneEarly = () => {
    cy.queue.stop()

    // we only need to worry about doneEarly when
    // it comes from a manual event such as stopping
    // Cypress or when we yield a (done) callback
    // and could arbitrarily call it whenever we want
    const p = cy.state('promise')

    // if our outer promise is pending
    // then cancel outer and inner
    // and set canceled to be true
    if (p && p.isPending()) {
      cy.state('canceled', true)
      cy.state('cancel')()
    }

    // if a command fails then after each commands
    // could also fail unless we clear this out
    cy.state('commandIntermediateValue', undefined)

    // reset the nestedIndex back to null
    cy.state('nestedIndex', null)
  }

  specBridgeCommunicator.on('run:domain:fn', async ({ data, fn, state }: RunDomainFnOptions) => {
    let queueFinished = false

    reset(state)

    cy.state('onFail', (err) => {
      if (queueFinished) {
        // If the queue is already finished, send this event instead because
        // the primary won't be listening for 'queue:finished' anymore
        specBridgeCommunicator.toPrimaryWithError('uncaught:error', err)

        return
      }

      doneEarly()
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
      queueFinished = true
      specBridgeCommunicator.toPrimaryWithSubject('queue:finished', cy.state('subject'))
    })
  })
}
