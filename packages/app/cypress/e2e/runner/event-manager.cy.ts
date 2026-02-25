import { loadSpec, shouldHaveTestResults } from './support/spec-loader'

describe('event-manager', () => {
  it('emits the cypress:created event when spec is rerun', () => {
    // load the spec initially
    loadSpec({
      filePath: 'hooks/basic.cy.js',
      passCount: 2,
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

  it('clears the pause listeners when the spec is rerun', () => {
    loadSpec({
      filePath: 'hooks/basic.cy.js',
      passCount: 2,
    })

    cy.window().then((win) => {
      const eventManager = win.getEventManager()

      cy.wrap(() => eventManager.reporterBus.listeners('runner:next').length).invoke('call').should('equal', 1)

      // trigger a rerun
      cy.get('.restart').click()

      shouldHaveTestResults({
        passCount: 2,
        failCount: 0,
        pendingCount: 0,
      })

      cy.wrap(() => eventManager.reporterBus.listeners('runner:next').length).invoke('call').should('equal', 1)
    })
  })

  it('should reset the prompt store', () => {
    loadSpec({
      filePath: 'hooks/basic.cy.js',
      passCount: 2,
    })

    cy.window().then((win) => {
      const eventManager = win.getEventManager()

      cy.spy(eventManager['promptStore'], 'resetState').as('resetState')
    })

    cy.visitApp(`specs`)

    cy.get('@resetState').should('have.been.calledOnce')
  })

  it('should reset the spec dirty data store', () => {
    loadSpec({
      filePath: 'hooks/basic.cy.js',
      passCount: 2,
    })

    cy.window().then((win) => {
      const eventManager = win.getEventManager()

      cy.spy(eventManager['specDirtyDataStore'], 'resetDirtyState').as('resetDirtyState')
    })

    cy.visitApp(`specs`)

    cy.get('@resetDirtyState').should('have.been.calledOnce')
  })

  it('should start loading Studio when re-running and Studio is active', () => {
    loadSpec({
      filePath: 'hooks/basic.cy.js',
      passCount: 2,
    })

    cy.window().then((win) => {
      const eventManager = win.getEventManager()

      cy.spy(eventManager['studioStore'], 'startLoading').as('startLoading')
      cy.spy(eventManager['studioStore'], 'setActive').as('setActive')
    })

    cy.get('[data-cy="launch-studio"]').eq(0).click()

    cy.get('@startLoading').should('have.been.calledOnce')
    cy.get('@setActive').should('have.been.calledOnce')

    cy.get('.restart').click()

    cy.get('@startLoading').should('have.been.calledTwice')
    cy.get('@setActive').should('have.been.calledTwice')
  })

  it('should not start loading Studio when re-running and Studio is not active', () => {
    loadSpec({
      filePath: 'hooks/basic.cy.js',
      passCount: 2,
    })

    cy.window().then((win) => {
      const eventManager = win.getEventManager()

      cy.spy(eventManager['studioStore'], 'startLoading').as('startLoading')
      cy.spy(eventManager['studioStore'], 'setActive').as('setActive')
    })

    cy.get('.restart').click()

    cy.get('@startLoading').should('not.have.been.called')
    cy.get('@setActive').should('have.been.calledOnce')
  })
})
