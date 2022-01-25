import type { $Cy } from '../cypress/cy'
import type { SpecBridgeDomainCommunicator } from './communicator'

export const handleDomainFn = (cy: $Cy, specBridgeCommunicator: SpecBridgeDomainCommunicator) => {
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

  const reset = () => {
    cy.reset({})

    const runnable = {
      ctx: {},
      clearTimeout () {},
      resetTimeout () {},
      timeout () {},
      isPending () {},
    }

    cy.state('runnable', runnable)
    // Set the state ctx to the runnable ctx to ensure they remain in sync
    cy.state('ctx', runnable.ctx)
  }

  specBridgeCommunicator.on('run:domain:fn', async ({ data, fn, isDoneFnAvailable = false }: { data: any[], fn: string, isDoneFnAvailable: boolean }) => {
    reset()

    let fnWrapper = `(${fn})`

    if (isDoneFnAvailable) {
      // stub out the 'done' function if available in the primary domain
      // to notify the primary domain if the done() callback is invoked
      // within the spec bridge
      const done = (err = undefined) => {
        doneEarly()

        // signal to the primary domain that done has been called and to signal that the command queue is finished in the secondary domain
        specBridgeCommunicator.toPrimary('done:called', err)
        specBridgeCommunicator.toPrimary('queue:finished')

        return null
      }

      // similar to the primary domain, the done() callback will be stored in state
      // if undefined and a user tries to call done, the same effect is granted
      cy.state('done', done)

      fnWrapper = `((data) => {
        const done = cy.state('done');
        return ${fnWrapper}(data)
      })`
    }

    try {
      // await the eval func, whether it is a promise or not
      // we should not need to transpile this as our target browsers support async/await
      // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function for more details
      await window.eval(fnWrapper)(data)

      specBridgeCommunicator.toPrimary('ran:domain:fn')
    } catch (err) {
      // Native Error types currently cannot be cloned in Firefox when using 'postMessage'.
      // Please see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm for more details
      // TODO: More standard serialization of Objects/Arrays within the communicator to avoid this type of logic
      if (err instanceof Error) {
        specBridgeCommunicator.toPrimary('ran:domain:fn', {
          name: err.name,
          message: err.message,
          stack: err.stack,
        })
      } else {
        specBridgeCommunicator.toPrimary('ran:domain:fn', err)
      }
    } finally {
      cy.state('done', undefined)
    }
  })
}
