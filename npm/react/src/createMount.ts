import * as React from 'react'
import getDisplayName from './getDisplayName'
import {
  getContainerEl,
  ROOT_SELECTOR,
  setupHooks,
} from '@cypress/mount-utils'
import type { InternalMountOptions, MountOptions, MountReturn, UnmountArgs } from './types'

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
