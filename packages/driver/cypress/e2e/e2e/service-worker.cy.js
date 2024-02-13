describe('service workers', () => {
  beforeEach(async () => {
    // unregister the service worker to ensure it does not affect other tests
    const registrations = await navigator.serviceWorker.getRegistrations()

    await Promise.all(registrations.map((registration) => registration.unregister()))
  })

  describe('a service worker that handles requests', () => {
    it('supports using addEventListener with function', () => {
      const script = () => {
        self.addEventListener('fetch', function (event) {
          event.respondWith(fetch(event.request))
        })
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'application/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })

    it('supports using addEventListener with object', () => {
      const script = () => {
        const obj = {
          handleEvent (event) {
            event.respondWith(fetch(event.request))
          },
        }

        self.addEventListener('fetch', obj)
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'application/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })

    it('supports using addEventListener with delayed handleEvent', () => {
      const script = () => {
        const obj = {}

        self.addEventListener('fetch', obj)
        obj.handleEvent = function (event) {
          event.respondWith(fetch(event.request))
        }
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'application/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })

    it('supports using onfetch', () => {
      const script = () => {
        self.onfetch = function (event) {
          event.respondWith(fetch(event.request))
        }
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'application/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })
  })

  describe('a service worker that does not handle requests', () => {
    it('supports using addEventListener', () => {
      const script = () => {
        self.addEventListener('fetch', function (event) {
          return
        })
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'application/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })

    it('supports using onfetch', () => {
      const script = () => {
        self.onfetch = function (event) {
          return
        }
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'application/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })
  })

  describe('a service worker that removes fetch handlers', () => {
    it('supports using addEventListener', () => {
      const script = () => {
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
        })
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'application/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })

    it('supports using onfetch', () => {
      const script = () => {
        self.onfetch = function (event) {
          return new Response('Network error', {
            status: 400,
            headers: { 'Content-Type': 'text/plain' },
          })
        }

        self.onfetch = undefined

        self.onfetch = function (event) {
          return
        }
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'application/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })
  })

  describe('a service worker with multiple fetch handlers', () => {
    it('supports using addEventListener and onfetch', () => {
      const script = () => {
        self.addEventListener('fetch', function (event) {
          event.respondWith(fetch(event.request))
        })

        self.onfetch = function (event) {
          event.respondWith(fetch(event.request))
        }
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'application/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })
  })
})
