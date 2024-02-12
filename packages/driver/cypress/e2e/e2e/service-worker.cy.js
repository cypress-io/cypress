describe('service workers', () => {
  beforeEach(async () => {
    // unregister the service worker to ensure it does not affect other tests
    const registrations = await navigator.serviceWorker.getRegistrations()

    await Promise.all(registrations.map((registration) => registration.unregister()))
  })

  describe('a service worker that handles requests', () => {
    it('supports using addEventListener with function', () => {
      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`
          self.addEventListener('fetch', function (event) {
            event.respondWith(fetch(event.request))
          })`,
        { 'Content-Type': 'application/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })

    it('supports using addEventListener with object', () => {
      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`
          const obj = {
            handleEvent: function (event) {
              event.respondWith(fetch(event.request))
            }
          }
          self.addEventListener('fetch', obj)`,
        { 'Content-Type': 'application/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })

    it('supports using addEventListener with delayed handleEvent', () => {
      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`
          const obj = {}
          self.addEventListener('fetch', obj)
          obj.handleEvent = function (event) {
            event.respondWith(fetch(event.request))
          }`,
        { 'Content-Type': 'application/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })

    it('supports using onfetch', () => {
      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`
          self.onfetch = function (event) {
            event.respondWith(fetch(event.request))
          }`,
        { 'Content-Type': 'application/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })
  })

  describe('a service worker that does not handle requests', () => {
    it('supports using addEventListener', () => {
      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`
          self.addEventListener('fetch', function (event) {
            return
          })`,
        { 'Content-Type': 'application/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })

    it('supports using onfetch', () => {
      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`
          self.onfetch = function (event) {
            return
          }`,
        { 'Content-Type': 'application/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })
  })

  describe('a service worker that removes fetch handlers', () => {
    it('supports using addEventListener', () => {
      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`
          const handler = function (event) {
            return new Response('Network error', {
              status: 400,
              headers: { 'Content-Type': 'text/plain' },
            })
          }

          self.addEventListener('fetch', handler)
          self.removeEventListener('fetch', handler)
          
          self.addEventListener('fetch', function (event) {
            return
          })`,
        { 'Content-Type': 'application/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })

    it('supports using onfetch', () => {
      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`
          self.onfetch = function (event) {
            event.respondWith(fetch(event.request))
          }
          self.onfetch = undefined
          
          self.onfetch = function (event) {
            event.respondWith(fetch(event.request))
          }`,
        { 'Content-Type': 'application/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })
  })

  describe('a service worker with multiple fetch handlers', () => {
    it('supports using addEventListener and onfetch', () => {
      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`
          self.addEventListener('fetch', function (event) {
            event.respondWith(fetch(event.request))
          })

          self.onfetch = function (event) {
            event.respondWith(fetch(event.request))
          }`,
        { 'Content-Type': 'application/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })
  })
})
