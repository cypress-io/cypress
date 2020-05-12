import * as React from 'react'
import ReactDOM, { unmountComponentAtNode } from 'react-dom'
import getDisplayName from './getDisplayName'
import { injectStylesBeforeElement } from './utils'

const rootId = 'cypress-root'

// @ts-ignore
const isComponentSpec = () => Cypress.spec.specType === 'component'

function checkMountModeEnabled() {
  // @ts-ignore
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
 *  @function   cy.mount
 *  @param      {React.ReactElement}  jsx - component to mount
 *  @param      {string}  [Component] - alias to use later
 *  @example
 ```
 import Hello from './hello.jsx'
 // mount and access by alias
 cy.mount(<Hello />, 'Hello')
 // using default alias
 cy.get('@Component')
 // using original component
 cy.get(Hello)
 ```
 **/
export const mount = (jsx: React.ReactElement, options: MountOptions = {}) => {
  checkMountModeEnabled()

  // Get the display name property via the component constructor
  // @ts-ignore FIXME
  const displayName = getDisplayName(jsx.type, options.alias)
  let logInstance: Cypress.Log

  return cy
    .then(() => {
      if (options.log !== false) {
        logInstance = Cypress.log({
          name: 'mount',
          message: [`ReactDOM.render(<${displayName} ... />)`],
        })
      }
    })
    .then(injectStyles(options))
    .then(() => {
      const document = cy.state('document')
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

      const CypressTestComponent = reactDomToUse.render(
        React.createElement(React.Fragment, props, jsx),
        el,
      )

      const logConsoleProps = {
        props: jsx.props,
      }
      if (logInstance) {
        logInstance.set('consoleProps', () => logConsoleProps)

        if (el.children.length) {
          logInstance.set('$el', el.children.item(0))
        }
      }

      return (
        cy
          .wrap(CypressTestComponent, { log: false })
          .as(options.alias || displayName)
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
 * Removes any mounted component
 */
export const unmount = () => {
  checkMountModeEnabled()

  cy.log('unmounting...')
  const selector = '#' + rootId
  return cy.get(selector, { log: false }).then($el => {
    unmountComponentAtNode($el[0])
  })
}

export default mount
