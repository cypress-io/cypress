import Debug from 'debug'
import type { Protocol } from 'devtools-protocol'
import type { ICriClient } from './cri-client'

const debug = Debug('cypress:server:browsers:service-worker-prelude')

type PreludeClient = Pick<ICriClient, 'send' | 'on' | 'off'>

const pausedEventFor = (sessionId: string) => {
  // CDPConnection rebroadcasts every event under `${method}.${sessionId}`,
  // which ProtocolMapping does not list.
  return `Debugger.paused.${sessionId}` as 'Debugger.paused'
}

/**
 * Runs `expression` in a debugger-paused service worker just before its
 * script does, without touching the script itself.
 *
 * Must be called while the worker is still paused on attach. Nothing here is
 * awaited before the release: a paused worker answers these commands only
 * once it runs, and the session delivers them ahead of
 * Runtime.runIfWaitingForDebugger, so the breakpoint is in place before the
 * first script executes. The breakpoint also fires for importScripts, so it
 * is removed before resuming, and the Debugger domain is disabled afterwards
 * so a `debugger` statement in the worker never pauses it.
 */
export const armServiceWorkerPrelude = (client: PreludeClient, sessionId: string, expression: string): void => {
  const eventName = pausedEventFor(sessionId)

  const send = (command: Parameters<PreludeClient['send']>[0], params?: object) => {
    return client.send(command as any, params as any, sessionId).catch((err) => {
      debug('%s failed on service worker session %s: %s', command, sessionId, err?.message ?? err)
    })
  }

  void send('Debugger.enable')

  // Answered by the time the worker pauses on it, since it has to be running
  // to pause.
  const breakpointSet = send('Debugger.setInstrumentationBreakpoint', { instrumentation: 'beforeScriptExecution' }) as Promise<Protocol.Debugger.SetInstrumentationBreakpointResponse | undefined>

  const onPaused = async (params: Protocol.Debugger.PausedEvent) => {
    client.off(eventName, onPaused)

    const callFrameId = params.callFrames[0]?.callFrameId

    debug('service worker session %s paused (%s, %d call frames, data %o), evaluating prelude', sessionId, params.reason, params.callFrames.length, params.data)

    const result = await (callFrameId
      ? send('Debugger.evaluateOnCallFrame', { callFrameId, expression, silent: true })
      : send('Runtime.evaluate', { expression, silent: true })) as Protocol.Runtime.EvaluateResponse | undefined

    debug('prelude evaluated on service worker session %s', sessionId)

    if (result?.exceptionDetails) {
      debug('prelude threw on service worker session %s: %o', sessionId, result.exceptionDetails)
    }

    const breakpoint = await breakpointSet

    if (breakpoint?.breakpointId) {
      await send('Debugger.removeBreakpoint', { breakpointId: breakpoint.breakpointId })
    }

    await send('Debugger.resume')
    await send('Debugger.disable')
  }

  client.on(eventName, onPaused)
}
