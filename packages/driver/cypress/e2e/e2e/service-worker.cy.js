describe('service workers', () => {
  let sessionId

  const getSessionId = async () => {
    if (!sessionId) {
      const targets = (await Cypress.automation('remote:debugger:protocol', { command: 'Target.getTargets', params: {} })).targetInfos
      const serviceWorkerTarget = targets.reverse().find((target) => target.type === 'service_worker' && target.url === 'http://localhost:3500/fixtures/service-worker.js')

      ;({ sessionId } = await Cypress.automation('remote:debugger:protocol', { command: 'Target.attachToTarget', params: { targetId: serviceWorkerTarget.targetId, flatten: true } }))
    }

    return sessionId
  }

  const getEventListenersLength = async () => {
    const sessionId = await getSessionId()
    let result = await Cypress.automation('remote:debugger:protocol', { command: 'Runtime.evaluate', params: { expression: 'getEventListeners(self).fetch', includeCommandLineAPI: true }, sessionId })

    if (result.result.type === 'undefined') return 0

    result = await Cypress.automation('remote:debugger:protocol', { command: 'Runtime.getProperties', params: { objectId: result.result.objectId }, sessionId })

    const length = result.result.find((prop) => prop.name === 'length').value.value

    return length
  }

  const getOnFetchHandlerType = async () => {
    const sessionId = await getSessionId()

    const result = await Cypress.automation('remote:debugger:protocol', { command: 'Runtime.evaluate', params: { expression: 'self.onfetch', includeCommandLineAPI: true }, sessionId })

    return result.result.type
  }

  beforeEach(async () => {
    sessionId = null

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
      cy.then(async () => {
        expect(await getEventListenersLength()).to.equal(1)
      })
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
      cy.then(async () => {
        expect(await getEventListenersLength()).to.equal(1)
      })
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
      cy.then(async () => {
        expect(await getEventListenersLength()).to.equal(1)
      })
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
      cy.then(async () => {
        // onfetch will add an event listener
        expect(await getEventListenersLength()).to.equal(1)
        expect(await getOnFetchHandlerType()).to.equal('function')
      })
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
      cy.then(async () => {
        expect(await getEventListenersLength()).to.equal(1)
      })
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
      cy.then(async () => {
        // onfetch will add an event listener
        expect(await getEventListenersLength()).to.equal(1)
        expect(await getOnFetchHandlerType()).to.equal('function')
      })
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
      cy.then(async () => {
        expect(await getEventListenersLength()).to.equal(1)
      })
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
      cy.then(async () => {
        // onfetch will add an event listener
        expect(await getEventListenersLength()).to.equal(1)
        expect(await getOnFetchHandlerType()).to.equal('function')
      })
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
      cy.then(async () => {
        // onfetch will also add an event listener
        expect(await getEventListenersLength()).to.equal(2)
        expect(await getOnFetchHandlerType()).to.equal('function')
      })
    })

    it('supports other options', () => {
      const script = () => {
        const handler = function (event) {
          event.respondWith(fetch(event.request))
        }

        self.addEventListener('fetch', handler)

        // this one does not get added because capture is the same
        self.addEventListener('fetch', handler, { capture: false })

        // this one gets added because capture is different
        self.addEventListener('fetch', handler, { capture: true })

        // this one does not get added because capture is the same
        self.addEventListener('fetch', handler, { once: true })
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'application/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      cy.then(async () => {
        expect(await getEventListenersLength()).to.equal(2)
      })
    })
  })
})
