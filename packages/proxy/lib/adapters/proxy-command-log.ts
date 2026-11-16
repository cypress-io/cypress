import type { CommandLogInterceptionInput, CommandLogInterceptionResult, ForCommandLog } from '@packages/network-interception'
import { sendToDriver } from './send-to-driver'
import type { RequestInterceptionMiddlewareCtx } from './types'

/** Server-side {@link ForCommandLog} adapter — emits incoming request events to the driver. */
export class ProxyCommandLogAdapter implements ForCommandLog {
  notifyIncomingRequest (ctx: unknown): void {
    sendToDriver(ctx as RequestInterceptionMiddlewareCtx)
  }

  logInterception (_input: CommandLogInterceptionInput): CommandLogInterceptionResult {
    return undefined
  }
}
