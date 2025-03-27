// decrease the timeouts to ensure we don't hit the 2s correlation timeout
describe('service workers', { defaultCommandTimeout: 1000, pageLoadTimeout: 1000 }, () => {
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

  const detachFromTarget = async () => {
    await Cypress.automation('remote:debugger:protocol', { command: 'Target.detachFromTarget', params: { sessionId } })
  }

  const validateFetchHandlers = ({ listenerCount, onFetchHandlerType }) => {
    // skip validation in non-Chromium and electron browsers
    // non-Chromium browsers do not fully support the remote debugger protocol
    // possibly remove the electron check on https://github.com/cypress-io/cypress/issues/2118 is resolved
    if (Cypress.browser.family !== 'chromium' || Cypress.browser.name === 'electron') {
      cy.log('Skipping fetch handlers validation in non-Chromium and electron browsers')

      return
    }

    cy.then(() => {
      cy.wrap(getEventListenersLength()).should('equal', listenerCount).then(() => {
        if (onFetchHandlerType) cy.wrap(getOnFetchHandlerType()).should('equal', onFetchHandlerType)
      }).then(() => {
        cy.wrap(detachFromTarget())
      })
    })
  }

  const unregisterServiceWorker = () => {
    cy.wrap(navigator.serviceWorker.getRegistrations()).then((registrations) => {
      cy.wrap(Promise.all(registrations.map((registration) => registration.unregister())))
    })
  }

  beforeEach(() => {
    sessionId = null

    // unregister the service worker to ensure it does not affect other tests
    unregisterServiceWorker()
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
          { 'Content-Type': 'text/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      validateFetchHandlers({ listenerCount: 1 })
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
          { 'Content-Type': 'text/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      validateFetchHandlers({ listenerCount: 1 })
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
          { 'Content-Type': 'text/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      validateFetchHandlers({ listenerCount: 1 })
    })

    it('adds both listeners when addEventListener and onfetch use the same listener', () => {
      const script = () => {
        const listener = function (event) {
          event.respondWith(fetch(event.request))
        }

        self.onfetch = listener
        self.addEventListener('fetch', listener)
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'text/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      // onfetch will add an event listener
      validateFetchHandlers({ listenerCount: 2, onFetchHandlerType: 'function' })
    })

    it('supports using onfetch', () => {
      const script = () => {
        self.onfetch = function (event) {
          event.respondWith(fetch(event.request))
        }
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'text/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      // onfetch will add an event listener
      validateFetchHandlers({ listenerCount: 1, onFetchHandlerType: 'function' })
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
          { 'Content-Type': 'text/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      validateFetchHandlers({ listenerCount: 1 })
    })

    it('supports using onfetch', () => {
      const script = () => {
        self.onfetch = function (event) {
          return
        }
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'text/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      // onfetch will add an event listener
      validateFetchHandlers({ listenerCount: 1, onFetchHandlerType: 'function' })
    })

    it('does not add a null listener', () => {
      const script = () => {
        // does not add the listener because it is null
        self.addEventListener('fetch', null)
        // does not add the listener because it is undefined
        self.addEventListener('fetch', undefined)

        // adds the listener because it is a function
        self.addEventListener('fetch', () => {
          return
        })
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'text/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      validateFetchHandlers({ listenerCount: 1 })
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
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'text/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      validateFetchHandlers({ listenerCount: 0 })
    })

    it('supports removing event listener on delay', () => {
      const script = () => {
        const handler = function (event) {
          return new Response('Network error', {
            status: 400,
            headers: { 'Content-Type': 'text/plain' },
          })
        }

        self.addEventListener('fetch', handler)
        // remove the listener after a delay
        setTimeout(() => {
          self.removeEventListener('fetch', handler)
        }, 0)
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'text/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      validateFetchHandlers({ listenerCount: 0 })
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
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'text/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      validateFetchHandlers({ listenerCount: 0 })
    })

    it('does not fail when removing a non-existent listener', () => {
      const script = () => {
        const listener = function (event) {
          return
        }

        self.addEventListener('fetch', listener)

        // this does not remove the listener because the listener is not the same function
        self.removeEventListener('fetch', function (event) {
          return
        })
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'text/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      validateFetchHandlers({ listenerCount: 1 })
    })

    it('does not fail when removing a null listener', () => {
      const script = () => {
        self.addEventListener('fetch', () => {
          return
        })

        self.removeEventListener('fetch', null)
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'text/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      validateFetchHandlers({ listenerCount: 1 })
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
          { 'Content-Type': 'text/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      // onfetch will add an event listener
      validateFetchHandlers({ listenerCount: 2, onFetchHandlerType: 'function' })
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
          { 'Content-Type': 'text/javascript' })
      })

      cy.visit('fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
      validateFetchHandlers({ listenerCount: 2 })
    })
  })

  describe('multiple concurrent requests', () => {
    it('page request sent (handled by service worker) and then service worker request', () => {
      const script = () => {
        self.addEventListener('fetch', function (event) {
          const response = fetch(event.request)

          // send a request from the service worker after the page request
          if (event.request.url.includes('timeout')) {
            fetch('/timeout').catch(() => {})
          }

          event.respondWith(response)
        })
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'text/javascript' })
      })

      cy.visit('/fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })

    it('service worker request sent and then page request (handled by service worker):', () => {
      const script = () => {
        self.addEventListener('fetch', function (event) {
          // send a request from the service worker before the page request
          if (event.request.url.includes('timeout')) {
            fetch('/timeout').catch(() => {})
          }

          const response = fetch(event.request)

          event.respondWith(response)
        })
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'text/javascript' })
      })

      cy.visit('/fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })

    it('page request sent (NOT handled by service worker) and then service worker request:', () => {
      const script = () => {
        self.addEventListener('fetch', function (event) {
          if (event.request.url.includes('timeout')) {
            fetch('/timeout').catch(() => {})
          }

          return
        })
      }

      cy.intercept('/fixtures/service-worker.js', (req) => {
        req.reply(`(${script})()`,
          { 'Content-Type': 'text/javascript' })
      })

      cy.visit('/fixtures/service-worker.html')
      cy.get('#output').should('have.text', 'done')
    })
  })

  it('supports aborted listeners', () => {
    const script = () => {
      const alreadyAborted = new AbortController()

      alreadyAborted.abort()

      // this one does not get added because the signal is aborted before adding the listener
      self.addEventListener('fetch', () => {
        return
      }, { signal: alreadyAborted.signal })

      const notAborted = new AbortController()

      // this one gets added because the signal is not aborted
      self.addEventListener('fetch', (event) => {
        event.respondWith(fetch(event.request))
      }, { signal: notAborted.signal })

      const aborted = new AbortController()

      // this one gets added but then immediately removed because the signal is aborted after adding the listener
      self.addEventListener('fetch', (event) => {
        event.respondWith(fetch(event.request))
      }, { signal: aborted.signal })

      aborted.abort()
    }

    cy.intercept('/fixtures/service-worker.js', (req) => {
      req.reply(`(${script})()`,
        { 'Content-Type': 'text/javascript' })
    })

    cy.visit('fixtures/service-worker.html')
    cy.get('#output').should('have.text', 'done')
    validateFetchHandlers({ listenerCount: 1 })
  })

  it('supports changing the handleEvent function', () => {
    const script = () => {
      const listener = {
        handleEvent (event) {
          event.respondWith(new Response('Network error', {
            status: 400,
            headers: { 'Content-Type': 'text/plain' },
          }))
        },
      }

      self.addEventListener('fetch', listener)

      listener.handleEvent = function (event) {
        event.respondWith(fetch(event.request))
      }
    }

    cy.intercept('/fixtures/service-worker.js', (req) => {
      req.reply(`(${script})()`,
        { 'Content-Type': 'text/javascript' })
    })

    cy.visit('fixtures/service-worker.html')
    cy.get('#output').should('have.text', 'done')
    validateFetchHandlers({ listenerCount: 1 })
  })

  it('supports changing the handleEvent function prior to adding', () => {
    const script = () => {
      const listener = {
        handleEvent (event) {
          event.respondWith(new Response('Network error', {
            status: 400,
            headers: { 'Content-Type': 'text/plain' },
          }))
        },
      }

      listener.handleEvent = function (event) {
        event.respondWith(fetch(event.request))
      }

      self.addEventListener('fetch', listener)
    }

    cy.intercept('/fixtures/service-worker.js', (req) => {
      req.reply(`(${script})()`,
        { 'Content-Type': 'text/javascript' })
    })

    cy.visit('fixtures/service-worker.html')
    cy.get('#output').should('have.text', 'done')
    validateFetchHandlers({ listenerCount: 1 })
  })

  it('succeeds when there are no listeners', () => {
    const script = () => {}

    cy.intercept('/fixtures/service-worker.js', (req) => {
      req.reply(`(${script})()`,
        { 'Content-Type': 'text/javascript' })
    })

    cy.visit('fixtures/service-worker.html')
    cy.get('#output').should('have.text', 'done')
    validateFetchHandlers({ listenerCount: 0 })
  })

  it('supports caching', () => {
    const script = () => {
      self.addEventListener('install', function (event) {
        event.waitUntil(
          caches.open('v1').then(function (cache) {
            return cache.addAll([
              '/fixtures/1mb',
            ])
          }),
        )
      })

      self.addEventListener('fetch', function (event) {
        event.respondWith(
          caches.match(event.request).then(function (response) {
            return response || fetch(event.request)
          }),
        )
      })
    }

    cy.intercept('/fixtures/service-worker.js', (req) => {
      req.reply(`(${script})()`,
        { 'Content-Type': 'text/javascript' })
    })

    cy.visit('fixtures/service-worker.html').then(async (win) => {
      const response = await win.fetch('/1mb')

      expect(response.ok).to.be.true
    })

    cy.get('#output').should('have.text', 'done')
    validateFetchHandlers({ listenerCount: 1 })
  })

  it('supports clients.claim', () => {
    const script = () => {
      self.addEventListener('activate', (event) => {
        event.waitUntil(self.clients.claim())
      })

      self.addEventListener('fetch', function (event) {
        event.respondWith(fetch(event.request))
      })
    }

    cy.intercept('/fixtures/service-worker.js', (req) => {
      req.reply(`(${script})()`,
        { 'Content-Type': 'text/javascript' })
    })

    cy.visit('fixtures/service-worker.html')

    cy.get('#output').should('have.text', 'done')
    validateFetchHandlers({ listenerCount: 1 })
  })

  it('supports async fetch handler', () => {
    const script = () => {
      self.addEventListener('fetch', async function (event) {
        await Promise.resolve()
        event.respondWith(fetch(event.request))
      })
    }

    cy.intercept('/fixtures/service-worker.js', (req) => {
      req.reply(`(${script})()`,
        { 'Content-Type': 'text/javascript' })
    })

    cy.visit('fixtures/service-worker.html')

    cy.get('#output').should('have.text', 'done')
    validateFetchHandlers({ listenerCount: 1 })
  })

  it('does not fail when the listener throws an error', () => {
    const script = () => {
      self.addEventListener('fetch', function (event) {
        throw new Error('Error in fetch listener')
      })
    }

    cy.intercept('/fixtures/service-worker.js', (req) => {
      req.reply(`(${script})()`,
        { 'Content-Type': 'text/javascript' })
    })

    cy.visit('fixtures/service-worker.html')

    cy.get('#output').should('have.text', 'done')
    validateFetchHandlers({ listenerCount: 1 })
  })

  it('supports a service worker that is activated but not handling fetch events', () => {
    const script = () => {
      self.addEventListener('fetch', function (event) {
        event.respondWith(fetch(event.request))
      })
    }

    cy.intercept('/fixtures/service-worker.js', (req) => {
      req.reply(`(${script})()`,
        { 'Content-Type': 'text/javascript' })
    })

    cy.visit('fixtures/service-worker.html?skipReload')

    cy.get('#output').should('have.text', 'done')
    validateFetchHandlers({ listenerCount: 1 })
  })

  it('supports a redirected request', () => {
    const script = () => {
      self.addEventListener('fetch', function (event) {
        return
      })
    }

    cy.intercept('/fixtures/service-worker.js', (req) => {
      req.reply(`(${script})()`,
        { 'Content-Type': 'text/javascript' })
    })

    cy.intercept('/fixtures/1mb*', (req) => {
      req.reply({
        statusCode: 302,
        headers: {
          location: '/fixtures/redirected',
        },
      })
    })

    cy.intercept('/fixtures/redirected', (req) => {
      req.reply('redirected')
    })

    cy.visit('fixtures/service-worker.html')
    cy.get('#output', {
      // request takes a little longer with WebDriver BiDi to return (Firefox 135+ only)
      timeout: 8000,
    }).should('have.text', 'done')
  })
})
