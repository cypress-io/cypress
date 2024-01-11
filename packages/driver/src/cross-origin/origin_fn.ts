import type { $Cy } from '../cypress/cy'
import $errUtils from '../cypress/error_utils'
import $utils from '../cypress/utils'
import { $Location } from '../cypress/location'
import { syncConfigToCurrentOrigin, syncEnvToCurrentOrigin } from '../util/config'
import type { Runnable, Test } from 'mocha'
import { LogUtils } from '../cypress/log'

interface RunOriginFnOptions {
  config: Cypress.Config
  args: any
  env: Cypress.ObjectLike
  file?: string
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
  _currentRetry: number
  _timeout: number
  titlePath: string
}

interface GetFileResult {
  contents?: string
  error?: string
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
  runnable._currentRetry = data._currentRetry
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

// Callback function handling / preprocessing for dependencies
// ---
// 1. If experimentalOriginDependencies is disabled or the string "Cypress.require"
//    does not exist in the callback, just eval the callback as-is
// 2. Otherwise, we send it to the server
// 3. The server webpacks the callback to bundle in all the deps, then returns
//    that bundle
// 4. Eval the callback like normal
const getCallbackFn = async (fn: string, file?: string) => {
  if (
    // @ts-expect-error
    !Cypress.config('experimentalOriginDependencies')
    || !fn.includes('Cypress.require')
  ) {
    return fn
  }

  // Since webpack will wrap everything up in a closure, we create a variable
  // in the outer scope (see the return value below), assign the function to it
  // in the inner scope, then call the function with the args
  const callbackName = '__cypressCallback'

  const response = await fetch('/__cypress/process-origin-callback', {
    body: JSON.stringify({
      file,
      fn: `${callbackName} = ${fn};`,
      projectRoot: Cypress.config('projectRoot'),
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
  const result = await response.json() as GetFileResult

  if (result.error) {
    $errUtils.throwErrByPath('origin.failed_to_get_callback', {
      args: { error: result.error },
    })
  }

  return `(args) => {
    let ${callbackName};
    ${result.contents};
    return ${callbackName}(args);
  }`
}

export const handleOriginFn = (Cypress: Cypress.Cypress, cy: $Cy) => {
  const reset = (state) => {
    cy.reset({})

    const stateUpdates = {
      ...state,
      autLocation: $Location.create(state.autLocation),
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
    const { config, args, env, file, fn, state, skipConfigValidation, logCounter } = options

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
        subject: cy.subject(),
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

    // the name of this function is used to verify if privileged commands are
    // properly called. it shouldn't be removed and if the name is changed, it
    // needs to also be changed in server/lib/browsers/privileged-channel.js
    function invokeOriginFn (callback) {
      return window.eval(`(${callback})`)(args)
    }

    try {
      const callback = await getCallbackFn(fn, file)
      const value = invokeOriginFn(callback)

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
