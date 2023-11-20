/// <reference path="../driver/types/internal-types-lite.d.ts" />

import type { SocketShape } from '@packages/socket/lib/types'
import type MobX from 'mobx'
import type { EventManager } from './src/runner/event-manager'

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
    ws?: SocketShape
    getEventManager: () => EventManager
    UnifiedRunner: {
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
      dom: any
      highlight: any
      CypressJQuery: any

      MobX: typeof MobX

      /**
       * Any React components or general code needed from
       * runner, reporter or driver are also bundled with
       * webpack and made available via the window.UnifedRunner namespace.
       *
       * We cannot import the correct types, because this causes the linter and type
       * checker to run on runner and reporter, and it blows up.
       */
      Reporter: any
      shortcuts: {
        stop: () => void
      }
    }
  }
}
