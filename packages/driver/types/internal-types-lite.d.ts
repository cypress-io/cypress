/// <reference path="./cy/logGroup.d.ts" />
/// <reference path="./cypress/log.d.ts" />

// All of the types needed by packages/app, without any of the additional APIs used in the driver only

declare namespace Cypress {
  interface Actions {
    (action: 'internal:window:load', fn: (details: InternalWindowLoadDetails) => void)
    (action: 'net:stubbing:event', frame: any)
    (action: 'request:event', data: any)
    (action: 'backend:request', fn: (...any) => void)
    (action: 'automation:request', fn: (...any) => void)
    (action: 'viewport:changed', fn?: (viewport: { viewportWidth: string, viewportHeight: string }, callback: () => void) => void)
    (action: 'before:screenshot', fn: (config: {}, fn: () => void) => void)
    (action: 'after:screenshot', config: {})
  }

  interface cy {
    /**
     * If `as` is chained to the current command, return the alias name used.
     */
    getNextAlias: IAliases['getNextAlias']
    noop: <T>(v: T) => Cypress.Chainable<T>
    now: <T>(string, v: T) => Cypress.Chainable<T>
    queue: CommandQueue
    retry: IRetries['retry']
    state: State
    pauseTimers: ITimer['pauseTimers']
    // TODO: this function refers to clearTimeout at cy/timeouts.ts, which doesn't have any argument.
    // But in many cases like cy/commands/screenshot.ts, it's called with a timeout id string.
    // We should decide whether calling with id is correct or not.
    clearTimeout: ITimeouts['clearTimeout']
    isStable: IStability['isStable']
    fail: (err: Error, options: { async?: boolean }) => Error
    getRemoteLocation: ILocation['getRemoteLocation']
    subjectChain: (chainerId?: string) => SubjectChain

    createSnapshot: ISnapshots['createSnapshot']
    getStyles: ISnapshots['getStyles']
  }
}
