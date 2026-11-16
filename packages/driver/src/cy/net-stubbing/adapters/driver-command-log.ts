import type {
  CommandLogInterceptionInput,
  CommandLogInterceptionResult,
  ForCommandLog,
} from '@packages/network-interception'

type DriverCommandLogAdapterOptions = {
  logInterception: (interception: unknown, route: unknown) => CommandLogInterceptionResult
}

/** Driver-side {@link ForCommandLog} adapter — delegates to {@link Cypress.ProxyLogging}. */
export class DriverCommandLogAdapter implements ForCommandLog {
  constructor (private readonly options: DriverCommandLogAdapterOptions) {}

  notifyIncomingRequest (_ctx: unknown): void {
    // Server-side only — driver receives incoming requests via socket events.
  }

  logInterception (input: CommandLogInterceptionInput): CommandLogInterceptionResult {
    return this.options.logInterception(input.interception, input.route)
  }
}
