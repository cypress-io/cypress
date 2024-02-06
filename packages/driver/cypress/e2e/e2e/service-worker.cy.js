describe('service workers', () => {
  afterEach(() => {
    cy.window().then((win) => {
      win.navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.map((registration) => registration.unregister())
      })
    })
  })

  describe.only('supports a service worker that does not intercept requests', () => {
    beforeEach(() => {
      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`
          self.addEventListener('fetch', function (event) {
            return
          })        
        `, {
          'Content-Type': 'application/javascript',
        })
      })
    })

    it('passes', () => {
      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })
  })

  describe('supports a service worker that calls clients.claim', () => {
    beforeEach(() => {
      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`
          self.addEventListener('activate', (event) => {
            event.waitUntil(clients.claim())
          })
          
          self.addEventListener('fetch', function (event) {
            return
          })
        `, {
          'Content-Type': 'application/javascript',
        })
      })
    })

    it('passes', () => {
      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })
  })

  describe('supports a service worker that does not have a fetch event listener', () => {
    beforeEach(() => {
      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`
          self.addEventListener('activate', (event) => {
            event.waitUntil(clients.claim())
          })
        `, {
          'Content-Type': 'application/javascript',
        })
      })
    })

    it('passes', () => {
      cy.visit('fixtures/service-worker.html')
      cy.get('#output', { timeout: 1000 }).should('have.text', 'done')
    })
  })
})
