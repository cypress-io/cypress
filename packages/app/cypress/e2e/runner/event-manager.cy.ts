import { loadSpec } from './support/spec-loader'

describe('event-manager', () => {
  it('emits the cypress:created event when spec is rerun', () => {
    // load the spec initially
    loadSpec({
      filePath: 'hooks/basic.cy.js',
      passCount: 1,
    })

    cy.window().then((win) => {
      const eventManager = win.getEventManager()
      let eventReceived = false

      // listen for the cypress:created event
      eventManager.on('cypress:created', (cypress) => {
        expect(cypress).to.exist
        expect(cypress).to.not.equal(win.Cypress)
        eventReceived = true
      })

      // trigger a rerun
      cy.get('.restart').click()

      // keep retrying until eventReceived becomes true
      cy.wrap(() => eventReceived).invoke('call').should('be.true')
    })
  })
})
