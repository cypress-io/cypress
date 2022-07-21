import * as React from 'react'
import * as ReactDOM from 'react-dom'
import getDisplayName from './getDisplayName'
import {
  injectStylesBeforeElement,
  StyleOptions,
  getContainerEl,
  ROOT_SELECTOR,
  setupHooks,
} from '@cypress/mount-utils'

/**
 * Inject custom style text or CSS file or 3rd party style resources
 */
const injectStyles = (options: MountOptions) => {
  return (): HTMLElement => {
    const el = getContainerEl()

    return injectStylesBeforeElement(options, document, el)
  }
}

/**
 * Mount a React component in a blank document; register it as an alias
 * To access: use an alias or original component reference
 * @function   mount
 * @param      {React.ReactElement}  jsx - component to mount
 * @param      {MountOptions}  [options] - options, like alias, styles
 * @see https://github.com/bahmutov/@cypress/react
 * @see https://glebbahmutov.com/blog/my-vision-for-component-tests/
 * @example
 ```
  import Hello from './hello.jsx'
  import { mount } from '@cypress/react'
  it('works', () => {
    mount(<Hello onClick={cy.stub()} />)
    // use Cypress commands
    cy.contains('Hello').click()
  })
 ```
 **/
export const mount = (jsx: React.ReactNode, options: MountOptions = {}) => _mount('mount', jsx, options)

let lastMountedReactDom: (typeof ReactDOM) | undefined

/**
 * @see `mount`
 * @param type The type of mount executed
 * @param rerenderKey If specified, use the provided key rather than generating a new one
 */
const _mount = (type: 'mount' | 'rerender', jsx: React.ReactNode, options: MountOptions = {}, rerenderKey?: string): globalThis.Cypress.Chainable<MountReturn> => {
  // Get the display name property via the component constructor
  // @ts-ignore FIXME
  const componentName = getDisplayName(jsx.type, options.alias)
  const displayName = options.alias || componentName

  const jsxComponentName = `<${componentName} ... />`

  const message = options.alias
    ? `${jsxComponentName} as "${options.alias}"`
    : jsxComponentName

  return cy
  .then(injectStyles(options))
  .then(() => {
    const reactDomToUse = options.ReactDom || ReactDOM

    lastMountedReactDom = reactDomToUse

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

    reactDomToUse.render(reactComponent, el)

    if (options.log !== false) {
      Cypress.log({
        name: type,
        type: 'parent',
        message: [message],
        // @ts-ignore
        $el: (el.children.item(0) as unknown) as JQuery<HTMLElement>,
        consoleProps: () => {
          return {
            // @ts-ignore protect the use of jsx functional components use ReactNode
            props: jsx.props,
            description: type === 'mount' ? 'Mounts React component' : 'Rerenders mounted React component',
            home: 'https://github.com/cypress-io/cypress',
          }
        },
      }).snapshot('mounted').end()
    }

    return (
      // Separate alias and returned value. Alias returns the component only, and the thenable returns the additional functions
      cy.wrap<React.ReactNode>(userComponent, { log: false })
      .as(displayName)
      .then(() => {
        return cy.wrap<MountReturn>({
          component: userComponent,
          rerender: (newComponent) => _mount('rerender', newComponent, options, key),
          unmount: () => _unmount({ boundComponentMessage: jsxComponentName, log: true }),
        }, { log: false })
      })
      // by waiting, we delaying test execution for the next tick of event loop
      // and letting hooks and component lifecycle methods to execute mount
      // https://github.com/bahmutov/cypress-react-unit-test/issues/200
      .wait(0, { log: false })
    )
  // Bluebird types are terrible. I don't think the return type can be carried without this cast
  }) as unknown as globalThis.Cypress.Chainable<MountReturn>
}

/**
 * Removes the mounted component. Notice this command automatically
 * queues up the `unmount` into Cypress chain, thus you don't need `.then`
 * to call it.
 * @see https://github.com/cypress-io/cypress/tree/develop/npm/react/cypress/component/basic/unmount
 * @example
  ```
  import { mount, unmount } from '@cypress/react'
  it('works', () => {
    mount(...)
    // interact with the component using Cypress commands
    // whenever you want to unmount
    unmount()
  })
  ```
 */
// @ts-ignore
export const unmount = (options = { log: true }): globalThis.Cypress.Chainable<JQuery<HTMLElement>> => _unmount(options)

const _unmount = (options: { boundComponentMessage?: string, log: boolean }) => {
  return cy.then(() => {
    return cy.get(ROOT_SELECTOR, { log: false }).then(($el) => {
      if (lastMountedReactDom) {
        const wasUnmounted = lastMountedReactDom.unmountComponentAtNode($el[0])

        if (wasUnmounted && options.log) {
          Cypress.log({
            name: 'unmount',
            type: 'parent',
            message: [options.boundComponentMessage ?? 'Unmounted component'],
            consoleProps: () => {
              return {
                description: 'Unmounts React component',
                parent: $el[0],
                home: 'https://github.com/cypress-io/cypress',
              }
            },
          })
        }
      }
    })
  })
}

// Cleanup before each run
// NOTE: we cannot use unmount here because
// we are not in the context of a test
const preMountCleanup = () => {
  const el = getContainerEl()

  if (el && lastMountedReactDom) {
    lastMountedReactDom.unmountComponentAtNode(el)
  }
}

/**
 * Creates new instance of `mount` function with default options
 * @function   createMount
 * @param      {MountOptions}  [defaultOptions] - defaultOptions for returned `mount` function
 * @returns    new instance of `mount` with assigned options
 * @example
 * ```
 * import Hello from './hello.jsx'
 * import { createMount } from '@cypress/react'
 *
 * const mount = createMount({ strict: true, cssFile: 'path/to/any/css/file.css' })
 *
 * it('works', () => {
 *   mount(<Hello />)
 *   // use Cypress commands
 *   cy.get('button').should('have.css', 'color', 'rgb(124, 12, 109)')
 * })
 ```
 **/
export const createMount = (defaultOptions: MountOptions) => {
  return (
    element: React.ReactElement,
    options?: MountOptions,
  ) => {
    return mount(element, { ...defaultOptions, ...options })
  }
}

/** @deprecated Should be removed in the next major version */
// TODO: Remove
export default mount

// I hope to get types and docs from functions imported from ./index one day
// but for now have to document methods in both places
// like this: import {mount} from './index'
// TODO: Clean up types
export interface ReactModule {
  name: string
  type: string
  location: string
  source: string
}

export interface MountReactComponentOptions {
  alias: string
  ReactDom: typeof ReactDOM
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

export type MountOptions = Partial<StyleOptions & MountReactComponentOptions>

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
  unmount: () => globalThis.Cypress.Chainable<JQuery<HTMLElement>>
}

/**
 * The `type` property from the transpiled JSX object.
 * @example
 * const { type } = React.createElement('div', null, 'Hello')
 * const { type } = <div>Hello</div>
 */
export interface JSX extends Function {
  displayName: string
}

export declare namespace Cypress {
  interface Cypress {
    stylesCache: any
    React: string
    ReactDOM: string
    Styles: string
    modules: ReactModule[]
  }

  // NOTE: By default, avoiding React.Component/Element typings
  // for many cases, we don't want to import @types/react
  interface Chainable<Subject> {
    // adding quick "cy.state" method to avoid TS errors
    state: (key: string) => any
    // injectReactDOM: () => Chainable<void>
    // copyCompon { ReactDom }entStyles: (component: Symbol) => Chainable<void>
    /**
     * Mount a React component in a blank document; register it as an alias
     * To access: use an alias or original component reference
     *  @function   cy.mount
     *  @param      {Object}  jsx - component to mount
     *  @param      {string}  [Component] - alias to use later
     *  @example
    ```
    import Hello from './hello.jsx'
    // mount and access by alias
    cy.mount(<Hello />, 'Hello')
    // using default alias
    cy.get('@Component')
    // using specified alias
    cy.get('@Hello').its('state').should(...)
    // using original component
    cy.get(Hello)
    ```
    **/
    // mount: (component: Symbol, alias?: string) => Chainable<void>
    get<S = any>(
      alias: string | symbol | Function,
      options?: Partial<any>,
    ): Chainable<any>
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
