const { EventEmitter } = require('events')

describe('controls', function () {
  beforeEach(function () {
    cy.fixture('runnables').as('runnables')

    this.runner = new EventEmitter()

    cy.visit('cypress/support/index.html').then((win) => {
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

  describe('responsive design', function () {
    describe('>= 400px wide', () => {
      it('shows \'Tests\'', () => {
        cy.get('.focus-tests span').should('be.visible')
      })
    }
    )

    describe('< 400px wide', function () {
      beforeEach(() => {
        cy.viewport(399, 450)
      })

      it('hides \'Tests\'', () => {
        cy.get('.focus-tests span').should('not.be.visible')
      })
    })
  })
})
