describe('service worker correlation', () => {
  beforeEach(async () => {
    // unregister the service worker to ensure it does not affect other tests
    const registrations = await navigator.serviceWorker.getRegistrations()

    await Promise.all(registrations.map((registration) => registration.unregister()))
  })

  describe('single request', () => {
    it('Traffic Goes Through Service Worker', () => {
      const script = () => {
        self.addEventListener('fetch', (event) => {
          event.respondWith(fetch(event.request))
        })
      }

      cy.intercept('/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'application/javascript' })
      })

      cy.visit('/fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      cy.wait(500)
    })

    it('Traffic Does not Go Through Service Worker', () => {
      const script = () => {
        self.addEventListener('fetch', (event) => {
          return
        })
      }

      cy.intercept('/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'application/javascript' })
      })

      cy.visit('/fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      cy.wait(500)
    })

    it('Traffic is Preloaded in Service Worker & Traffic is Routed through and Served up by Service Worker\'s Cache', () => {
      const script = () => {
        const addResourcesToCache = async (resources) => {
          const cache = await caches.open('v1')

          await cache.addAll(resources)
        }

        self.addEventListener('install', (event) => {
          event.waitUntil(
            addResourcesToCache([
              new Request('/timeout', { headers: { 'x-cypress-source': 'service worker' } }),
            ]),
          )
        })

        const cacheFirst = async (request) => {
          const responseFromCache = await caches.match(request)

          if (responseFromCache) {
            return responseFromCache
          }

          return fetch(request)
        }

        self.addEventListener('fetch', (event) => {
          event.respondWith(cacheFirst(event.request))
        })
      }

      cy.intercept('/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'application/javascript' })
      })

      cy.visit('/fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      cy.wait(500)
    })
  })

  describe('multiple requests', () => {
    it('1. Page request sent (handled by Service Worker) and then Service Worker request', () => {
      const script = () => {
        self.addEventListener('fetch', function (event) {
          const response = fetch(event.request)

          if (event.request.url.includes('timeout')) {
            fetch('/timeout', { headers: { 'x-cypress-source': 'service worker', 'x-cypress-timeout': 100 } })
          }

          event.respondWith(response)
        })
      }

      cy.intercept('/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'application/javascript' })
      })

      cy.visit('/fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      cy.wait(500)
    })

    it('2. Service Worker request sent and then Page request (handled by Service Worker):', () => {
      const script = () => {
        self.addEventListener('fetch', function (event) {
          if (event.request.url.includes('timeout')) {
            fetch('/timeout', { headers: { 'x-cypress-source': 'service worker', 'x-cypress-timeout': 100 } })
          }

          const response = fetch(event.request)

          event.respondWith(response)
        })
      }

      cy.intercept('/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'application/javascript' })
      })

      cy.visit('/fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      cy.wait(500)
    })

    it('3. Page request sent (NOT handled by Service Worker) and then Service Worker request:', () => {
      const script = () => {
        self.addEventListener('fetch', function (event) {
          if (event.request.url.includes('timeout')) {
            fetch('/timeout', { headers: { 'x-cypress-source': 'service worker', 'x-cypress-timeout': 100 } })
          }

          return
        })
      }

      cy.intercept('/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'application/javascript' })
      })

      cy.visit('/fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      cy.wait(500)
    })
  })
})
