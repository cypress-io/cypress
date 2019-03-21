const { EventEmitter } = require('events')

let runner

describe('test errors', () => {
  beforeEach(() => {
    cy.fixture('test_error_runnables').as('runnables')

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

  it('renders and escapes backticks', () => {
    cy.get('.test-error')
    .should('contain', '`bar`')
    .and('contain', '**baz**')
    .contains('code', 'foo')
    .and('not.contain', '`foo`')
  })
})
