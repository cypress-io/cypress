import type { $Cy } from '../cypress/cy'
import $errUtils from '../cypress/error_utils'
import $utils from '../cypress/utils'
import { syncConfigToCurrentOrigin, syncEnvToCurrentOrigin } from '../util/config'
import type { Runnable, Test } from 'mocha'
import { LogUtils } from '../cypress/log'

interface RunOriginFnOptions {
  config: Cypress.Config
  args: any
  env: Cypress.ObjectLike
  fn: string
  skipConfigValidation: boolean
  state: {}
  logCounter: number
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

export const handleOriginFn = (Cypress: Cypress.Cypress, cy: $Cy) => {
  const reset = (state) => {
    cy.reset({})

    const stateUpdates = {
      ...state,
      redirectionCount: {}, // This is fine to set to an empty object, we want to refresh this count on each cy.origin command.
    }

    // Setup the runnable
    stateUpdates.runnable = rehydrateRunnable(state.runnable)

    // the viewport could've changed in the primary, so sync it up in the secondary
    Cypress.primaryOriginCommunicator.emit('sync:viewport', { viewportWidth: state.viewportWidth, viewportHeight: state.viewportHeight })

    // Update the state with the necessary values from the primary origin
    cy.state(stateUpdates)

    // Set the state ctx to the runnable ctx to ensure they remain in sync
    cy.state('ctx', cy.state('runnable').ctx)
  }

  const setRunnableStateToPassed = () => {
    // HACK: We're telling the runnable that it has passed to avoid a timeout
    // on the last (empty) command. Normally this would be set inherently by
    // running runnable.run() the test. Set this to passed regardless of the
    // state of the test, the runnable isn't responsible for reporting success.
    cy.state('runnable').state = 'passed'
  }

  Cypress.specBridgeCommunicator.on('run:origin:fn', async (options: RunOriginFnOptions) => {
    const { config, args, env, fn, state, skipConfigValidation, logCounter } = options

    let queueFinished = false

    reset(state)

    // Set the counter for log ids
    LogUtils.setCounter(logCounter)

    // @ts-ignore
    window.__cySkipValidateConfig = skipConfigValidation || false

    // resync the config/env before running the origin:fn
    syncConfigToCurrentOrigin(config)
    syncEnvToCurrentOrigin(env)

    cy.state('onQueueEnd', () => {
      queueFinished = true
      setRunnableStateToPassed()
      Cypress.specBridgeCommunicator.toPrimary('queue:finished', {
        subject: cy.currentSubject(),
      }, {
        syncGlobals: true,
      })
    })

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
      const value = window.eval(`(${fn})`)(args)

      // If we detect a non promise value with commands in queue, throw an error
      if (value && cy.queue.length > 0 && !value.then) {
        $errUtils.throwErrByPath('origin.callback_mixes_sync_and_async', {
          args: { value: $utils.stringify(value) },
        })
      } else {
        const hasCommands = !!cy.queue.length

        // If there are queued commands, their yielded value will be preferred
        // over the value resolved by a return promise. Don't send the subject
        // or the primary will think we're done already with a sync-returned
        // value
        const subject = hasCommands ? undefined : await value

        Cypress.specBridgeCommunicator.toPrimary('ran:origin:fn', {
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
      Cypress.specBridgeCommunicator.toPrimary('ran:origin:fn', { err }, { syncGlobals: true })

      return
    }
  })
}
