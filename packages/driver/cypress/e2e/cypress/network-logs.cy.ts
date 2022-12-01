import { expect } from 'chai'

describe('Network Logs', () => {
  const { _ } = Cypress

  const url = '/testFlag'
  const alias = 'aliasName'

  function testFlag (expectStatus, expectInterceptions, setupFn, getFn) {
    return () => {
      setupFn()

      let resolve
      const p = new Promise((_resolve) => resolve = _resolve)

      function testLog (log) {
        expect(log.alias).to.eq(expectInterceptions.length ? alias : undefined)
        expect(log.renderProps).to.deep.include({
          interceptions: expectInterceptions,
          ...(expectStatus ? { status: expectStatus } : {}),
        })

        resolve()
      }

      cy.then(() => {
        cy.on('log:changed', (log) => {
          if (['request', 'xhr'].includes(log.name)) {
            try {
              testLog(log)
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error('assertions failed:', err)
            }
          }
        })

        getFn(url)
      }).then(() => p)

      if (expectStatus) {
        cy.wait(`@${alias}`)
      }
    }
  }

  it('fetch log shows resource type, url, method, and status code and has expected snapshots and consoleProps', (done) => {
    fetch('/some-url')

    // trigger: Cypress.Log() called
    cy.once('log:added', (log) => {
      expect(log.snapshots).to.be.undefined
      expect(log.displayName).to.eq('fetch')
      expect(log.renderProps).to.include({
        indicator: 'pending',
        message: 'GET /some-url',
      })

      expect(log.consoleProps).to.include({
        Method: 'GET',
        'Resource Type': 'fetch',
        'Request went to origin?': 'yes',
        'URL': 'http://localhost:3500/some-url',
      })

      // case depends on browser
      const refererKey = _.keys(log.consoleProps['Request Headers']).find((k) => k.toLowerCase() === 'referer') || 'referer'

      expect(log.consoleProps['Request Headers']).to.include({
        [refererKey]: window.location.href,
      })

      expect(log.consoleProps).to.not.have.property('Response Headers')
      expect(log.consoleProps).to.not.have.property('Matched `cy.intercept()`')

      // trigger: .snapshot('request')
      cy.on('log:changed', (log) => {
        try {
          expect(log.snapshots.map((v) => v.name)).to.deep.eq(['request', 'response'])
          expect(log.consoleProps['Response Headers']).to.include({
            'x-powered-by': 'Express',
          })

          expect(log.consoleProps).to.not.have.property('Matched `cy.intercept()`')
          expect(log.renderProps).to.include({
            indicator: 'bad',
            message: 'GET 404 /some-url',
          })

          expect(Object.keys(log.consoleProps)).to.deep.eq(
            ['Event', 'Resource Type', 'Method', 'URL', 'Request went to origin?', 'Request Headers', 'Response Status Code', 'Response Headers'],
          )

          done()
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('log incorrect, retrying', err)
        }
      })
    })
  })

  it('does not log an unintercepted non-xhr/fetch request', (done) => {
    const img = new Image()
    const logs: any[] = []
    let imgLoaded = false

    cy.on('log:added', (log) => {
      if (imgLoaded) return

      logs.push(log)
    })

    img.onload = () => {
      imgLoaded = true
      expect(logs).to.have.length(0)
      done()
    }

    img.src = `/fixtures/media/cypress.png?${Date.now()}`
  })

  context('with custom filter rules', () => {
    afterEach(() => {
      Cypress.NetworkLogs.filter = undefined
      Cypress.NetworkLogs.showAllIntercepts = true
      Cypress.NetworkLogs.showAllXhrFetch = true
    })

    it('can ignore a fetch log and still display xhr logs', async () => {
      // disable default behavior of showing all XHRs and fetches
      Cypress.NetworkLogs.showAllXhrFetch = false
      // set a custom filter to show everything that's not fetch
      Cypress.NetworkLogs.filter = ({ resourceType, matchedIntercept }) => {
        expect(matchedIntercept).to.be.false

        return resourceType !== 'fetch'
      }

      let sawXhr = false

      cy.on('log:added', (log) => {
        expect(log.displayName).to.not.eq('fetch', 'no fetch logs should be emitted')
        if (log.displayName === 'xhr') sawXhr = true
      })

      await fetch('/')

      await Cypress.$.get('/')

      expect(sawXhr).to.be.true
    })

    it('can ignore an intercept log', () => {
      // disable default behavior of showing all XHRs and fetches
      Cypress.NetworkLogs.showAllXhrFetch = false
      // disable default behavior of showing all matched intercepts
      Cypress.NetworkLogs.showAllIntercepts = false
      // set a custom filter to show everything that's not an intercept
      Cypress.NetworkLogs.filter = (req) => {
        return !req.matchedIntercept
      }

      cy.on('log:added', (log) => {
        expect(log.displayName).to.not.eq('fetch', 'no fetch logs should be emitted')
      })

      cy.intercept('/').as('aliased')
      .then(() => {
        return fetch('/')
      })
      .wait('@aliased')
    })

    it('logs no requests if showAllXhrFetch and showAllIntercepts are both false', () => {
      Cypress.NetworkLogs.showAllXhrFetch = false
      Cypress.NetworkLogs.showAllIntercepts = false

      cy.on('log:added', (log) => {
        expect(log.name).to.not.eq('request', 'no request logs should be emitted')
      })

      cy.intercept('*').as('aliased')
      .then(async () => {
        await Promise.all([
          Cypress.$.get('/'),
          fetch('/'),
          new Promise((resolve) => {
            // should error, not load, since '/' isn't an image
            Cypress.$('<img src="/"/>')[0].addEventListener('error', resolve)
          }),
        ])
      })
      .get('@aliased.all').should('have.length', 3)
    })

    it('errors if set to a non-function', () => {
      try {
        // @ts-ignore
        Cypress.NetworkLogs.filter = 4
        throw new Error('should not reach')
      } catch (err) {
        expect(Cypress.NetworkLogs.filter).to.eq(undefined)
        expect(err.message).to.include('NetworkLogs.filter should be set to a function')
      }
    })
  })

  context('with cy.intercept()', () => {
    it('shows non-xhr/fetch log if intercepted', (done) => {
      const src = `/fixtures/media/cypress.png?${Date.now()}`

      cy.intercept('/fixtures/**/*.png*')
      .then(() => {
        cy.once('log:added', (log) => {
          expect(log.displayName).to.eq('image')
          expect(log.renderProps).to.include({
            indicator: 'pending',
            message: `GET ${src}`,
          })

          done()
        })

        const img = new Image()

        img.src = src
      })
    })

    it('shows cy.visit if intercepted', () => {
      cy.intercept('/fixtures/empty.html')
      .then(() => {
        // trigger: cy.visit()
        cy.once('log:added', (log) => {
          expect(log.name).to.eq('visit')
          // trigger: intercept Cypress.Log
          cy.once('log:added', (log) => {
            expect(log.displayName).to.eq('document')
          })
        })
      })
      .visit('/fixtures/empty.html')
    })

    it('intercept log has consoleProps with intercept info', (done) => {
      cy.intercept('/some-url', 'stubbed response').as('alias')
      .then(() => {
        fetch('/some-url')
      })

      cy.on('log:changed', (log) => {
        if (log.displayName !== 'fetch') return

        try {
          expect(log.renderProps).to.deep.include({
            message: 'GET 200 /some-url',
            indicator: 'successful',
            status: undefined,
            interceptions: [{
              alias: 'alias',
              command: 'intercept',
              type: 'stub',
            }],
          })

          expect(Object.keys(log.consoleProps)).to.deep.eq(
            ['Event', 'Resource Type', 'Method', 'URL', 'Request went to origin?', 'Matched `cy.intercept()`', 'Request Headers', 'Response Status Code', 'Response Headers', 'Response Body'],
          )

          const interceptProps = log.consoleProps['Matched `cy.intercept()`']

          expect(interceptProps).to.deep.eq({
            Alias: 'alias',
            Request: {
              method: 'GET',
              url: 'http://localhost:3500/some-url',
              body: '',
              httpVersion: '1.1',
              responseTimeout: Cypress.config('responseTimeout'),
              headers: interceptProps.Request.headers,
            },
            Response: {
              body: 'stubbed response',
              statusCode: 200,
              url: 'http://localhost:3500/some-url',
              headers: interceptProps.Response.headers,
            },
            RouteMatcher: {
              url: '/some-url',
            },
            RouteHandler: 'stubbed response',
            'RouteHandler Type': 'StaticResponse stub',
          })

          done()
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('log incorrect, retrying', error)
        }
      })
    })

    // TODO(webkit): fix forceNetworkError and unskip
    it('works with forceNetworkError', { browser: '!webkit' }, () => {
      const logs: any[] = []

      cy.on('log:added', (log) => {
        if (log.displayName === 'fetch') {
          logs.push(log)
        }
      })

      cy.intercept('/foo', { forceNetworkError: true }).as('alias')
      .then(() => {
        return fetch('/foo')
        .catch(() => {})
      })
      .wrap(logs)
      .should((logs) => {
        // retries...
        expect(logs).to.have.length.greaterThan(0)

        for (const log of logs) {
          expect(log.err).to.include({ name: 'Error' })
          expect(log.consoleProps['Error']).to.be.an('Error')
          expect(log.snapshots.map((v) => v.name)).to.deep.eq(['request', 'error'])
          expect(log.state).to.eq('failed')
        }
      })
    })

    context('flags', () => {
      const testFlagFetch = (expectStatus, expectInterceptions, setupFn) => {
        return testFlag(expectStatus, expectInterceptions, setupFn, (url) => fetch(url))
      }

      it('is unflagged when not intercepted', testFlagFetch(
        undefined,
        [],
        () => {},
      ))

      it('spied flagged as expected', testFlagFetch(
        undefined,
        [{
          command: 'intercept',
          alias,
          type: 'spy',
        }],
        () => {
          cy.intercept(url).as(alias)
        },
      ))

      it('spy function flagged as expected', testFlagFetch(
        undefined,
        [{
          command: 'intercept',
          alias,
          type: 'function',
        }],
        () => {
          cy.intercept(url, () => {}).as(alias)
        },
      ))

      it('stubbed flagged as expected', testFlagFetch(
        undefined,
        [{
          command: 'intercept',
          alias,
          type: 'stub',
        }],
        () => {
          cy.intercept(url, 'stubbed response').as(alias)
        },
      ))

      it('stubbed flagged as expected with req.reply', testFlagFetch(
        undefined,
        [{
          command: 'intercept',
          alias,
          type: 'function',
        }],
        () => {
          cy.intercept(url, (req) => {
            req.headers.foo = 'bar'
            req.reply('stubby mc stub')
          }).as(alias)
        },
      ))

      it('req modified flagged as expected', testFlagFetch(
        'req modified',
        [{
          command: 'intercept',
          alias,
          type: 'function',
        }],
        () => {
          cy.intercept(url, (req) => {
            req.headers.foo = 'bar'
          }).as(alias)
        },
      ))

      it('res modified flagged as expected', testFlagFetch(
        'res modified',
        [{
          command: 'intercept',
          alias,
          type: 'function',
        }],
        () => {
          cy.intercept(url, (req) => {
            req.continue((res) => {
              res.headers.foo = 'bar'
            })
          }).as(alias)
        },
      ))

      it('req + res modified flagged as expected', testFlagFetch(
        'req + res modified',
        [{
          command: 'intercept',
          alias,
          type: 'function',
        }],
        () => {
          cy.intercept(url, (req) => {
            req.headers.foo = 'bar'
            req.continue((res) => {
              res.headers.foo = 'bar'
            })
          }).as(alias)
        },
      ))
    })
  })
})
