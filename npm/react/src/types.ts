import type React from 'react'
import type { StyleOptions } from '@cypress/mount-utils'

export interface UnmountArgs {
  log: boolean
  boundComponentMessage?: string
}

export type MountOptions = Partial<StyleOptions & MountReactComponentOptions>

export interface MountReactComponentOptions {
  alias: string
  ReactDom: typeof import('react-dom')
  /**
   * Log the mounting command into Cypress Command Log,
   * true by default.
   */
  log: boolean
  /**
   * Render component in React [strict mode](https://reactjs.org/docs/strict-mode.html)
   * It activates additional checks and warnings for child components.
   */
  strict: boolean
}

export interface InternalMountOptions {
  reactDom: typeof import('react-dom')
  render: (
    reactComponent: ReturnType<typeof React.createElement>,
    el: HTMLElement,
    reactDomToUse: typeof import('react-dom')
  ) => void
  unmount: (options: UnmountArgs) => void
  cleanup: () => boolean

  // globalThis.Cypress.Chainable<MountReturn>
}

export interface MountReturn {
  /**
   * The component that was rendered.
   */
  component: React.ReactNode
  /**
   * Rerenders the specified component with new props. This allows testing of components that store state (`setState`)
   * or have asynchronous updates (`useEffect`, `useLayoutEffect`).
   */
  rerender: (component: React.ReactNode) => globalThis.Cypress.Chainable<MountReturn>
  /**
   * Removes the mounted component.
   * @see `unmount`
   */
  // @ts-ignore
  unmount: (payload: UnmountArgs) => void // globalThis.Cypress.Chainable<JQuery<HTMLElement>>
}
