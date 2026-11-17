import type { Protocol } from 'devtools-protocol'
import { describe, expect, it, vi } from 'vitest'
import { armServiceWorkerPrelude } from '../../../lib/browsers/cdp-protocol/service-worker-prelude'

const sessionId = '6F1C2E0A9B7D4C3E8A5F1B2D3C4E5F60'
const expression = 'self.__cypressPreludeRan = true'

function createClient () {
  const sent: string[] = []

  const client = {
    sent,
    send: vi.fn(async (command: string, _params?: unknown, _sessionId?: string): Promise<unknown> => {
      sent.push(command)

      if (command === 'Debugger.setInstrumentationBreakpoint') {
        return { breakpointId: 'instrumentation:beforeScriptExecution' }
      }

      return {}
    }),
    on: vi.fn(),
    off: vi.fn(),
  }

  return client
}

const pausedListener = (client: ReturnType<typeof createClient>) => {
  return client.on.mock.calls.find(([eventName]) => eventName === `Debugger.paused.${sessionId}`)![1] as (event: Partial<Protocol.Debugger.PausedEvent>) => Promise<void>
}

const pausedOnScript = (callFrames: Partial<Protocol.Debugger.CallFrame>[]): Partial<Protocol.Debugger.PausedEvent> => {
  return { reason: 'instrumentation', callFrames: callFrames as Protocol.Debugger.CallFrame[], data: { url: 'https://shop.example.com/sw.js' } }
}

describe('lib/browsers/cdp-protocol/service-worker-prelude', () => {
  it('arms a before-script breakpoint on the worker session without waiting for it to answer', () => {
    const client = createClient()

    client.send.mockImplementation(() => new Promise(() => {}))

    armServiceWorkerPrelude(client as any, sessionId, expression)

    expect(client.send).toHaveBeenCalledWith('Debugger.enable', undefined, sessionId)
    expect(client.send).toHaveBeenCalledWith('Debugger.setInstrumentationBreakpoint', { instrumentation: 'beforeScriptExecution' }, sessionId)
  })

  it('evaluates the prelude in the paused script frame, then removes the breakpoint, resumes and disables the debugger', async () => {
    const client = createClient()

    armServiceWorkerPrelude(client as any, sessionId, expression)
    client.sent.length = 0

    await pausedListener(client)(pausedOnScript([{ callFrameId: 'frame-1' }]))

    expect(client.send).toHaveBeenCalledWith('Debugger.evaluateOnCallFrame', { callFrameId: 'frame-1', expression, silent: true }, sessionId)
    expect(client.send).toHaveBeenCalledWith('Debugger.removeBreakpoint', { breakpointId: 'instrumentation:beforeScriptExecution' }, sessionId)

    // the breakpoint also fires for importScripts, so it has to go before resuming
    expect(client.sent).toEqual(['Debugger.evaluateOnCallFrame', 'Debugger.removeBreakpoint', 'Debugger.resume', 'Debugger.disable'])
  })

  it('evaluates globally when the pause carries no call frame', async () => {
    const client = createClient()

    armServiceWorkerPrelude(client as any, sessionId, expression)

    await pausedListener(client)(pausedOnScript([]))

    expect(client.send).toHaveBeenCalledWith('Runtime.evaluate', { expression, silent: true }, sessionId)
  })

  it('handles only the first pause', async () => {
    const client = createClient()

    armServiceWorkerPrelude(client as any, sessionId, expression)

    const listener = pausedListener(client)

    await listener(pausedOnScript([{ callFrameId: 'frame-1' }]))

    expect(client.off).toHaveBeenCalledWith(`Debugger.paused.${sessionId}`, listener)
  })

  it('still resumes the worker when evaluating the prelude fails', async () => {
    const client = createClient()

    armServiceWorkerPrelude(client as any, sessionId, expression)

    client.send.mockImplementation(async (command: string) => {
      client.sent.push(command)

      if (command === 'Debugger.evaluateOnCallFrame') {
        throw new Error('ProtocolError: Inspected target closed')
      }

      return {}
    })

    await pausedListener(client)(pausedOnScript([{ callFrameId: 'frame-1' }]))

    expect(client.sent).toContain('Debugger.resume')
    expect(client.sent).toContain('Debugger.disable')
  })
})
