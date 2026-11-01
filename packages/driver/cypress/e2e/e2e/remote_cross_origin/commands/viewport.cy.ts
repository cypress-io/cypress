export {}

const expectAutWindowSize = (width: number, height: number) => {
  cy.document().its('defaultView.innerWidth').should('eq', width)
  cy.document().its('defaultView.innerHeight').should('eq', height)
}

describe('remote driver: viewport in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  it('keeps a viewport set before navigating to the cross-origin AUT', () => {
    cy.viewport(320, 480)

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    const viewportChangedSpy = cy.spy()

    cy.then(() => {
      cy.on('viewport:changed', viewportChangedSpy)
    })

    // changing the viewport to the same size shouldn't do anything
    cy.viewport(320, 480).then(() => {
      expect(viewportChangedSpy).not.to.be.called
    })

    expectAutWindowSize(320, 480)
  })

  context('without a pre-set viewport', () => {
    beforeEach(() => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()
    })

    context('.viewport()', () => {
      it('changes the viewport', () => {
        expectAutWindowSize(1000, 660)

        cy.viewport(320, 480)

        expectAutWindowSize(320, 480)
      })

      it('resets the viewport between tests', () => {
        expectAutWindowSize(1000, 660)
      })

      it('calls a cy.on(\'viewport:changed\') handler', () => {
        const viewportChangedSpy = cy.spy()

        cy.on('viewport:changed', viewportChangedSpy)

        cy.viewport(320, 480).then(() => {
          expect(viewportChangedSpy).to.be.calledOnce
        })
      })

      context('Cypress.on(\'viewport:changed\')', () => {
        let viewportChangedSpy

        before(() => {
          viewportChangedSpy = cy.spy()
        })

        after(() => {
          Cypress.off('viewport:changed', viewportChangedSpy)
        })

        it('calls the handler', () => {
          Cypress.on('viewport:changed', viewportChangedSpy)

          cy.viewport(320, 480).then(() => {
            expect(viewportChangedSpy).to.be.calledOnce
          })
        })
      })

      it('keeps the viewport when navigating from the cross-origin AUT back to baseUrl', () => {
        const viewportChangedSpy = cy.spy()

        cy.on('viewport:changed', viewportChangedSpy)

        cy.viewport(320, 480)

        cy.document().invoke('location.assign', 'http://localhost:3500/fixtures/primary-origin.html')
        cy.location('host').should('equal', 'localhost:3500')

        cy.viewport(320, 480).then(() => {
          expect(viewportChangedSpy).to.be.calledOnce
        })

        expectAutWindowSize(320, 480)
      })

      it('keeps the viewport across multiple cross-origin AUTs', () => {
        cy.viewport(320, 480)

        expectAutWindowSize(320, 480)

        cy.document().invoke('location.assign', 'http://www.idp.com:3500/fixtures/primary-origin.html')
        cy.location('host').should('equal', 'www.idp.com:3500')

        const viewportChangedSpy = cy.spy()

        cy.then(() => {
          cy.on('viewport:changed', viewportChangedSpy)
        })

        // changing the viewport to the same size shouldn't do anything
        cy.viewport(320, 480).then(() => {
          expect(viewportChangedSpy).not.to.be.called
        })

        expectAutWindowSize(320, 480)
      })
    })
  })
})
