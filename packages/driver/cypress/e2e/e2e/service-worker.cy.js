describe('service workers', () => {
  afterEach(() => {
    cy.window().then((win) => {
      // unregister the service worker to ensure it does not affect other tests
      win.navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.map((registration) => registration.unregister())
      })
    })
  })

  describe('supports a service worker that does not intercept requests', () => {
    beforeEach(() => {
      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`
          self.addEventListener('fetch', function (event) {
            return
          })`,
        { 'Content-Type': 'application/javascript' })
      })
    })

    it('passes', () => {
      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })
  })
})
