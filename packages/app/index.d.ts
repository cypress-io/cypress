import type { Store } from './src/store'
import type MobX from 'mobx'
import type { AutSnapshot } from '@packages/types'

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

        on (event: 'restart', ...args: unknown[]): void
      }

      /**
       * This is the config served from the back-end.
       * We will manage config using GraphQL going forward,
       * but for now we are also caching it on `window`
       * to be able to move fast and iterate
       */
      config: Record<string, any>

      /**
       * To ensure we are only a single copy of React
       * We get a reference to the copy of React (and React DOM)
       * that is used in the Reporter and Driver, which are bundled with
       * webpack.
       * 
       * Unfortunately, attempting to have React in a project
       * using Vue causes mad conflicts because React'S JSX type
       * is ambient, so we cannot actually type it.
       */
      React: any
      ReactDOM: any

      /**
       * Any React components or general code needed from
       * runner-shared, reporter or driver are also bundled with
       * webpack and made available via the window.UnifedRunner namespace.
       * 
       * We cannot import the correct types, because this causes the linter and type
       * checker to run on runner-shared and reporter, and it blows up.
       */
      AutIframe: new (projectName: string) => {
        create: () => JQuery<HTMLIFrameElement>
        state: Store
        highlightEl: ({ body: unknown }, { $el, coords, highlightAtr, scrollBy }: any) => void
        restoreDom: (snapshot: AutSnapshot) => void
        detachDom: () => void
        showInitialBlankContents: () => void
      }

      IframeModel: new (payload: {
        state: Store
        highlightEl: ({ body: unknown }, { $el, coords, highlightAtr, scrollBy }: any) => void
        restoreDom: (snapshot: AutSnapshot) => void
        detachDom: () => void
        snapshotControls: (snapshotProps: any) => any // 
      }) => {
        listen: () => void
      }

      MobX: typeof MobX

      SnapshotControls: any

      Reporter: any

      shortcuts: {
        stop: () => void
      }
    }
  }
}
