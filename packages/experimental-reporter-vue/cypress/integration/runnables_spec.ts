import { EventEmitter } from 'events'
import { RunnablesErrorModel } from '../../src/runnables/runnable-error'
import { RootRunnable } from '../../src/runnables/runnables-store'
import { itHandlesFileOpening } from '../support/utils'

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
          experimentalStudioEnabled: true,
        }, renderProps))
      })
    }

    start = (renderProps?: RenderProps) => {
      render(renderProps)

      return cy.get('.reporter').then(() => {
        runner.emit('runnables:ready', runnables)
        runner.emit('reporter:start', {})
      })
    }
  })

  it('displays loader when runnables have not yet loaded', () => {
    render()
    cy.contains('Your tests are loading...').should('be.visible')
    // ensure the page is loaded before taking snapshot
    cy.percySnapshot()
  })

  it('displays runnables when they load', () => {
    start()
    cy.get('.runnable').should('have.length', 9)
    cy.contains('test 4').should('be.visible')

    cy.percySnapshot()
  })

  it('displays multi-spec reporters', () => {
    start({ runMode: 'multi', allSpecs: [
      {
        relative: 'fizz',
      },
      {
        relative: 'buzz',
      },
    ] })

    cy.contains('buzz').should('be.visible')
    cy.percySnapshot()
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

  describe('when there are no tests', () => {
    beforeEach(() => {
      runnables.suites = []
    })

    it('displays error', () => {
      start()

      cy.contains('No tests found.').should('be.visible')
      cy.contains('Cypress could not detect tests in this file.').should('be.visible')
      cy.contains('Open file in IDE').should('be.visible')
      cy.contains('Create test with Cypress Studio').should('be.visible')
      cy.get('.help-link').should('have.attr', 'href', 'https://on.cypress.io/intro')
      cy.get('.help-link').should('have.attr', 'target', '_blank')
      cy.percySnapshot()
    })

    it('does not display links to work with file if running all specs', () => {
      start({
        spec: {
          name: 'All Integration Specs',
          absolute: '__all',
          relative: '__all',
        },
      })

      cy.contains('No tests found.').should('be.visible')
      cy.contains('Cypress could not detect tests in this file.').should('be.visible')
      cy.contains('Open file in IDE').should('not.exist')
      cy.contains('Create test with Cypress Studio').should('not.exist')
      cy.get('.help-link').should('have.attr', 'href', 'https://on.cypress.io/intro')
      cy.get('.help-link').should('have.attr', 'target', '_blank')
    })

    it('can launch studio', () => {
      start().then(() => {
        cy.stub(runner, 'emit')

        cy.contains('Cypress Studio').click()

        cy.wrap(runner.emit).should('be.calledWith', 'studio:init:suite', 'r1')
      })
    })

    describe('open in ide', () => {
      beforeEach(() => {
        start({
          spec: {
            name: 'foo.js',
            relative: 'relative/path/to/foo.js',
            absolute: '/absolute/path/to/foo.js',
          },
        })
      })

      itHandlesFileOpening({
        getRunner: () => runner,
        selector: '.no-tests a',
        file: {
          file: '/absolute/path/to/foo.js',
          line: 0,
          column: 0,
        },
      })
    })
  })
})
