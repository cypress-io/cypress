describe('lots of requests', () => {
  describe('test isolation', () => {
    describe('test isolation on', { testIsolation: true }, () => {
      it('test 1', () => {
        cy.visit('/lots-of-requests?test=1&i=1')
      })

      it('test 2', () => {
        cy.visit('/lots-of-requests?test=2&i=1')
        cy.get('#done').should('contain', 'Done')
      })
    })

    describe('test isolation off', { testIsolation: false }, () => {
      it('test 3', () => {
        cy.visit('/lots-of-requests?test=3&i=1')
      })

      it('test 4', () => {
        cy.get('#done').should('contain', 'Done')
      })
    })

    describe('test isolation back on', { testIsolation: true }, () => {
      it('test 5', () => {
        cy.visit('/lots-of-requests?test=5&i=1')
      })

      it('test 6', () => {
        cy.visit('/lots-of-requests?test=6&i=1')
        cy.get('#done').should('contain', 'Done')
      })
    })
  })

  describe('multiple visits in one test', { testIsolation: true }, () => {
    it('test 7', () => {
      cy.visit('/lots-of-requests?test=7&i=1')
      cy.visit('/lots-of-requests?test=7&i=2')
      cy.get('#done').should('contain', 'Done')
    })
  })

  describe('navigation in one test', { testIsolation: true }, () => {
    it('test 8', () => {
      cy.visit('/lots-of-requests?test=8&i=1')
      cy.get('a').click()
      cy.get('#done').should('contain', 'Done')
    })
  })

  describe('network error', { testIsolation: true, browser: '!webkit' }, () => {
    beforeEach(() => {
      cy.intercept('GET', '/1mb?test=9&i=1&j=8', { forceNetworkError: true })
    })

    it('test 9', () => {
      cy.visit('/lots-of-requests?test=9&i=1')
      cy.get('#done').should('contain', 'Done')
    })
  })
})
