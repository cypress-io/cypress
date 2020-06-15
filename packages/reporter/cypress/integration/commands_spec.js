import { EventEmitter } from 'events'

describe('commands', () => {
  let render

  beforeEach(() => {
    const runner = new EventEmitter()

    cy.visit('/dist').then((win) => {
      render = ({ isInteractive = true } = {}) => {
        win.render({
          isInteractive,
          runner,
          specPath: '/foo/bar',
        })

        cy.get('.reporter')
        cy.fixture('runnables').then((runnables) => {
          runner.emit('runnables:ready', runnables)
          runner.emit('reporter:start', {})
        })
      }
    })
  })

  describe('any case', () => {
    beforeEach(() => {
      render()
    })

    it('command method has appropriate widths', () => {
      cy.get('.command-name-visit .command-method').should('have.css', 'min-width', '80px')
      cy.get('.command-name-clear-cookies .command-method').should('have.css', 'min-width', '100px')
      cy.get('.command-name-scroll-into-view .command-method').should('have.css', 'min-width', '130px')
    })

    it('shows option', () => {
      cy.get('.command-name-visit .command-message-options').should('be.visible')
      cy.get('.command-name-set-cookie .command-message-options').should('not.be.visible')
      cy.get('.command-name-empty-option-obj .command-message-options').should('not.be.visible')
    })

    describe('big objects', () => {
      it('shows correct message', () => {
        cy.get('.command-name-assert .command-message-summarized-text').each(($el) => {
          cy.wrap($el).should('contain', '[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, ...more]')
        })
      })

      it('toggles inspector', () => {
        cy.get('.command-name-assert .command-message-summarized-text').each(($el) => {
          cy.wrap($el).click()
          cy.get('.command-detail-viewer').should('be.visible')

          cy.wrap($el).click()
          cy.get('.command-detail-viewer').should('not.be.visible')
        })
      })

      it('load more button works properly', () => {
        cy.get('.command-name-assert .command-message-summarized-text').each(($el) => {
          cy.wrap($el).click()

          cy.get('.load-more').should('be.visible')
          cy.get('.load-more').click()
          cy.get('.load-more').should('not.be.visible')

          cy.wrap($el).click()
        })
      })
    })
  })

  describe('interactive mode', () => {
    beforeEach(() => {
      render()
    })

    it('does not auto-expand options', () => {
      cy.get('.command-name-clear-cookies .command-message-options')
      .contains('two: Object')
      .should('not.be.visible')
    })
  })

  describe('non-interactive mode', () => {
    beforeEach(() => {
      render({ isInteractive: false })
    })

    it('auto-expands options to 10 levels', () => {
      cy.get('.command-name-clear-cookies .command-message-options')
      .contains('ten: Object')
      .should('be.visible')

      cy.get('.command-name-clear-cookies .command-message-options')
      .contains('eleven: Object')
      .should('not.be.visible')
    })
  })
})
