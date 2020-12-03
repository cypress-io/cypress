import { EventEmitter } from 'events'
import { RunnablesErrorModel } from '../../src/runnables/runnable-error'
import { RootRunnable } from './../../src/runnables/runnables-store'

interface RenderProps {
  error?: RunnablesErrorModel
}

describe('runnables', () => {
  let runner: EventEmitter
  let runnables: RootRunnable
  let render: Function
  let start: Function

  beforeEach(() => {
    cy.fixture('runnables').then((_runnables) => {
      runnables = _runnables
    })

    runner = new EventEmitter()

    render = (renderProps: RenderProps = {}) => {
      cy.visit('/').then((win) => {
        win.render(Object.assign({
          runner,
          spec: {
            name: 'foo',
            absolute: '/foo/bar',
            relative: 'foo/bar',
          },
        }, renderProps))
      })
    }

    start = (renderProps?: RenderProps) => {
      render(renderProps)
      cy.get('.reporter').then(() => {
        runner.emit('runnables:ready', runnables)
        runner.emit('reporter:start', {})
      })
    }
  })

  it('displays loader when runnables have not yet loaded', () => {
    render()
    cy.contains('Your tests are loading...').should('be.visible')
    cy.percySnapshot()
  })

  it('displays runnables when they load', () => {
    start()
    cy.get('.runnable').should('have.length', 9)

    // ensure the page is loaded before taking snapshot
    cy.contains('test 4').should('be.visible')
    cy.percySnapshot()
  })

  it('displays the "No test" error when there are no tests', () => {
    runnables.suites = []
    start()

    cy.contains('No tests found in your file:')
    cy.contains('foo/bar')
    cy.contains('We could not detect any tests in the above file')

    cy.get('.error a').should('have.attr', 'href', 'https://on.cypress.io/no-tests-found-in-your-file')
    cy.get('.error a').should('have.attr', 'target', '_blank')
  })

  it('displays bundle error if specified', () => {
    const error = {
      title: 'Oops...we found an error preparing this test file:',
      link: 'https://on.cypress.io/we-found-an-error-preparing-your-test-file',
      callout: '/path/to/spec',
      message: 'We found an error',
    }

    start({ error })

    cy.contains(error.title)
    cy.contains(error.callout)
    cy.contains(error.message)

    cy.get('.error a').should('have.attr', 'href', error.link)
    cy.get('.error a').should('have.attr', 'target', '_blank')
  })

  it('error does not render link if there is not one specified', () => {
    const error = {
      title: 'Oops...we found an error preparing this test file:',
      callout: '/path/to/spec',
      message: 'We found an error',
    }

    start({ error })
    cy.get('.error a').should('not.exist')
  })

  it('error does not display callout if there is not one specified', () => {
    const error = {
      title: 'Oops...we found an error preparing this test file:',
      message: 'We found an error',
    }

    start({ error })
    cy.get('.error pre').should('not.exist')
  })

  it('error displays message with markdown', () => {
    const error = {
      title: 'Oops...we found an error preparing this test file:',
      message: `We **found** an _error_:

  - fix
  - it
`,
    }

    start({ error })
    cy.get('.error strong').should('have.text', 'found')
    cy.get('.error em').should('have.text', 'error')
    cy.get('.error li').should('have.length', 2)
  })
})
