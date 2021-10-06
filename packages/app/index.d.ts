import type { AutIframe } from '@packages/runner-shared/src/iframe/aut-iframe'
import type { Store } from './src/store'

interface ConnectionInfo { 
  automationElement: '__cypress-string',
  randomString: string 
}

export {}

/**
 * The eventManager and driver are bundled separately
 * by webpack. We cannot import them because of
 * circular dependencies.
 * To work around this, we build the driver, eventManager
 * and some other dependencies using webpack, and consumed the dist'd
 * source code.
 * 
 * This is attached to `window` under the `UnifiedRunner` namespace.
 * 
 * For now, just declare the types that we need to give us type safety where possible.
 * Eventually, we should decouple the event manager and import it directly.
 */
declare global {
  interface Window {
    UnifiedRunner: {
      /**
       * decode config, which we receive as a base64 string
       * This comes from Driver.utils
       */
      decodeBase64: (base64: string) => Record<string, unknown>

      /**
       * Proxy event to the reporter via `Reporter.defaultEvents.emit`
       */
      emit (evt: string, ...args: unknown[]): void

      /**
       * This is the eventManager which orchestrates all the communication
       * between the reporter, driver, and server, as well as handle
       * setup, teardown and running of specs.
       * 
       * It's only used on the "Runner" part of the unified runner.
       */
      eventManager: {
        addGlobalListeners: (state: Store, connectionInfo: ConnectionInfo) => void
        setup: (config: Record<string, unknown>) => void
        initialize: ($autIframe: JQuery<HTMLIFrameElement>, config: Record<string, unknown>) => void
        teardown: (state: Store) => Promise<void>
        teardownReporter: () => Promise<void>
        [key: string]: any
      }

      AutIframe: typeof AutIframe
    }
  }
}