import { EventEmitter } from 'events'
import { itHandlesFileOpening } from '../support/utils'

describe('spec title', () => {
  let runner: EventEmitter
  let start: Function

  beforeEach(() => {
    runner = new EventEmitter()

    start = (spec: Cypress.Cypress['spec']) => {
      cy.visit('/').then((win) => {
        win.render({ runner, spec })
      })

      cy.get('.reporter').then(() => {
        runner.emit('runnables:ready', {})
        runner.emit('reporter:start', {})
      })
    }
  })

  it('all specs displays "All Specs"', () => {
    start({
      relative: '__all',
      name: '',
      absolute: '',
    })

    cy.get('.runnable-header').should('have.text', 'All Specs')

    // ensure the page is loaded before taking snapshot
    cy.get('.focus-tests-text').should('be.visible')
    cy.percySnapshot()
  })

  it('all specs displays "Specs matching ..."', () => {
    start({
      relative: '__all',
      name: '',
      absolute: '',
      specFilter: 'cof',
    })

    cy.contains('.runnable-header', 'Specs matching "cof"')

    // ensure the page is loaded before taking snapshot
    cy.get('.focus-tests-text').should('be.visible')
    cy.percySnapshot()
  })

  describe('single spec', () => {
    beforeEach(() => {
      start({
        name: 'foo.js',
        relative: 'relative/path/to/foo.js',
        absolute: '/absolute/path/to/foo.js',
      })
    })

    it('displays relative spec path', () => {
      cy.get('.runnable-header').find('a').should('have.text', 'relative/path/to/foo.js')

      // ensure the page is loaded before taking snapshot
      cy.get('.focus-tests-text').should('be.visible')
      cy.percySnapshot()
    })

    it('displays tooltip on hover', () => {
      cy.get('.runnable-header a').first().trigger('mouseover')
      cy.get('.cy-tooltip').first().should('have.text', 'Open in IDE')
    })

    itHandlesFileOpening({
      getRunner: () => runner,
      selector: '.runnable-header a',
      file: {
        file: '/absolute/path/to/foo.js',
        line: 0,
        column: 0,
      },
    })
  })
})
