import type { Protocol } from 'devtools-protocol'
import type { CdpCommand, CriClient, CriClientEnableCommand, OffFn, OnFn, SendDebuggerCommand } from '../cdp/cri-client'

type SentCommand = {
  command: CdpCommand
  params?: object
}

export class FakeCriClient implements CriClient {
  targetId = 'fake-target'
  queue: { enableCommands: CriClientEnableCommand[] } = { enableCommands: [] }

  readonly sent: SentCommand[] = []
  private readonly listeners = new Map<string, Set<(params: unknown) => void>>()
  private fetchDomainEnabled = false

  /** Canned `Fetch.getResponseBody` results keyed by requestId. */
  private readonly responseBodies = new Map<string, Protocol.Fetch.GetResponseBodyResponse>()

  isFetchDomainEnabled = (): boolean => {
    return this.fetchDomainEnabled
  }

  send: SendDebuggerCommand = async (command, params) => {
    this.sent.push({ command, params: params as object | undefined })

    if (command.endsWith('.enable')) {
      this.queue.enableCommands.push({
        command,
        params: params as object | undefined,
      })
    }

    if (command === 'Fetch.enable') {
      this.fetchDomainEnabled = true
    }

    if (command === 'Fetch.disable') {
      this.fetchDomainEnabled = false
    }

    if (command === 'Fetch.getResponseBody') {
      const { requestId } = (params ?? {}) as Protocol.Fetch.GetResponseBodyRequest

      return (this.responseBodies.get(requestId) ?? { body: '', base64Encoded: false }) as any
    }

    return undefined as any
  }

  /** Register the body that `Fetch.getResponseBody` should return for a given requestId. */
  setResponseBody (requestId: string, body: string, base64Encoded = false): void {
    this.responseBodies.set(requestId, { body, base64Encoded })
  }

  on: OnFn = (eventName, cb) => {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set())
    }

    this.listeners.get(eventName)!.add(cb as (params: unknown) => void)
  }

  off: OffFn = (eventName, cb) => {
    this.listeners.get(eventName)?.delete(cb as (params: unknown) => void)
  }

  emit (eventName: string, params: unknown): void {
    for (const cb of this.listeners.get(eventName) ?? []) {
      cb(params)
    }
  }

  getCommands (command: CdpCommand): SentCommand[] {
    return this.sent.filter((entry) => entry.command === command)
  }

  getLastCommand (command: CdpCommand): SentCommand | undefined {
    const matches = this.getCommands(command)

    return matches[matches.length - 1]
  }

  listenerCount (eventName: string): number {
    return this.listeners.get(eventName)?.size ?? 0
  }
}

export function createFetchPausedEvent (
  overrides: Partial<Protocol.Fetch.RequestPausedEvent> & {
    request?: Partial<Protocol.Fetch.RequestPausedEvent['request']>
  } = {},
): Protocol.Fetch.RequestPausedEvent {
  return {
    requestId: 'req-1',
    request: {
      url: 'https://example.com/',
      method: 'GET',
      headers: { accept: 'text/html' },
      initialPriority: 'High',
      referrerPolicy: 'strict-origin-when-cross-origin',
      ...overrides.request,
    },
    frameId: 'frame-1',
    resourceType: 'Fetch',
    ...overrides,
  }
}

/**
 * Build a response-stage `Fetch.requestPaused` event (the second pause for a forwarded request).
 * Defaults to a 200 with the same `requestId` as {@link createFetchPausedEvent}.
 */
export function createFetchResponsePausedEvent (
  overrides: Partial<Protocol.Fetch.RequestPausedEvent> & {
    request?: Partial<Protocol.Fetch.RequestPausedEvent['request']>
  } = {},
): Protocol.Fetch.RequestPausedEvent {
  return createFetchPausedEvent({
    responseStatusCode: 200,
    responseStatusText: 'OK',
    responseHeaders: [{ name: 'content-type', value: 'text/html' }],
    ...overrides,
  })
}
