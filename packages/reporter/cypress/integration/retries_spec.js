import { EventEmitter } from 'events'

describe('retries', function () {
  beforeEach(function () {
    cy.fixture('retries_runnables').as('runnables')

    this.runner = new EventEmitter()

    cy.server()
    cy.route('/foo')

    cy.visit('cypress/support/index.html').then((win) => {
      cy.spy(win, 'btoa')

      win.render({
        runner: this.runner,
        specPath: '/foo/bar',
      })
    })

    cy.get('.reporter').then(() => {
      this.runner.emit('runnables:ready', this.runnables)
      this.runner.emit('reporter:start', {})
    })
  })

  it('does not shows attempts if there are no retries', () => {
    cy
    .contains('no retries')
    .click()
    .closest('.runnable-wrapper')
    .contains('Attempt 1')
    .should('not.be.visible')
  })

  // shows attempts after more than 1
  // shows yellow on side
  // shows the right status indicators
  // - active
  // - processing
  // - skipped?
  // - pending?
  // - failed
  // - passed
  // collapses properly
  // shows routes/spies/hooks/commands
  // errors in the right places
  // - on each attempt
  // - on the test itself
})
