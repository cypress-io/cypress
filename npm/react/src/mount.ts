import * as React from 'react'
import * as ReactDOM from 'react-dom'
import getDisplayName from './getDisplayName'
import { injectStylesBeforeElement } from './utils'
import { setupHooks } from './hooks'

const ROOT_ID = '__cy_root'

/**
 * Inject custom style text or CSS file or 3rd party style resources
 */
const injectStyles = (options: MountOptions) => {
  return () => {
    const el = document.getElementById(ROOT_ID)

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
  import {mount} from '@cypress/react'
  it('works', () => {
    mount(<Hello onClick={cy.stub()} />)
    // use Cypress commands
    cy.contains('Hello').click()
  })
 ```
 **/
export const mount = (jsx: React.ReactNode, options: MountOptions = {}) => {
  // Get the display name property via the component constructor
  // @ts-ignore FIXME
  const componentName = getDisplayName(jsx.type, options.alias)
  const displayName = options.alias || componentName
  const message = options.alias
    ? `<${componentName} ... /> as "${options.alias}"`
    : `<${componentName} ... />`

  // @ts-ignore
  let logInstance: Cypress.Log

  return cy
  .then(() => {
    if (options.log !== false) {
      logInstance = Cypress.log({
        name: 'mount',
        message: [message],
      })
    }
  })
  .then(injectStyles(options))
  .then(() => {
    const reactDomToUse = options.ReactDom || ReactDOM

    const el = document.getElementById(ROOT_ID)

    if (!el) {
      throw new Error(
        [
          '[@cypress/react] 🔥 Hmm, cannot find root element to mount the component.',
        ].join(' '),
      )
    }

    const key =
        // @ts-ignore provide unique key to the the wrapped component to make sure we are rerendering between tests
        (Cypress?.mocha?.getRunner()?.test?.title || '') + Math.random()
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
    // @ts-ignore
    const userComponent = reactComponent.props.children

    reactDomToUse.render(reactComponent, el)

    if (logInstance) {
      const logConsoleProps = {
        // @ts-ignore protect the use of jsx functional components use ReactNode
        props: jsx.props,
        description: 'Mounts React component',
        home: 'https://github.com/cypress-io/cypress',
      }
      const componentElement = el.children[0]

      if (componentElement) {
        // @ts-ignore
        logConsoleProps.yielded = reactDomToUse.findDOMNode(componentElement)
      }

      logInstance.set('consoleProps', () => logConsoleProps)

      if (el.children.length) {
        logInstance.set(
          '$el',
            (el.children.item(0) as unknown) as JQuery<HTMLElement>,
        )
      }
    }

    return (
      cy
      .wrap(userComponent, { log: false })
      .as(displayName)
      // by waiting, we delaying test execution for the next tick of event loop
      // and letting hooks and component lifecycle methods to execute mount
      // https://github.com/bahmutov/cypress-react-unit-test/issues/200
      .wait(0, { log: false })
      .then(() => {
        if (logInstance) {
          logInstance.snapshot('mounted')
          logInstance.end()
        }

        // by returning undefined we keep the previous subject
        // which is the mounted component
        return undefined
      })
    )
  })
}

/**
 * Removes the mounted component. Notice this command automatically
 * queues up the `unmount` into Cypress chain, thus you don't need `.then`
 * to call it.
 * @see https://github.com/bahmutov/@cypress/react/tree/main/cypress/component/basic/unmount
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
export const unmount = (options = { log: true }) => {
  return cy.then(() => {
    const selector = `#${ROOT_ID}`

    return cy.get(selector, { log: false }).then(($el) => {
      const wasUnmounted = ReactDOM.unmountComponentAtNode($el[0])

      if (wasUnmounted && options.log) {
        cy.log('Unmounted component at', $el)
      }
    })
  })
}

beforeEach(() => {
  unmount()
})

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
export default mount

// I hope to get types and docs from functions imported from ./index one day
// but for now have to document methods in both places
// like this: import {mount} from './index'

export interface ReactModule {
  name: string
  type: string
  location: string
  source: string
}

/**
 * Additional styles to inject into the document.
 * A component might need 3rd party libraries from CDN,
 * local CSS files and custom styles.
 */
export interface StyleOptions {
  /**
   * Creates <link href="..." /> element for each stylesheet
   * @alias stylesheet
   */
  stylesheets: string | string[]
  /**
   * Creates <link href="..." /> element for each stylesheet
   * @alias stylesheets
   */
  stylesheet: string | string[]
  /**
   * Creates <style>...</style> element and inserts given CSS.
   * @alias styles
   */
  style: string | string[]
  /**
   * Creates <style>...</style> element for each given CSS text.
   * @alias style
   */
  styles: string | string[]
  /**
   * Loads each file and creates a <style>...</style> element
   * with the loaded CSS
   * @alias cssFile
   */
  cssFiles: string | string[]
  /**
   * Single CSS file to load into a <style></style> element
   * @alias cssFile
   */
  cssFile: string | string[]
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

// it is required to unmount component in beforeEach hook in order to provide a clean state inside test
// because `mount` can be called after some preparation that can side effect unmount
// @see npm/react/cypress/component/advanced/set-timeout-example/loading-indicator-spec.js
setupHooks(unmount)
