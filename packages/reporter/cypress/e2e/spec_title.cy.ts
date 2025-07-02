import { EventEmitter } from 'events'
import { itHandlesFileOpening } from '../support/utils'

describe('spec title', () => {
  let runner: EventEmitter
  let start: Function

  beforeEach(() => {
    runner = new EventEmitter()

    start = (spec: Cypress.Cypress['spec']) => {
      cy.visit('/').then((win) => {
        win.render({ runner, runnerStore: { spec } })
      })

      cy.get('.reporter.mounted').then(() => {
        runner.emit('runnables:ready', {})
        runner.emit('reporter:start', {})
      })
    }
  })

  it('all specs displays "All Specs"', () => {
    start({
      relative: '__all',
      name: '',
      absolute: '__all',
    })

    cy.get('.runnable-header').should('have.text', 'All Specs')

    cy.percySnapshot()
  })

  it('all specs displays "Specs matching ..."', () => {
    start({
      relative: '__all',
      name: '',
      absolute: '__all',
      specFilter: 'cof',
    })

    cy.contains('.runnable-header', 'Specs matching "cof"')

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

    it('displays name without path', () => {
      cy.get('.runnable-header-file-name').contains('foo.js')

      cy.percySnapshot()
    })

    it('displays Open in IDE button on spec name hover', () => {
      cy.get('.open-in-ide-button').should('have.css', 'opacity', '0')

      cy.get('.runnable-header-file-name').realHover()
      cy.get('.open-in-ide-button').should('have.css', 'opacity', '1')
      cy.get('.open-in-ide-button').contains('Open in IDE')

      cy.percySnapshot()
    })

    itHandlesFileOpening({
      getRunner: () => runner,
      selector: '.open-in-ide-button',
      file: {
        file: '/absolute/path/to/foo.js',
        line: 0,
        column: 0,
      },
    })
  })
})
