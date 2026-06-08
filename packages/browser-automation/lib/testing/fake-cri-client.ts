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

  send: SendDebuggerCommand = async (command, params) => {
    this.sent.push({ command, params: params as object | undefined })

    return undefined as any
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
    resourceType: 'Document',
    ...overrides,
  }
}
