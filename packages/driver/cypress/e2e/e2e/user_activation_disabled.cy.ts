// eslint-disable-next-line mocha/no-exports -- exports nothing: it makes TypeScript and webpack treat this spec as a module
export {}

// Its own spec, so the AUT frame starts out unactivated: Chromium keeps a frame's
// activation across same-origin navigations, so an earlier test would leave it on.
// https://github.com/cypress-io/cypress/issues/34993
describe('user activation with userActivation: false', { browser: '!webkit', userActivation: false }, () => {
  const expectActivation = (win: Window, hasBeenActive: boolean) => {
    expect(win.navigator.userActivation.hasBeenActive, 'navigator.userActivation.hasBeenActive').to.equal(hasBeenActive)
  }

  it('leaves the AUT unactivated after cy.visit()', () => {
    cy.visit('/fixtures/user-activation.html')
    cy.window().then((win) => expectActivation(win, false))
  })

  it('leaves the AUT unactivated after cy.reload()', () => {
    cy.visit('/fixtures/user-activation.html')
    cy.reload()
    cy.window().then((win) => expectActivation(win, false))
  })

  it('leaves activation-gated APIs blocked', { browser: { family: 'chromium' } }, () => {
    cy.visit('/fixtures/user-activation.html')
    cy.window().then((win) => {
      expect(win.navigator.vibrate(1), 'navigator.vibrate()').to.be.false
    })
  })

  it('can be turned back on for one test', { userActivation: true }, () => {
    cy.visit('/fixtures/user-activation.html')
    cy.window().then((win) => expectActivation(win, true))
  })
})
