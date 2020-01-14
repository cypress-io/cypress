import { EventEmitter } from 'events'

describe('controls', function () {
  beforeEach(function () {
    cy.fixture('runnables').as('runnables')

    this.runner = new EventEmitter()

    cy.visit('/dist').then((win) => {
      win.render({
        runner: this.runner,
        spec: {
          name: 'foo.js',
          relative: 'relative/path/to/foo.js',
          absolute: '/absolute/path/to/foo.js',
        },
      })
    })

    cy.get('.reporter').then(() => {
      this.runner.emit('runnables:ready', this.runnables)

      this.runner.emit('reporter:start', {})
    })
  })

  describe('responsive design', function () {
    describe('>= 400px wide', () => {
      beforeEach(() => {
        // 900 below is to make screen long enough to remove scrollbar on the right
        cy.viewport(400, 900)
      })

      it('shows \'Tests\'', () => {
        cy.get('.focus-tests span').should('be.visible')
      })
    })

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
