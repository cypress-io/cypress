import type { $Cy } from '../cypress/cy'
import type { SpecBridgeDomainCommunicator } from './communicator'
import $errUtils from '../cypress/error_utils'
import $utils from '../cypress/utils'
import { syncConfigToCurrentDomain, syncEnvToCurrentDomain } from '../util/config'

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
  }

  specBridgeCommunicator.on('run:domain:fn', async ({ data, fn, config, env, state, isDoneFnAvailable = false, skipConfigValidation = false }: { data: any[], fn: string, config: Cypress.Config, env: Cypress.ObjectLike, state: {}, isDoneFnAvailable: boolean, skipConfigValidation: boolean}) => {
    reset(state)

    // @ts-ignore
    window.__cySkipValidateConfig = skipConfigValidation || false

    // resync the config/env before running the domain:fn
    syncConfigToCurrentDomain(config)
    syncEnvToCurrentDomain(env)

    let fnWrapper = `(${fn})`

    if (isDoneFnAvailable) {
      // stub out the 'done' function if available in the primary domain
      // to notify the primary domain if the done() callback is invoked
      // within the spec bridge
      const done = (err = undefined) => {
        doneEarly()

        // signal to the primary domain that done has been called and to signal that the command queue is finished in the secondary domain
        specBridgeCommunicator.toPrimaryError('done:called', { err })

        specBridgeCommunicator.toPrimaryQueueFinished()

        return null
      }

      // similar to the primary domain, the done() callback will be stored in
      // state (necessary for error handling). if undefined and a user tries to
      // call done, the same effect is granted
      cy.state('done', done)

      fnWrapper = `((data) => {
        const done = cy.state('done');
        return ${fnWrapper}(data)
      })`
    }

    cy.state('onFail', (err) => {
      const command = cy.state('current')

      // If there isn't a current command, just reject to fail the test
      if (!command) {
        return specBridgeCommunicator.toPrimaryError('reject', { err })
      }

      const id = command.get('id')
      const name = command.get('name')
      const logId = command.getLastLog()?.get('id')

      specBridgeCommunicator.toPrimaryCommandEnd({ id, name, err, logId })
    })

    try {
      // await the eval func, whether it is a promise or not
      // we should not need to transpile this as our target browsers support async/await
      // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function for more details
      const value = window.eval(fnWrapper)(data)

      // If we detect a non promise value with commands in queue, throw an error
      if (value && cy.queue.length > 0 && !value.then) {
        $errUtils.throwErrByPath('switchToDomain.callback_mixes_sync_and_async', {
          args: { value: $utils.stringify(value) },
        })
      } else {
        const subject = await value

        specBridgeCommunicator.toPrimaryRanDomainFn({
          subject,
          // only sync the config if there are no commands in queue (for instance, only assertions exist in the callback)
          resyncConfig: !(cy.queue.length > 0),
        })
      }
    } catch (err) {
      specBridgeCommunicator.toPrimaryRanDomainFn({
        err,
        resyncConfig: true,
      })
    } finally {
      cy.state('done', undefined)
    }
  })
}
