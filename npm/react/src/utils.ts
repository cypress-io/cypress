import * as React from 'react'
import type { ReactNode } from 'react'
import {
  getContainerEl,
  ROOT_SELECTOR,
  setupHooks,
  checkForRemovedStyleOptions,
} from '@cypress/mount-utils'

export interface UnmountArgs {
  log: boolean
  boundComponentMessage?: string
}

export type MountOptions = Partial<MountReactComponentOptions>

export interface MountReactComponentOptions {
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
   *
   * Removed as of Cypress 11.0.0.
   * @see https://on.cypress.io/migration-11-0-0-component-testing-updates
   */
  unmount: (payload: UnmountArgs) => void // globalThis.Cypress.Chainable<JQuery<HTMLElement>>
}

let mountCleanup: InternalMountOptions['cleanup']

/**
 * Create an `mount` function. Performs all the non-React-version specific
 * behavior related to mounting. The React-version-specific code
 * is injected. This helps us to maintain a consistent public API
 * and handle breaking changes in React's rendering API.
 *
 * This is designed to be consumed by `npm/react{16,17,18}`, and other React adapters,
 * or people writing adapters for third-party, custom adapters.
 */
export const makeMountFn = (
  type: 'mount' | 'rerender',
  jsx: React.ReactNode,
  options: MountOptions = {},
  rerenderKey?: string,
  internalMountOptions?: InternalMountOptions,
): globalThis.Cypress.Chainable<MountReturn> => {
  if (!internalMountOptions) {
    throw Error('internalMountOptions must be provided with `render` and `reactDom` parameters')
  }

  // @ts-expect-error - this is removed but we want to check if a user is passing it, and error if they are.
  if (options.alias) {
    // @ts-expect-error
    Cypress.utils.throwErrByPath('mount.alias', options.alias)
  }

  checkForRemovedStyleOptions(options)

  mountCleanup = internalMountOptions.cleanup

  return cy
  .then(() => {
    const reactDomToUse = internalMountOptions.reactDom

    const el = getContainerEl()

    if (!el) {
      throw new Error(
        [
          `[@cypress/react] 🔥 Hmm, cannot find root element to mount the component. Searched for ${ROOT_SELECTOR}`,
        ].join(' '),
      )
    }

    const key = rerenderKey ??
        // @ts-ignore provide unique key to the the wrapped component to make sure we are rerendering between tests
        (Cypress?.mocha?.getRunner()?.test?.title as string || '') + Math.random()
    const props = {
      key,
    }

    const reactComponent = React.createElement(
      options.strict ? React.StrictMode : React.Fragment,
      props,
      jsx,
    )
    // since we always surround the component with a fragment
    // let's get back the original component
    const userComponent = (reactComponent.props as {
      key: string
      children: React.ReactNode
    }).children

    internalMountOptions.render(reactComponent, el, reactDomToUse)

    return (
      cy.wrap<React.ReactNode>(userComponent, { log: false })
      .then(() => {
        return cy.wrap<MountReturn>({
          component: userComponent,
          rerender: (newComponent) => makeMountFn('rerender', newComponent, options, key, internalMountOptions),
          unmount: () => {
            // @ts-expect-error - undocumented API
            Cypress.utils.throwErrByPath('mount.unmount')
          },
        }, { log: false })
      })
      // by waiting, we delaying test execution for the next tick of event loop
      // and letting hooks and component lifecycle methods to execute mount
      // https://github.com/bahmutov/cypress-react-unit-test/issues/200
      .wait(0, { log: false })
      .then(() => {
        if (options.log !== false) {
          // Get the display name property via the component constructor
          // @ts-ignore FIXME
          const componentName = getDisplayName(jsx)

          const jsxComponentName = `<${componentName} ... />`

          Cypress.log({
            name: type,
            type: 'parent',
            message: [jsxComponentName],
            // @ts-ignore
            $el: (el.children.item(0) as unknown) as JQuery<HTMLElement>,
            consoleProps: () => {
              return {
              // @ts-ignore protect the use of jsx functional components use ReactNode
                props: jsx?.props,
                description: type === 'mount' ? 'Mounts React component' : 'Rerenders mounted React component',
                home: 'https://github.com/cypress-io/cypress',
              }
            },
          })
        }
      })
    )
  // Bluebird types are terrible. I don't think the return type can be carried without this cast
  }) as unknown as globalThis.Cypress.Chainable<MountReturn>
}

/**
 * Create an `unmount` function. Performs all the non-React-version specific
 * behavior related to unmounting.
 *
 * This is designed to be consumed by `npm/react{16,17,18}`, and other React adapters,
 * or people writing adapters for third-party, custom adapters.
 *
 * @param {UnmountArgs} options used during unmounting
 */
export const makeUnmountFn = (options: UnmountArgs) => {
  return cy.then(() => {
    const wasUnmounted = mountCleanup?.()

    if (wasUnmounted && options.log) {
      Cypress.log({
        name: 'unmount',
        type: 'parent',
        message: [options.boundComponentMessage ?? 'Unmounted component'],
        consoleProps: () => {
          return {
            description: 'Unmounts React component',
            parent: getContainerEl().parentNode,
            home: 'https://github.com/cypress-io/cypress',
          }
        },
      })
    }
  })
}

// Cleanup before each run
// NOTE: we cannot use unmount here because
// we are not in the context of a test
const preMountCleanup = () => {
  mountCleanup?.()
}

const _mount = (jsx: React.ReactNode, options: MountOptions = {}) => makeMountFn('mount', jsx, options)

export const createMount = (defaultOptions: MountOptions) => {
  return (
    element: React.ReactElement,
    options?: MountOptions,
  ) => {
    return _mount(element, { ...defaultOptions, ...options })
  }
}

// Side effects from "import { mount } from '@cypress/<my-framework>'" are annoying, we should avoid doing this
// by creating an explicit function/import that the user can register in their 'component.js' support file,
// such as:
//    import 'cypress/<my-framework>/support'
// or
//    import { registerCT } from 'cypress/<my-framework>'
//    registerCT()
// Note: This would be a breaking change

// it is required to unmount component in beforeEach hook in order to provide a clean state inside test
// because `mount` can be called after some preparation that can side effect unmount
// @see npm/react/cypress/component/advanced/set-timeout-example/loading-indicator-spec.js
setupHooks(preMountCleanup)

type JSX = Function & { displayName: string }

/**
 * Gets the display name of the component when possible.
 * @param type {JSX} The type object returned from creating the react element.
 * @param fallbackName {string} The alias, or fallback name to use when the name cannot be derived.
 * @link https://github.com/facebook/react-devtools/blob/master/backend/getDisplayName.js
 */
export function getDisplayName (
  node: ReactNode,
  fallbackName: string = 'Unknown',
): string {
  const type: JSX | undefined = (node as any)?.type

  if (!type) {
    return fallbackName
  }

  let displayName: string | null = null

  // The displayName property is not guaranteed to be a string.
  // It's only safe to use for our purposes if it's a string.
  // github.com/facebook/react-devtools/issues/803
  if (typeof type.displayName === 'string') {
    displayName = type.displayName
  }

  if (!displayName) {
    displayName = type.name || fallbackName
  }

  // Facebook-specific hack to turn "Image [from Image.react]" into just "Image".
  // We need displayName with module name for error reports but it clutters the DevTools.
  const match = displayName.match(/^(.*) \[from (.*)\]$/)

  if (match) {
    const componentName = match[1]
    const moduleName = match[2]

    if (componentName && moduleName) {
      if (
        moduleName === componentName ||
        moduleName.startsWith(`${componentName}.`)
      ) {
        displayName = componentName
      }
    }
  }

  return displayName
}

/**
 * Mounts a React hook function in a test component for testing.
 * Removed as of Cypress 11.0.0.
 * @see https://on.cypress.io/migration-11-0-0-component-testing-updates
 */
export const mountHook = <T>(hookFn: (...args: any[]) => T) => {
  // @ts-expect-error - internal API
  Cypress.utils.throwErrByPath('mount.mount_hook')
}
