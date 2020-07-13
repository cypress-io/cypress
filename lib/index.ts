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
          logInstance.set('$el', el.children.item(0))
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

// mounting hooks inside a test component mostly copied from
// https://github.com/testing-library/react-hooks-testing-library/blob/master/src/pure.js
function resultContainer() {
  let value: any = null
  let error: Error | null = null
  const resolvers: any[] = []

  const result = {
    get current() {
      if (error) {
        throw error
      }
      return value
    },
    get error() {
      return error
    },
  }

  const updateResult = (val: any, err: Error | null = null) => {
    value = val
    error = err
    resolvers.splice(0, resolvers.length).forEach(resolve => resolve())
  }

  return {
    result,
    addResolver: (resolver: any) => {
      resolvers.push(resolver)
    },
    setValue: (val: any) => updateResult(val),
    setError: (err: Error) => updateResult(undefined, err),
  }
}

// @ts-ignore
function TestHook({ callback, onError, children }) {
  try {
    children(callback())
  } catch (err) {
    if (err.then) {
      throw err
    } else {
      onError(err)
    }
  }

  // TODO decide what the test hook component should show
  // maybe nothing, or maybe useful information about the hook?
  // maybe its current properties?
  // return <div>TestHook</div>
  return null
}

/**
 * Mounts a React hook function in a test component for testing.
 *
 * @see https://github.com/bahmutov/cypress-react-unit-test#advanced-examples
 */
export const mountHook = (hookFn: Function) => {
  const { result, setValue, setError } = resultContainer()

  return mount(
    React.createElement(TestHook, {
      callback: hookFn,
      onError: setError,
      children: setValue,
    }),
  ).then(() => {
    cy.wrap(result)
  })
}

export default mount
