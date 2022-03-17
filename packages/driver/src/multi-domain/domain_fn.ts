import type { $Cy } from '../cypress/cy'
import $errUtils from '../cypress/error_utils'
import $utils from '../cypress/utils'
import { syncConfigToCurrentDomain, syncEnvToCurrentDomain } from '../util/config'
import type { Runnable, Test } from 'mocha'

interface RunDomainFnOptions {
  config: Cypress.Config
  data: any[]
  env: Cypress.ObjectLike
  fn: string
  skipConfigValidation: boolean
  state: { isStable: boolean | undefined }
  isStable: boolean
}

interface serializedRunnable {
  id: string
  type: string
  title: string
  parent: serializedRunnable
  ctx: {}
  _timeout: number
  titlePath: string
}

const rehydrateRunnable = (data: serializedRunnable): Runnable|Test => {
  let runnable

  if (data.type === 'test') {
    runnable = Cypress.mocha.createTest(data.title, () => {})
  } else {
    runnable = new Cypress.mocha._mocha.Mocha.Runnable(data.title)
    runnable.type = data.type
  }

  runnable.ctx = data.ctx
  runnable.id = data.id
  runnable._timeout = data._timeout
  // Short circuit title path to avoid implementing it up the parent chain.
  runnable.titlePath = () => {
    return data.titlePath
  }

  if (data.parent) {
    runnable.parent = rehydrateRunnable(data.parent)
  }

  // This is normally setup in the run command, but we don't call run.
  // Any errors this would be reporting will already have been reported previously
  runnable.callback = () => {}

  return runnable
}

export const handleDomainFn = (Cypress: Cypress.Cypress, cy: $Cy) => {
  const reset = (state) => {
    // If stability is true in this domain, that means this domain has loaded itself, in that case trust the domain and run the next command.
    // We also wish to preserve the stability state through the state refresh.
    if (cy.state('isStable')) {
      // If this state is stable there is a good chance that the primary domain was not listening, resend the load event.
      Cypress.specBridgeCommunicator.toPrimary('window:load', { url: cy.getRemoteLocation('href') })

      state.isStable = true
    } else {
      // We specifically don't call 'cy.isStable' here because we don't want to inject another load event.
      if (state.isStable) {
        // If stability is established in a different domain, set this domain to undefined
        state.isStable = undefined
      }
    }

    cy.reset({})

    const stateUpdates = {
      ...state,
      redirectionCount: {}, // This is fine to set to an empty object, we want to refresh this count on each switchToDomain command.
    }

    // Setup the runnable
    stateUpdates.runnable = rehydrateRunnable(state.runnable)

    // the viewport could've changed in the primary, so sync it up in the secondary
    Cypress.multiDomainCommunicator.emit('sync:viewport', { viewportWidth: state.viewportWidth, viewportHeight: state.viewportHeight })

    // Update the state with the necessary values from the primary domain
    cy.state(stateUpdates)

    // Set the state ctx to the runnable ctx to ensure they remain in sync
    cy.state('ctx', cy.state('runnable').ctx)
  }

  const setRunnableStateToPassed = () => {
    // TODO: We're telling the runnable that it has passed to avoid a timeout on the last (empty) command. Normally this would be set inherently by running (runnable.run) the test.
    // Set this to passed regardless of the state of the test, the runnable isn't responsible for reporting success.
    cy.state('runnable').state = 'passed'
  }

  Cypress.specBridgeCommunicator.on('run:domain:fn', async (options: RunDomainFnOptions) => {
    const { config, data, env, fn, state, skipConfigValidation } = options

    let queueFinished = false

    reset(state)

    // @ts-ignore
    window.__cySkipValidateConfig = skipConfigValidation || false

    // resync the config/env before running the domain:fn
    syncConfigToCurrentDomain(config)
    syncEnvToCurrentDomain(env)

    cy.state('onFail', (err) => {
      setRunnableStateToPassed()
      if (queueFinished) {
        // If the queue is already finished, send this event instead because
        // the primary won't be listening for 'queue:finished' anymore
        Cypress.specBridgeCommunicator.toPrimary('uncaught:error', { err })

        return
      }

      cy.stop()
      Cypress.specBridgeCommunicator.toPrimary('queue:finished', { err }, { syncGlobals: true })
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

        Cypress.specBridgeCommunicator.toPrimary('ran:domain:fn', {
          subject,
          finished: !hasCommands,
        }, {
          // Only sync the globals if there are no commands in queue
          // (for instance, only assertions exist in the callback)
          // since it means the callback is finished at this point
          syncGlobals: !hasCommands,
        })

        if (!hasCommands) {
          queueFinished = true
          setRunnableStateToPassed()

          return
        }
      }
    } catch (err) {
      setRunnableStateToPassed()
      Cypress.specBridgeCommunicator.toPrimary('ran:domain:fn', { err }, { syncGlobals: true })

      return
    }

    cy.queue.run()
    .then(() => {
      queueFinished = true
      setRunnableStateToPassed()
      Cypress.specBridgeCommunicator.toPrimary('queue:finished', {
        subject: cy.state('subject'),
      }, {
        syncGlobals: true,
      })
    })
  })
}
