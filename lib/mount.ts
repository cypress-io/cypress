import * as React from 'react'
import ReactDOM, { unmountComponentAtNode } from 'react-dom'
import getDisplayName from './getDisplayName'
import { injectStylesBeforeElement } from './utils'

const rootId = 'cypress-root'

const isComponentSpec = () => Cypress.spec.specType === 'component'

function checkMountModeEnabled() {
  if (!isComponentSpec()) {
    throw new Error(
      `In order to use mount or unmount functions please place the spec in component folder`,
    )
  }
}

/**
 * Inject custom style text or CSS file or 3rd party style resources
 */
const injectStyles = (options: MountOptions) => () => {
  const document = cy.state('document')
  const el = document.getElementById(rootId)
  return injectStylesBeforeElement(options, document, el)
}

/**
 * Mount a React component in a blank document; register it as an alias
 * To access: use an alias or original component reference
 * @function   mount
 * @param      {React.ReactElement}  jsx - component to mount
 * @param      {MountOptions}  [options] - options, like alias, styles
 * @see https://github.com/bahmutov/cypress-react-unit-test
 * @see https://glebbahmutov.com/blog/my-vision-for-component-tests/
 * @example
 ```
  import Hello from './hello.jsx'
  import {mount} from 'cypress-react-unit-test'
  it('works', () => {
    mount(<Hello onClick={cy.stub()} />)
    // use Cypress commands
    cy.contains('Hello').click()
  })
 ```
 **/
export const mount = (jsx: React.ReactElement, options: MountOptions = {}) => {
  checkMountModeEnabled()

  // Get the display name property via the component constructor
  // @ts-ignore FIXME
  const componentName = getDisplayName(jsx.type, options.alias)
  const displayName = options.alias || componentName
  const message = options.alias
    ? `<${componentName} ... /> as "${options.alias}"`
    : `<${componentName} ... />`
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
      const document = cy.state('document') as Document
      const reactDomToUse = options.ReactDom || ReactDOM

      const el = document.getElementById(rootId)

      if (!el) {
        throw new Error(
          [
            '[cypress-react-unit-test] 🔥 Hmm, cannot find root element to mount the component.',
            'Did you forget to include the support file?',
            'Check https://github.com/bahmutov/cypress-react-unit-test#install please',
          ].join(' '),
        )
      }

      const key =
        // @ts-ignore provide unique key to the the wrapped component to make sure we are rerendering between tests
        (Cypress?.mocha?.getRunner()?.test?.title || '') + Math.random()
      const props = {
        key,
      }

      const reactComponent = React.createElement(React.Fragment, props, jsx)
      // since we always surround the component with a fragment
      // let's get back the original component
      // @ts-ignore
      const userComponent = reactComponent.props.children
      reactDomToUse.render(reactComponent, el)

      if (logInstance) {
        const logConsoleProps = {
          props: jsx.props,
          description: 'Mounts React component',
          home: 'https://github.com/bahmutov/cypress-react-unit-test',
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
          // by waiting, we give the component's hook a chance to run
          // https://github.com/bahmutov/cypress-react-unit-test/issues/200
          .wait(1, { log: false })
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
 * @see https://github.com/bahmutov/cypress-react-unit-test/tree/main/cypress/component/basic/unmount
 * @example
  ```
  import { mount, unmount } from 'cypress-react-unit-test'
  it('works', () => {
    mount(...)
    // interact with the component using Cypress commands
    // whenever you want to unmount
    unmount()
  })
  ```
 */
export const unmount = () => {
  checkMountModeEnabled()

  return cy.then(() => {
    cy.log('unmounting...')
    const selector = '#' + rootId
    return cy.get(selector, { log: false }).then($el => {
      unmountComponentAtNode($el[0])
    })
  })
}

/**
 * Creates new instance of `mount` function with default options
 * @function   createMount
 * @param      {React.ReactElement}  element - component to mount
 * @param      {MountOptions}  [defaultOptions] - defaultOptions for returned `mount` function
 * @example
 * ```
 * import Hello from './hello.jsx'
 * import { createMount } from 'cypress-react-unit-test'
 * it('works', () => {
 *   const mount = createMount({ strict: true, cssFile: 'path/to/any/css/file.css' })
 *   mount(<Hello />)
 *   // use Cypress commands
 *   cy.get('button').should('have.css', 'color', 'rgb(124, 12, 109)')
 * })
 ```
 **/
export const createMount = (defaultOptions: MountOptions) => (
  element: React.ReactElement,
  options: MountOptions,
) => mount(element, { ...defaultOptions, ...options })

/** @deprecated Should be removed in the next major version */
export default mount
