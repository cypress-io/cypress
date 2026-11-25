import type { SocketBroadcaster } from '@packages/socket'

// Far more requests than a test leaves waiting on a response at once. Past it,
// the requests announced earliest are forgotten first.
const MAX_ANNOUNCED_REQUESTS = 10_000

const requestIdOf = (data: unknown): string | undefined => {
  if (typeof data === 'object' && data !== null && 'requestId' in data && typeof data.requestId === 'string') {
    return data.requestId
  }

  return undefined
}

/**
 * Sends events on to the driver, except `response:received` and
 * `request:error` for a request the driver was never sent `incoming:request`
 * for, such as a script or stylesheet that no `cy.intercept()` matched.
 *
 * The driver only logs the requests it was told about and drops these events
 * for any other. Receiving each one still takes time on the browser's main
 * thread, which the page under test runs on too, so a page that loads hundreds
 * of modules waits on hundreds of events the driver has no use for.
 *
 * A request stays known after its response, since an error for it can still
 * follow, and after its error, since a response can still follow. Forgetting
 * requests when a test starts would race the driver, which clears its own list
 * then: a request announced just before the server hears of the new test is
 * one the driver already logged for it.
 */
export class RequestEventFilter implements SocketBroadcaster {
  private readonly announced = new Set<string>()

  constructor (private readonly socket: SocketBroadcaster) {}

  toDriver (event: string, ...args: any[]): void {
    if (event === 'request:event' && !this.shouldSend(args[0], args[1])) {
      return
    }

    this.socket.toDriver(event, ...args)
  }

  /** Forgets every request, for when the driver reloads for the next spec. */
  reset (): void {
    this.announced.clear()
  }

  private shouldSend (eventName: unknown, data: unknown): boolean {
    const requestId = requestIdOf(data)

    switch (eventName) {
      case 'incoming:request':
        if (requestId !== undefined) {
          this.announce(requestId)
        }

        return true
      case 'response:received':
      case 'request:error':
        return requestId !== undefined && this.announced.has(requestId)
      default:
        return true
    }
  }

  private announce (requestId: string): void {
    this.announced.add(requestId)

    if (this.announced.size > MAX_ANNOUNCED_REQUESTS) {
      // A Set iterates in insertion order, so its first entry is the oldest.
      const [oldest] = this.announced

      this.announced.delete(oldest)
    }
  }
}
