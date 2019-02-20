const { EventEmitter } = require('events')

let runner

describe('test errors', () => {
  beforeEach(() => {
    cy.fixture('test-error-runnables').as('runnables')

    runner = new EventEmitter()

    cy.visit('cypress/support/index.html').then((win) => {
      win.render({
        runner,
        specPath: '/foo/bar',
      })
    })

    cy.get('.reporter').then(function () {
      runner.emit('runnables:ready', this.runnables)
      runner.emit('reporter:start', {})
    })
  })

  it('renders markdown', () => {
    cy.get('.test-error')
    .contains('strong', 'markdown')
    .should('not.contain', '**markdown**')
  })

  it('converts on.cypress.io URLs to links', () => {
    cy.get('.test-error a').should('have.length', 1)
    cy.get('.test-error')
    .contains('a', 'https://on.cypress.io/hover')
  })

  it('doesn\'t convert non-on.cypress.io URLs to links', () => {
    cy.get('.test-error a')
    .should('not.contain', 'https://example.com')
  })
})
