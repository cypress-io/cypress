const { EventEmitter } = require('events')

describe('controls', () => {
  let runner

  beforeEach(() => {
    runner = new EventEmitter()

    cy.visit('/dist').then((win) => {
      win.render({
        runner,
        specPath: '/foo/bar',
      })
    })

    cy.get('.reporter')
    cy.fixture('runnables')
    .then((runnables) => {
      runner.emit('runnables:ready', runnables)
      runner.emit('reporter:start', {})
    })
  })

  describe('options', () => {
    it('hides options by default', () => {
      cy.get('.options').should('not.be.visible')
    })

    it('opens options on click of "Open options"', () => {
      cy.get('.toggle-options').click()
      cy.get('.options').should('be.visible')
    })

    it('closes options on another click of "Open options"', () => {
      cy.get('.toggle-options').click().click()
      cy.get('.options').should('not.be.visible')
    })

    it('shows correct tooltip when options are closed', () => {
      cy.get('.toggle-options').trigger('mouseover')
      cy.get('.tooltip').should('have.text', 'Show Options')
    })

    it('shows correct tooltip when options are open', () => {
      cy.get('.toggle-options').click()
      cy.get('.toggle-options').trigger('mouseover')
      cy.get('.tooltip').should('have.text', 'Hide Options')
    })
  })

  describe('auto-scrolling', () => {
    beforeEach(() => {
      cy.get('.toggle-options').click()
    })

    it('shows tooltip with info icon', () => {
      cy.get('.toggle-auto-scrolling .fa-info-circle').trigger('mouseover')
      cy.get('.tooltip').invoke('text').should('include', 'automatically scroll')
    })

    it('is enabled by default', () => {
      cy.get('.toggle-auto-scrolling').should('have.class', 'auto-scrolling-enabled')
    })

    it('is disabled on click', () => {
      cy.get('.toggle-auto-scrolling').click()
      .should('not.have.class', 'auto-scrolling-enabled')
    })

    it('is enabled on another click', () => {
      cy.get('.toggle-auto-scrolling')
      .click().click()
      .should('have.class', 'auto-scrolling-enabled')
    })

    it('shows correct aria label when enabled', () => {
      cy.get('.toggle-auto-scrolling')
      .should('have.attr', 'aria-label')
      .and('equal', 'Disable Auto-scrolling')
    })

    it('shows correct aria label when disabled', () => {
      cy.get('.toggle-auto-scrolling')
      .click()
      .should('have.attr', 'aria-label')
      .and('equal', 'Enable Auto-scrolling')
    })

    it('emits save:state when clicked', () => {
      cy.spy(runner, 'emit')

      cy.get('.toggle-auto-scrolling').click().then(() => {
        expect(runner.emit).to.have.been.calledWith('save:state', {
          autoScrollingEnabled: false,
        })
      })

      cy.get('.toggle-auto-scrolling').click().then(() => {
        expect(runner.emit).to.have.been.calledWith('save:state', {
          autoScrollingEnabled: true,
        })
      })
    })
  })

  describe('responsive design', () => {
    describe('>= 400px wide', () => {
      it('shows \'Tests\'', () => {
        cy.get('.focus-tests span').should('be.visible')
      })
    })

    describe('< 400px wide', () => {
      beforeEach(() => {
        cy.viewport(399, 450)
      })

      it('hides \'Tests\'', () => {
        cy.get('.focus-tests span').should('not.be.visible')
      })
    })
  })
})
